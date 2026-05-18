import cron from 'node-cron';
import imaps from 'imap-simple';
import { simpleParser, ParsedMail } from 'mailparser';
import pool from '../db/connection.js';
import ticketsService from './tickets.service.js';
import attachmentsService from './attachments.service.js';
import storageService from './storage.service.js';
import { env } from '../config/env.js';
import { io } from '../server.js';
import path from 'path';

export class EmailListenerService {
  private static connection: any = null;
  private static isProcessing = false;

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
        tlsOptions: { rejectUnauthorized: false },
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
      this.connection.imap.on('mail', (numNewMsgs: number) => {
        console.log(`[IMAP IDLE] ⚡ ${numNewMsgs} novo(s) e-mail(s) detectado(s) em tempo real!`);
        this.processInbox();
      });

      // Handle connection issues
      this.connection.imap.on('error', (err: any) => {
        console.error('[IMAP ERROR] Erro na conexão imap:', err);
        this.reconnect();
      });

      this.connection.imap.on('end', () => {
        console.warn('[IMAP WARN] Conexão encerrada pelo servidor.');
        this.reconnect();
      });

    } catch (e) {
      console.error('[IMAP ERROR] Falha ao conectar:', e);
      this.reconnect();
    }
  }

  static reconnect() {
    if (this.connection) {
      try {
        this.connection.imap.removeAllListeners();
        this.connection.end();
      } catch (e) {}
      this.connection = null;
    }

    console.log('[IMAP] Agendando reconexão em 10 segundos...');
    setTimeout(() => {
      this.connect();
    }, 10000);
  }

  private static async logSystem(empresa_id: number | null, acao: string, descricao: string) {
    try {
      await pool.query(
        'INSERT INTO logs_sistema (empresa_id, acao, descricao, user_agent, ip) VALUES (?, ?, ?, ?, ?)',
        [empresa_id, acao, descricao, 'SYSTEM_EMAIL_LISTENER', '127.0.0.1']
      );
    } catch (e) {
      console.error('[Email Listener] Error writing system log:', e);
    }
  }

  static async processInbox() {
    if (this.isProcessing) return;
    if (!this.connection) return;

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
          const bodyPart: any = item.parts.find((part: any) => part.which === '');
          if (!bodyPart) continue;

          const parsed: ParsedMail = await simpleParser(bodyPart.body);
          const messageId = parsed.messageId;
          const fromObj = parsed.from?.value[0];
          const senderEmail = fromObj?.address?.toLowerCase();
          senderEmailStr = senderEmail || 'unknown';
          const senderName = fromObj?.name || senderEmail || 'Sem Nome';
          const subject = parsed.subject || 'Sem Assunto';

          // 1. Deduplication using messageId from database
          if (messageId) {
            const [processed]: any = await pool.query(
              'SELECT ticket_id FROM processed_emails WHERE message_id = ? LIMIT 1',
              [messageId]
            );
            if (processed.length > 0) {
              console.log(`[Email Listener] Email already processed: ${messageId}. Skipping.`);
              await this.connection.addFlags(uid, '\\Seen');
              continue;
            }
          }

          // 2. Identify Recipient Company/Channel
          let potentialRecipients: string[] = [];
          
          const extractAddresses = (field: any) => {
            if (!field) return [];
            if (Array.isArray(field)) {
              return field.flatMap(f => extractAddresses(f));
            }
            if (field.value && Array.isArray(field.value)) {
              return field.value.map((v: any) => v.address).filter(Boolean);
            }
            if (typeof field === 'string') {
               // Try to extract email from "Name <email@domain.com>"
               const match = field.match(/<(.+?)>/);
               return [match ? match[1].toLowerCase().trim() : field.toLowerCase().trim()];
            }
            if (field.address) return [field.address.toLowerCase().trim()];
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

          let targetEmpresaId = null;
          let matchedChannelId = null;

          if (potentialRecipients.length > 0) {
              // Try normalized inbound_address first
              const [canaisMatch]: any = await pool.query(
                  'SELECT id, empresa_id, status FROM empresa_email_canais WHERE LOWER(inbound_address) IN (?) OR LOWER(email_publico) IN (?) LIMIT 1',
                  [potentialRecipients, potentialRecipients]
              );
              
              if (canaisMatch.length > 0) {
                  matchedChannelId = canaisMatch[0].id;
                  targetEmpresaId = canaisMatch[0].empresa_id;
                  console.log(`[Email Listener] [UID:${uid}] Matched channel ID ${matchedChannelId} for company ${targetEmpresaId}`);
                  
                  await pool.query(
                     'UPDATE empresa_email_canais SET last_received_at = NOW(), ultimo_erro = NULL WHERE id = ?',
                     [matchedChannelId]
                  );
                  if (canaisMatch[0].status === 'pendente' || canaisMatch[0].status === 'erro') {
                     await pool.query(
                        'UPDATE empresa_email_canais SET status = ?, verified_at = NOW() WHERE id = ?',
                        ['ativo', matchedChannelId]
                     );
                  }
              } else {
                  // Fallback to legacy support email check
                  const [empresasMatch]: any = await pool.query(
                      'SELECT id FROM empresas WHERE LOWER(email) IN (?) OR email_suporte IN (?) LIMIT 1',
                      [potentialRecipients, potentialRecipients]
                  );
                  if (empresasMatch.length > 0) {
                      targetEmpresaId = empresasMatch[0].id;
                      console.log(`[Email Listener] [UID:${uid}] Matched company ${targetEmpresaId} via legacy support email fallback.`);
                  }
              }
          }

          if (!targetEmpresaId) {
             console.warn(`[Email Listener] [UID:${uid}] No company found for recipients: ${potentialRecipients.join(', ')}. From: ${senderEmail}.`);
             await this.logSystem(null, 'EMAIL_WITHOUT_COMPANY', `Falha ao identificar empresa para email de ${senderEmail} (Para: ${potentialRecipients.join(', ')}).`);
             // We don't mark as seen if we can't route it, unless we want to ignore unknown recipients
             // If we mark as seen, it won't be tried again. 
             // Requirement says: "Não marcar como lido se não encontrou empresa/canal"
             continue; 
          }

          // 3. Anti-Loop & System Prevention
          const precedence = (parsed.headers.get('precedence') as string || '').toLowerCase();
          const autoSubmitted = (parsed.headers.get('auto-submitted') as string || '').toLowerCase();
          const isAutoMsg = precedence === 'bulk' || precedence === 'junk' || precedence === 'list' || (autoSubmitted && autoSubmitted !== 'no');
          
          const systemEmails = [
            env.IMAP.USER?.toLowerCase(),
            env.SMTP.USER?.toLowerCase(),
            'mailer-daemon',
            'postmaster',
            'noreply',
            'no-reply'
          ].filter(Boolean);

          const isSystem = systemEmails.some(sys => senderEmail?.includes(sys!));
          
          if (isSystem || isAutoMsg) {
             console.warn(`[Email Listener] [UID:${uid}] Anti-Loop triggered for ${senderEmail} (isSystem: ${isSystem}, isAuto: ${isAutoMsg})`);
             await this.logSystem(targetEmpresaId, 'EMAIL_LOOP_PREVENTED', `Email de ${senderEmail} ignorado (Precedence: ${precedence}, Auto-Submitted: ${autoSubmitted}).`);
             await this.connection.addFlags(uid, '\\Seen');
             continue;
          }


          // 4. Resolve Sender Context
          const { userId } = await this.resolveSenderContext(senderEmail!, targetEmpresaId);

          // 5. Cleanup Message Body
          let text = parsed.text || '';
          // Common patterns to strip previous conversation
          text = text.split(/Em \d+ de [a-zç]+ de \d{4}.*pelo Gestifique.*escreveu:/i)[0]; // Gestifique specific
          text = text.split(/Em \d+ de \w+ de \d{4}.*escreveu:/i)[0]; // Generic Portuguese
          text = text.split(/On .* wrote:/i)[0]; // Generic English
          text = text.split(/\r?\n\s*-+\s*Mensagem original\s*-+\s*/i)[0]; // "Original Message" separator
          text = text.split(/\r?\n\s*>+/)[0]; // Blockquote entries
          text = text.trim();
          
          if (!text && parsed.text) text = parsed.text.trim(); // Safety fallback

          // 6. Identification of existing ticket (Reply check)
          let targetTicketId: number | null = null;
          console.log(`[Email Listener] [UID:${uid}] Processing message from ${senderEmail}: "${subject}" (MessageID: ${messageId})`);

          // A) By [Ticket #ID] in subject
          const subjectMatch = subject.match(/\[Ticket\s*#(\d+)\]/i);
          if (subjectMatch) {
            targetTicketId = parseInt(subjectMatch[1]);
          }

          // B) By In-Reply-To or References headers
          if (!targetTicketId) {
            const inReplyTo = parsed.inReplyTo;
            const references = Array.isArray(parsed.references) ? parsed.references : (parsed.references ? [parsed.references] : []);
            const allRefs = [inReplyTo, ...references].filter(r => !!r);
            
            if (allRefs.length > 0) {
              const [refMatch]: any = await pool.query(
                `SELECT ticket_id FROM processed_emails WHERE message_id IN (?) AND empresa_id = ? ORDER BY created_at DESC LIMIT 1`,
                [allRefs, targetEmpresaId]
              );
              if (refMatch.length > 0) {
                 targetTicketId = refMatch[0].ticket_id;
                 console.log(`[Email Listener] Identified existing ticket #${targetTicketId} via headers.`);
              }
            }
          }

          // C) Smart deduplication fallback (Subject + Sender in 48h)
          if (!targetTicketId) {
             const [dupRows]: any = await pool.query(
               'SELECT id FROM tickets WHERE titulo = ? AND (solicitante_email = ? OR usuario_id = ?) AND empresa_id = ? AND created_at > (NOW() - INTERVAL 2 DAY) AND status != "fechado" ORDER BY created_at DESC LIMIT 1',
               [subject, senderEmail, userId, targetEmpresaId]
             );
             if (dupRows.length > 0) {
                targetTicketId = dupRows[0].id;
                console.log(`[Email Listener] Identified duplicate ticket #${targetTicketId} via subject/sender matching.`);
             }
          }

          // 7. Handle Create or Update
          if (targetTicketId) {
             // Verification: Same company
             const [ticketCheck]: any = await pool.query('SELECT id, empresa_id FROM tickets WHERE id = ?', [targetTicketId]);
             if (ticketCheck.length > 0 && ticketCheck[0].empresa_id === targetEmpresaId) {
                const msgId = await ticketsService.addMessage({
                  ticket_id: targetTicketId,
                  usuario_id: userId || null,
                  mensagem: text,
                  interno: 0,
                  message_id: messageId
                });

                await this.logSystem(targetEmpresaId, 'EMAIL_MESSAGE_ADDED', `Nova mensagem via e-mail no ticket #${targetTicketId} de ${senderEmail}.`);
                
                await this.processAttachments(parsed, targetTicketId, msgId, userId, targetEmpresaId);
                
                // MARK AS SEEN ONLY ON SUCCESS
                await this.connection.addFlags(uid, '\\Seen');
                console.log(`[Email Listener] [UID:${uid}] Ticket #${targetTicketId} updated and email marked as seen.`);
             } else {
                await this.logSystem(targetEmpresaId, 'EMAIL_TICKET_MISMATCH', `Tentativa de responder ao ticket #${targetTicketId} que pertence à empresa ${ticketCheck[0]?.empresa_id || 'unkn'} através do canal da empresa ${targetEmpresaId}.`);
                targetTicketId = null; // Forces creation of a new ticket if cross-company
             }
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

            await this.logSystem(targetEmpresaId, 'EMAIL_TICKET_CREATED', `Ticket #${newTicketId} criado via e-mail de ${senderEmail}.`);
            
            const newTicket = await ticketsService.getById(newTicketId);
            if (newTicket && io) {
               io.to(`empresa_${targetEmpresaId}`).emit('ticketCreated', newTicket);
            }
            
            await this.processAttachments(parsed, newTicketId, null, userId, targetEmpresaId);

            // MARK AS SEEN ONLY ON SUCCESS
            await this.connection.addFlags(uid, '\\Seen');
            console.log(`[Email Listener] [UID:${uid}] Ticket #${newTicketId} created and email marked as seen.`);
          }

        } catch (itemError: any) {
          console.error(`[Email Listener] [UID:${uid}] Error processing item:`, itemError);
          // If it's a specific error we know we should mark as read (like invalid format), we could.
          // But generally, we don't mark as seen if it failed, so it can be retried or inspected.
          await this.logSystem(null, 'EMAIL_PROCESS_ERROR', `Erro ao processar e-mail UID ${uid} de ${senderEmailStr}: ${itemError.message}`);
        }
      }
    } catch (e) {
      console.error('[IMAP ERROR] Falha no loop processInbox:', e);
    } finally {
      this.isProcessing = false;
    }
  }

  private static async processAttachments(parsed: ParsedMail, ticketId: number, msgId: number | null, userId: number | null, empresaId: number) {
    if (!parsed.attachments || parsed.attachments.length === 0) return;

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
      if (att.size < 500) continue;

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
      } catch (err) {
        console.error(`[Email Listener] Error processing attachment ${att.filename}:`, err);
      }
    }
  }

  static async resolveSenderContext(email: string, targetEmpresaId: number): Promise<{ userId: number | null }> {
    // 1. Look for verified user in the target company
    const [rows]: any = await pool.query(
      'SELECT id, empresa_id FROM usuarios WHERE email = ? AND ativo = 1', 
      [email]
    );

    if (rows.length > 0) {
      // Find matching company or first one if dev/global admin
      const match = rows.find((r: any) => r.empresa_id === targetEmpresaId);
      if (match) return { userId: match.id };
      
      // If user exists but in another company
      await this.logSystem(targetEmpresaId, 'EMAIL_SENDER_CROSS_COMPANY', `Email de ${email} recebido, mas usuário pertence à empresa ${rows[0].empresa_id}. Tratado como externo.`);
      return { userId: null };
    }
    
    return { userId: null };
  }
}
