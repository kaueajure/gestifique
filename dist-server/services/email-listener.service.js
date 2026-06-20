import cron from 'node-cron';
import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import pool from '../db/connection.js';
import ticketsService from './tickets.service.js';
import attachmentsService from './attachments.service.js';
import storageService from './storage.service.js';
import { env } from '../config/env.js';
import { io } from '../server.js';
import path from 'path';
function normalizeEmailAddress(value) {
    if (!value)
        return null;
    const lowered = value.toLowerCase().trim();
    const match = lowered.match(/<([^>]+)>/);
    return (match ? match[1] : lowered).trim();
}
function extractTicketIdFromGestifiqueMessageId(value) {
    if (!value)
        return null;
    const raw = Array.isArray(value) ? value.join(' ') : String(value);
    const match = raw.match(/ticket-(\d+)(?:-|@)/i);
    if (!match)
        return null;
    const id = Number(match[1]);
    return Number.isInteger(id) && id > 0 ? id : null;
}
function looksLikeGestifiqueTicketThread(subject, parsed) {
    const normalizedSubject = subject || '';
    const hasTicketSubject = /\[Ticket\s*#\d+\]/i.test(normalizedSubject) ||
        /Chamado\s*#\d+/i.test(normalizedSubject) ||
        /Ticket\s*#\d+/i.test(normalizedSubject);
    const hasGestifiqueHeader = !!parsed.headers.get('x-gestifique-ticket-id');
    const refs = [
        parsed.messageId,
        parsed.inReplyTo,
        ...(Array.isArray(parsed.references) ? parsed.references : parsed.references ? [parsed.references] : [])
    ].filter(Boolean).join(' ');
    const hasGestifiqueMessageId = /ticket-\d+(?:-|@)/i.test(refs);
    return hasTicketSubject || hasGestifiqueHeader || hasGestifiqueMessageId;
}
export class EmailListenerService {
    static connection = null;
    static isProcessing = false;
    static init() {
        if (!env.IMAP.HOST || !env.IMAP.USER || !env.IMAP.PASS) {
            console.warn('[Email Listener] Missing IMAP credentials, skipping init.');
            return;
        }
        // Connect and start IDLE
        this.connect();
        // Heartbeat Cron: Run every 15 minutes to ensure connection is alive
        cron.schedule('*/15 * * * *', async () => {
            console.log('[Email Listener] Heartbeat check...');
            if (!this.connection || !this.connection.imap || this.connection.imap.state === 'disconnected') {
                console.warn('[Email Listener] Connection dead in heartbeat. Reconnecting...');
                this.reconnect();
            }
        });
    }
    static async connect() {
        const config = {
            imap: {
                user: env.IMAP.USER,
                password: env.IMAP.PASS,
                host: env.IMAP.HOST,
                port: env.IMAP.PORT ? Number(env.IMAP.PORT) : 993,
                tls: true,
                tlsOptions: { rejectUnauthorized: !env.MAIL_TLS_INSECURE },
                authTimeout: 15000,
                keepalive: true
            }
        };
        try {
            console.log('[IMAP] Tentando conectar à caixa de entrada (IDLE mode)...');
            this.connection = await imaps.connect(config);
            await this.connection.openBox('INBOX');
            console.log('[IMAP] Ligação estabelecida e IDLE ativo.');
            // Process existing unseen emails on startup
            await this.processInbox();
            // Listen for new mail
            this.connection.imap.on('mail', (numNewMsgs) => {
                console.log(`[IMAP IDLE] ⚡ ${numNewMsgs} novo(s) e-mail(s) detectado(s) em tempo real!`);
                this.processInbox();
            });
            // Handle connection issues
            this.connection.imap.on('error', (err) => {
                console.error('[IMAP ERROR] Erro na conexão imap:', err);
                this.reconnect();
            });
            this.connection.imap.on('end', () => {
                console.warn('[IMAP WARN] Conexão encerrada pelo servidor.');
                this.reconnect();
            });
        }
        catch (e) {
            console.error('[IMAP ERROR] Falha ao conectar:', e);
            this.reconnect();
        }
    }
    static reconnect() {
        if (this.connection) {
            try {
                this.connection.imap.removeAllListeners();
                this.connection.end();
            }
            catch (e) { }
            this.connection = null;
        }
        console.log('[IMAP] Agendando reconexão em 10 segundos...');
        setTimeout(() => {
            this.connect();
        }, 10000);
    }
    static async logSystem(empresa_id, acao, descricao) {
        try {
            await pool.query('INSERT INTO logs_sistema (empresa_id, acao, descricao, user_agent, ip) VALUES (?, ?, ?, ?, ?)', [empresa_id, acao, descricao, 'SYSTEM_EMAIL_LISTENER', '127.0.0.1']);
        }
        catch (e) {
            console.error('[Email Listener] Error writing system log:', e);
        }
    }
    static async processInbox() {
        if (this.isProcessing)
            return;
        if (!this.connection)
            return;
        this.isProcessing = true;
        try {
            console.log('[IMAP] Processando e-mails não lidos...');
            const searchCriteria = ['UNSEEN'];
            const fetchOptions = {
                bodies: [''],
                markSeen: false
            };
            const messages = await this.connection.search(searchCriteria, fetchOptions);
            console.log(`[IMAP] Encontrados ${messages.length} e-mails não lidos (UNSEEN).`);
            if (messages.length === 0) {
                return;
            }
            for (const item of messages) {
                const uid = item.attributes.uid;
                let senderEmailStr = 'unknown';
                try {
                    const bodyPart = item.parts.find((part) => part.which === '');
                    if (!bodyPart)
                        continue;
                    const parsed = await simpleParser(bodyPart.body);
                    const messageId = parsed.messageId;
                    const fromObj = parsed.from?.value[0];
                    const senderEmail = fromObj?.address?.toLowerCase();
                    senderEmailStr = senderEmail || 'unknown';
                    const senderName = fromObj?.name || senderEmail || 'Sem Nome';
                    const subject = parsed.subject || 'Sem Assunto';
                    // 1. Deduplication using messageId from database
                    if (messageId) {
                        const [processed] = await pool.query('SELECT ticket_id FROM processed_emails WHERE message_id = ? LIMIT 1', [messageId]);
                        if (processed.length > 0) {
                            console.log(`[Email Listener] Email already processed: ${messageId}. Skipping.`);
                            await this.connection.addFlags(uid, '\\Seen');
                            continue;
                        }
                    }
                    // 2. Identify existing ticket (Reply check)
                    let targetTicketId = null;
                    let targetEmpresaId = null;
                    let matchedChannelId = null;
                    console.log(`[Email Listener] [UID:${uid}] Processing message from ${senderEmail}: "${subject}" (MessageID: ${messageId})`);
                    const identifyTicket = async () => {
                        // A) By X-Gestifique-Ticket-ID in headers
                        const headerTicketIdStr = parsed.headers.get('x-gestifique-ticket-id');
                        if (headerTicketIdStr && typeof headerTicketIdStr === 'string' && !isNaN(parseInt(headerTicketIdStr))) {
                            const id = parseInt(headerTicketIdStr);
                            const [rows] = await pool.query('SELECT id, empresa_id FROM tickets WHERE id = ? LIMIT 1', [id]);
                            if (rows.length > 0) {
                                console.log(`[Email Listener] Identified existing ticket #${id} via X-Gestifique-Ticket-ID header.`);
                                return { ticketId: id, companyId: rows[0].empresa_id, hadExplicitTicketReference: true };
                            }
                            else {
                                console.warn(`[Email Listener] X-Gestifique-Ticket-ID header indicated ticket #${id} but it does not exist.`);
                                return { ticketId: null, companyId: null, hadExplicitTicketReference: true, invalidTicketId: id };
                            }
                        }
                        // B) By [Ticket #ID], Chamado #ID, etc in subject
                        const subjectMatch = subject.match(/(?:\[Ticket\s*#(\d+)\]|Chamado\s*#(\d+)|Ticket\s*#(\d+))/i);
                        if (subjectMatch) {
                            const id = parseInt(subjectMatch[1] || subjectMatch[2] || subjectMatch[3]);
                            const [rows] = await pool.query('SELECT id, empresa_id FROM tickets WHERE id = ? LIMIT 1', [id]);
                            if (rows.length > 0) {
                                console.log(`[Email Listener] Identified existing ticket #${id} via Subject.`);
                                return { ticketId: id, companyId: rows[0].empresa_id, hadExplicitTicketReference: true };
                            }
                            else {
                                console.warn(`[Email Listener] Subject indicated ticket #${id} but it does not exist.`);
                                return { ticketId: null, companyId: null, hadExplicitTicketReference: true, invalidTicketId: id };
                            }
                        }
                        // C) Try pattern-based extraction on messageId / inReplyTo / references before falling back to processed_emails table
                        const inReplyTo = parsed.inReplyTo;
                        const references = Array.isArray(parsed.references) ? parsed.references : (parsed.references ? [parsed.references] : []);
                        const candidates = [
                            parsed.messageId,
                            inReplyTo,
                            ...references
                        ].filter(Boolean);
                        for (const candidate of candidates) {
                            const extractedTicketId = extractTicketIdFromGestifiqueMessageId(candidate);
                            if (extractedTicketId) {
                                const [rows] = await pool.query('SELECT id, empresa_id FROM tickets WHERE id = ? LIMIT 1', [extractedTicketId]);
                                if (rows.length > 0) {
                                    console.log(`[Email Listener] Identified existing ticket #${extractedTicketId} via Gestifique Message-ID pattern.`);
                                    return { ticketId: extractedTicketId, companyId: rows[0].empresa_id, hadExplicitTicketReference: true };
                                }
                                else {
                                    console.warn(`[Email Listener] Gestifique Message-ID pattern indicated ticket #${extractedTicketId} but it does not exist.`);
                                    return { ticketId: null, companyId: null, hadExplicitTicketReference: true, invalidTicketId: extractedTicketId };
                                }
                            }
                        }
                        // D) By In-Reply-To or References headers inside processed_emails table
                        const allRefs = [inReplyTo, ...references].filter(r => !!r);
                        if (allRefs.length > 0) {
                            const [refMatch] = await pool.query(`SELECT ticket_id FROM processed_emails WHERE message_id IN (?) ORDER BY created_at DESC LIMIT 1`, [allRefs]);
                            if (refMatch.length > 0) {
                                const dbTicketId = refMatch[0].ticket_id;
                                const [rows] = await pool.query('SELECT id, empresa_id FROM tickets WHERE id = ? LIMIT 1', [dbTicketId]);
                                if (rows.length > 0) {
                                    console.log(`[Email Listener] Identified existing ticket #${dbTicketId} via headers (References DB).`);
                                    return { ticketId: dbTicketId, companyId: rows[0].empresa_id, hadExplicitTicketReference: false };
                                }
                                else {
                                    console.warn(`[Email Listener] DB references indicated ticket #${dbTicketId} but it does not exist.`);
                                    return { ticketId: null, companyId: null, hadExplicitTicketReference: true, invalidTicketId: dbTicketId };
                                }
                            }
                        }
                        return { ticketId: null, companyId: null, hadExplicitTicketReference: false };
                    };
                    const identificationResult = await identifyTicket();
                    targetTicketId = identificationResult.ticketId;
                    targetEmpresaId = identificationResult.companyId;
                    if (identificationResult.hadExplicitTicketReference && !targetTicketId) {
                        const invalidId = identificationResult.invalidTicketId || 'Desconhecido';
                        console.warn(`[Email Listener] [UID:${uid}] Email had explicit reference to non-existent ticket #${invalidId}. Skipping processing to prevent duplicate tickets.`);
                        await this.logSystem(null, 'EMAIL_TICKET_REFERENCE_NOT_FOUND', `E-mail de ${senderEmail} com referência explícita para o ticket inválido/inexistente #${invalidId}. Ignorado para prevenção de duplicidade.`);
                        await this.connection.addFlags(uid, '\\Seen');
                        continue;
                    }
                    // 3. Identify Recipient Company/Channel if not already found via ticket
                    let potentialRecipients = [];
                    const extractAddresses = (field) => {
                        if (!field)
                            return [];
                        if (Array.isArray(field)) {
                            return field.flatMap(f => extractAddresses(f));
                        }
                        if (field.value && Array.isArray(field.value)) {
                            return field.value.map((v) => v.address).filter(Boolean);
                        }
                        if (typeof field === 'string') {
                            // Try to extract email from "Name <email@domain.com>"
                            const match = field.match(/<(.+?)>/);
                            return [match ? match[1].toLowerCase().trim() : field.toLowerCase().trim()];
                        }
                        if (field.address)
                            return [field.address.toLowerCase().trim()];
                        return [];
                    };
                    potentialRecipients.push(...extractAddresses(parsed.to));
                    potentialRecipients.push(...extractAddresses(parsed.cc));
                    potentialRecipients.push(...extractAddresses(parsed.bcc));
                    // Check common standard headers for original recipient
                    const headerKeys = ['delivered-to', 'x-original-to', 'envelope-to', 'x-forwarded-to', 'apparently-to', 'x-real-to'];
                    for (const key of headerKeys) {
                        const val = parsed.headers.get(key);
                        potentialRecipients.push(...extractAddresses(val));
                    }
                    potentialRecipients = [...new Set(potentialRecipients.filter(a => !!a).map(a => a.toLowerCase().trim()))];
                    console.log(`[Email Listener] [UID:${uid}] Detected recipients: ${potentialRecipients.join(', ')}`);
                    if (!targetEmpresaId) {
                        if (potentialRecipients.length > 0) {
                            // Try normalized inbound_address first
                            const [canaisMatch] = await pool.query('SELECT id, empresa_id, status FROM empresa_email_canais WHERE LOWER(inbound_address) IN (?) OR LOWER(email_publico) IN (?) LIMIT 1', [potentialRecipients, potentialRecipients]);
                            if (canaisMatch.length > 0) {
                                matchedChannelId = canaisMatch[0].id;
                                targetEmpresaId = canaisMatch[0].empresa_id;
                                console.log(`[Email Listener] [UID:${uid}] Matched channel ID ${matchedChannelId} for company ${targetEmpresaId}`);
                                await pool.query('UPDATE empresa_email_canais SET last_received_at = NOW(), ultimo_erro = NULL WHERE id = ?', [matchedChannelId]);
                                if (canaisMatch[0].status === 'pendente' || canaisMatch[0].status === 'erro') {
                                    await pool.query('UPDATE empresa_email_canais SET status = ?, verified_at = NOW() WHERE id = ?', ['ativo', matchedChannelId]);
                                }
                            }
                            else {
                                // Fallback to legacy support email check
                                const [empresasMatch] = await pool.query('SELECT id FROM empresas WHERE LOWER(email) IN (?) OR LOWER(email_suporte) IN (?) LIMIT 1', [potentialRecipients, potentialRecipients]);
                                if (empresasMatch.length > 0) {
                                    targetEmpresaId = empresasMatch[0].id;
                                    console.log(`[Email Listener] [UID:${uid}] Matched company ${targetEmpresaId} via legacy support email fallback.`);
                                }
                            }
                        }
                    }
                    if (!targetEmpresaId) {
                        console.warn(`[Email Listener] [UID:${uid}] No company found for recipients: ${potentialRecipients.join(', ')}. From: ${senderEmail}.`);
                        await this.logSystem(null, 'EMAIL_WITHOUT_COMPANY', `Falha ao identificar empresa para email de ${senderEmail} (Para: ${potentialRecipients.join(', ')}).`);
                        continue;
                    }
                    // 4. Anti-Loop & System Prevention
                    const precedence = (parsed.headers.get('precedence') || '').toLowerCase();
                    const autoSubmitted = (parsed.headers.get('auto-submitted') || '').toLowerCase();
                    const isSystemHeader = parsed.headers.get('x-gestifique-system') === 'true';
                    // Better checks for system emails using normalized helpers
                    const systemEmailsNormalized = [
                        normalizeEmailAddress(env.IMAP.USER),
                        normalizeEmailAddress(env.SMTP.USER),
                        'mailer-daemon',
                        'postmaster',
                        'noreply',
                        'no-reply'
                    ].filter(Boolean);
                    const senderNormalized = normalizeEmailAddress(senderEmail);
                    const isSystemSender = senderNormalized ? systemEmailsNormalized.some(sys => senderNormalized.includes(sys)) : false;
                    const isAutoMsg = precedence === 'bulk' || precedence === 'junk' || precedence === 'list' || (autoSubmitted && autoSubmitted !== 'no');
                    if (isSystemSender || isAutoMsg || isSystemHeader) {
                        console.warn(`[Email Listener] [UID:${uid}] Anti-Loop triggered for ${senderEmail} (isSystemSender: ${isSystemSender}, isAuto: ${isAutoMsg}, isSystemHeader: ${isSystemHeader})`);
                        await this.logSystem(targetEmpresaId, 'EMAIL_LOOP_PREVENTED', `Email de ${senderEmail} ignorado via anti-loop (Precedence: ${precedence}, Auto-Submitted: ${autoSubmitted}, HeaderSistema: ${isSystemHeader}).`);
                        await this.connection.addFlags(uid, '\\Seen');
                        continue;
                    }
                    // Thread duplication prevention check for responses that look like Gestifique thread and have system indicators but no valid DB match
                    if (!targetTicketId && looksLikeGestifiqueTicketThread(subject, parsed)) {
                        console.warn(`[Email Listener] [UID:${uid}] Ignored email from ${senderEmail} because it looks like a Gestifique ticket thread fallback replica without active matching ticket.`);
                        await this.logSystem(targetEmpresaId, 'EMAIL_THREAD_REPLICA_IGNORED', `Email de ${senderEmail} (Assunto: "${subject}") ignorado pois aparenta ser uma réplica antiga/inválida de thread sem ticket correspondente ativo.`);
                        await this.connection.addFlags(uid, '\\Seen');
                        continue;
                    }
                    // Pre-register message ID in processed_emails now that we have targetEmpresaId, to prevent race conditions
                    if (messageId && targetEmpresaId) {
                        try {
                            await pool.query('INSERT IGNORE INTO processed_emails (message_id, empresa_id, ticket_id) VALUES (?, ?, ?)', [messageId, targetEmpresaId, targetTicketId]);
                        }
                        catch (dbLockErr) {
                            console.error('[Email Listener] Race lock pre-registration insert failed:', dbLockErr);
                        }
                    }
                    // 5. Resolve Sender Context
                    const { userId } = await this.resolveSenderContext(senderEmail, targetEmpresaId);
                    // 6. Cleanup Message Body
                    let text = parsed.text || '';
                    // Common patterns to strip previous conversation
                    text = text.split(/Em \d+ de [a-zç]+ de \d{4}.*pelo Gestifique.*escreveu:/i)[0]; // Gestifique specific
                    text = text.split(/Em \d+ de \w+ de \d{4}.*escreveu:/i)[0]; // Generic Portuguese
                    text = text.split(/On .* wrote:/i)[0]; // Generic English
                    text = text.split(/\r?\n\s*-+\s*Mensagem original\s*-+\s*/i)[0]; // "Original Message" separator
                    text = text.split(/\r?\n\s*>+/)[0]; // Blockquote entries
                    text = text.trim();
                    if (!text && parsed.text)
                        text = parsed.text.trim(); // Safety fallback
                    // 7. Handle Create or Update
                    if (!targetTicketId) {
                        // Smart deduplication fallback (Subject + Sender in 48h) because identifyTicket didn't find matched tickets via header
                        const [dupRows] = await pool.query('SELECT id FROM tickets WHERE titulo = ? AND (solicitante_email = ? OR usuario_id = ?) AND empresa_id = ? AND created_at > (NOW() - INTERVAL 2 DAY) AND status != "fechado" ORDER BY created_at DESC LIMIT 1', [subject, senderEmail, userId, targetEmpresaId]);
                        if (dupRows.length > 0) {
                            console.log(`[Email Listener] Identified duplicate ticket #${dupRows[0].id} via subject/sender matching.`);
                            targetTicketId = dupRows[0].id;
                            // Update race pre-registration lock with the resolved ticketId
                            if (messageId && targetEmpresaId) {
                                await pool.query('UPDATE processed_emails SET ticket_id = ? WHERE message_id = ?', [targetTicketId, messageId]).catch(e => console.error('[Email Listener] Failed updating lock ticket_id:', e));
                            }
                        }
                    }
                    if (targetTicketId) {
                        // Update lock ticket_id if previously set to null
                        if (messageId && targetEmpresaId) {
                            await pool.query('UPDATE processed_emails SET ticket_id = ? WHERE message_id = ?', [targetTicketId, messageId]).catch(e => console.error('[Email Listener] Failed updating lock ticket_id:', e));
                        }
                        const msgId = await ticketsService.addMessage({
                            ticket_id: targetTicketId,
                            usuario_id: userId || null, // Allow system fallback down line if needed
                            mensagem: text,
                            interno: 0,
                            message_id: messageId
                        });
                        await this.logSystem(targetEmpresaId, 'EMAIL_MESSAGE_ADDED', `Nova mensagem via e-mail no ticket #${targetTicketId} de ${senderEmail}.`);
                        await this.processAttachments(parsed, targetTicketId, msgId, userId, targetEmpresaId);
                        // MARK AS SEEN ONLY ON SUCCESS
                        await this.connection.addFlags(uid, '\\Seen');
                        console.log(`[Email Listener] [UID:${uid}] Ticket #${targetTicketId} updated and email marked as seen.`);
                    }
                    if (!targetTicketId) {
                        const newTicketId = await ticketsService.create({
                            empresa_id: targetEmpresaId,
                            usuario_id: userId || null,
                            solicitante_nome: senderName,
                            solicitante_email: senderEmail,
                            titulo: subject,
                            descricao: text,
                            prioridade: 'media',
                            categoria: 'suporte',
                            origem: 'email',
                            email_channel_id: matchedChannelId,
                            message_id: messageId
                        });
                        // Update lock ticket_id if previously set to null
                        if (messageId && targetEmpresaId) {
                            await pool.query('UPDATE processed_emails SET ticket_id = ? WHERE message_id = ?', [newTicketId, messageId]).catch(e => console.error('[Email Listener] Failed updating lock new ticket_id:', e));
                        }
                        await this.logSystem(targetEmpresaId, 'EMAIL_TICKET_CREATED', `Ticket #${newTicketId} criado via e-mail de ${senderEmail}.`);
                        const newTicket = await ticketsService.getById(newTicketId);
                        if (newTicket && io) {
                            io.to(`empresa_${targetEmpresaId}`).emit('ticketCreated', newTicket);
                        }
                        await this.processAttachments(parsed, newTicketId, null, userId, targetEmpresaId);
                        // MARK AS SEEN ONLY ON SUCCESS
                        await this.connection.addFlags(uid, '\\Seen');
                        console.log(`[Email Listener] [UID:${uid}] Ticket #${newTicketId} created from email and marked as seen.`);
                    }
                }
                catch (itemError) {
                    console.error(`[Email Listener] [UID:${uid}] Error processing item:`, itemError);
                    await this.logSystem(null, 'EMAIL_PROCESS_ERROR', `Erro ao processar e-mail UID ${uid} de ${senderEmailStr}: ${itemError.message}`);
                }
            }
        }
        catch (e) {
            console.error('[IMAP ERROR] Falha no loop processInbox:', e);
        }
        finally {
            this.isProcessing = false;
        }
    }
    static async processAttachments(parsed, ticketId, msgId, userId, empresaId) {
        if (!parsed.attachments || parsed.attachments.length === 0)
            return;
        for (const att of parsed.attachments) {
            // Basic security validation
            const forbiddenExts = ['.exe', '.bat', '.sh', '.js', '.vbs', '.scr', '.cmd'];
            const ext = path.extname(att.filename || '').toLowerCase();
            if (forbiddenExts.includes(ext)) {
                console.warn(`[Email Listener] Blocked dangerous attachment: ${att.filename}`);
                await this.logSystem(empresaId, 'ATTACHMENT_BLOCKED', `Anexo perigoso bloqueado: ${att.filename} no Ticket #${ticketId}.`);
                continue;
            }
            // Max size check: 10MB
            if (att.size > 10 * 1024 * 1024) {
                console.warn(`[Email Listener] Attachment too large: ${att.filename} (${att.size} bytes)`);
                await this.logSystem(empresaId, 'ATTACHMENT_REJECTED', `Anexo muito grande rejeitado: ${att.filename} (${Math.round(att.size / 1024 / 1024)}MB).`);
                continue;
            }
            // Small noise check (e.g. small tracking pixels or icons)
            if (att.size < 500)
                continue;
            try {
                const uniqueFilename = `email-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext || '.bin'}`;
                // Usar StorageService em vez de fs direto
                const filePath = await storageService.save(att.content, {
                    filename: uniqueFilename,
                    mimeType: att.contentType || 'application/octet-stream'
                });
                await attachmentsService.create({
                    ticket_id: ticketId,
                    mensagem_id: msgId,
                    usuario_id: userId || null,
                    empresa_id: empresaId,
                    nome_original: att.filename || 'anexo_email.bin',
                    nome_arquivo: uniqueFilename,
                    caminho: filePath,
                    mime_type: att.contentType || 'application/octet-stream',
                    tamanho_bytes: att.size,
                    interno: false
                });
                console.log(`[Email Listener] Attachment saved: ${att.filename}`);
            }
            catch (err) {
                console.error(`[Email Listener] Error processing attachment ${att.filename}:`, err);
            }
        }
    }
    static async resolveSenderContext(email, targetEmpresaId) {
        // 1. Look for verified user in the target company
        const [rows] = await pool.query('SELECT id, empresa_id FROM usuarios WHERE email = ? AND ativo = 1', [email]);
        if (rows.length > 0) {
            // Find matching company or first one if dev/global admin
            const match = rows.find((r) => r.empresa_id === targetEmpresaId);
            if (match)
                return { userId: match.id };
            // If user exists but in another company
            await this.logSystem(targetEmpresaId, 'EMAIL_SENDER_CROSS_COMPANY', `Email de ${email} recebido, mas usuário pertence à empresa ${rows[0].empresa_id}. Tratado como externo.`);
            return { userId: null };
        }
        return { userId: null };
    }
}
