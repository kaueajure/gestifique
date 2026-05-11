import cron from 'node-cron';
import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import pool from '../db/connection.js';
import ticketsService from './tickets.service.js';
import attachmentsService from './attachments.service.js';
import { env } from '../config/env.js';
import { io } from '../server.js';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

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
      console.log('[IMAP] A tentar ligar à caixa de entrada (IDLE mode)...');
      this.connection = await imaps.connect(config);
      
      await this.connection.openBox('INBOX');
      console.log('[IMAP] Ligação estabelecida e IDLE ativo.');

      // Process existing unseen emails on startup
      await this.processInbox();

      // Listen for new mail
      this.connection.imap.on('mail', (numNewMsgs: number) => {
        console.log(`[IMAP IDLE] ⚡ ${numNewMsgs} novo(s) e-mail(s) detetado(s) em tempo real!`);
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
    // If already has a connection, try to end it and remove listeners
    if (this.connection) {
      try {
        this.connection.imap.removeAllListeners();
        this.connection.end();
      } catch (e) {}
      this.connection = null;
    }

    console.log('[IMAP] A agendar reconexão em 10 segundos...');
    setTimeout(() => {
      this.connect();
    }, 10000);
  }

  static async processInbox() {
    if (this.isProcessing) return;
    if (!this.connection) return;

    this.isProcessing = true;
    try {
      console.log('[IMAP] A processar e-mails não lidos...');
      
      const searchCriteria = ['UNSEEN'];
      const fetchOptions = {
        bodies: ['HEADER', 'TEXT', ''],
        markSeen: false 
      };

      const messages = await this.connection.search(searchCriteria, fetchOptions);
      console.log(`[IMAP] Encontrados ${messages.length} e-mails não lidos (UNSEEN).`);
      
      if (messages.length === 0) {
        return;
      }

      for (const item of messages) {
        const id = item.attributes.uid;
        try {
          const allStringParts: any = item.parts.filter((part: any) => part.which === '');
          
          let mailStr = '';
          if (allStringParts && allStringParts.length > 0) {
             mailStr = allStringParts[0].body;
          }

          const parsed = await simpleParser(mailStr);

          const fromObj = parsed.from?.value[0];
          const email = fromObj?.address;
          const name = fromObj?.name || email || 'Sem Nome';
          const subject = parsed.subject || 'Sem Assunto';
          
          let potentialAddresses: string[] = [];
          
          const toArr = Array.isArray(parsed.to) 
              ? parsed.to.flatMap((t: any) => t.value?.map((v: any) => v.address) || [])
              : (parsed.to as any)?.value?.map((v: any) => v.address) || [];
          potentialAddresses.push(...toArr);

          const ccArr = Array.isArray(parsed.cc) 
              ? parsed.cc.flatMap((t: any) => t.value?.map((v: any) => v.address) || [])
              : (parsed.cc as any)?.value?.map((v: any) => v.address) || [];
          potentialAddresses.push(...ccArr);

          const headerKeys = ['delivered-to', 'x-original-to', 'envelope-to', 'x-forwarded-to', 'apparently-to'];
          for (const key of headerKeys) {
             const val = parsed.headers.get(key) as any;
             if (val) {
                if (typeof val === 'string') potentialAddresses.push(val);
                else if (Array.isArray(val)) potentialAddresses.push(...val.map(v => typeof v === 'string' ? v : v.address));
                else if (val.value && Array.isArray(val.value)) potentialAddresses.push(...val.value.map((v: any) => v.address));
             }
          }
          
          potentialAddresses = potentialAddresses.filter(a => !!a).map(a => a.toLowerCase());
          
          let targetEmpresaId = null;
          let matchedChannelId = null;

          if (potentialAddresses.length > 0) {
              const [canaisMatch]: any = await pool.query(
                  'SELECT id, empresa_id, status FROM empresa_email_canais WHERE inbound_address IN (?) LIMIT 1',
                  [potentialAddresses]
              );
              
              if (canaisMatch.length > 0) {
                  matchedChannelId = canaisMatch[0].id;
                  targetEmpresaId = canaisMatch[0].empresa_id;
                  
                  // Atualizar o canal
                  await pool.query(
                     'UPDATE empresa_email_canais SET last_received_at = NOW(), ultimo_erro = NULL WHERE id = ?',
                     [matchedChannelId]
                  );
                  if (canaisMatch[0].status === 'pendente' || canaisMatch[0].status === 'erro') {
                     await pool.query(
                        'UPDATE empresa_email_canais SET status = ?, verified_at = NOW() WHERE id = ?',
                        ['ativo', matchedChannelId]
                     );
                     try {
                        await pool.query('INSERT INTO logs_sistema (acao, descricao, user_agent, ip) VALUES (?, ?, ?, ?)', ['EMAIL_CHANNEL_VERIFIED', `Canal de e-mail ID ${matchedChannelId} verificado/ativado pelo recebimento de email.`, 'SYSTEM_LISTENER', '127.0.0.1']);
                     } catch(e) {}
                  }
              } else {
                  // Fallback para lógica legada (email_suporte)
                  const [empresasMatch]: any = await pool.query(
                      'SELECT id FROM empresas WHERE email_suporte IN (?) LIMIT 1',
                      [potentialAddresses]
                  );
                  if (empresasMatch.length > 0) {
                      targetEmpresaId = empresasMatch[0].id;
                      try {
                         await pool.query('INSERT INTO logs_sistema (acao, descricao, user_agent, ip) VALUES (?, ?, ?, ?)', ['EMAIL_WITHOUT_CHANNEL', `E-mail de ${email} processado pela lógica legada de email_suporte. Considere configurar um canal HTTPS/Encaminhamento para a empresa ${targetEmpresaId}.`, 'SYSTEM_LISTENER', '127.0.0.1']);
                      } catch(e) {}
                  }
              }
          }

          if (!targetEmpresaId) {
             console.error(`[IMAP] CRITICAL: Não foi possível identificar a empresa via destinatário ${JSON.stringify(potentialAddresses)}. E-mail de ${email} ignorado.`);
             
             try {
                await pool.query(
                   'INSERT INTO logs_sistema (acao, descricao, user_agent, ip) VALUES (?, ?, ?, ?)',
                   ['EMAIL_WITHOUT_COMPANY', `Falha ao processar email de ${email} para ${JSON.stringify(potentialAddresses)}. Nenhuma empresa encontrada.`, 'SYSTEM_LISTENER', '127.0.0.1']
                );
             } catch(e) {}
             
             await this.connection.addFlags(id, '\\Seen');
             continue;
          }

          console.log('[IMAP] A ler e-mail de:', email, '| Assunto:', subject);

          // Anti-Loop Check: Ignore itself or system/no-reply emails
          const isSelf = email?.toLowerCase() === env.IMAP.USER?.toLowerCase();
          const isSystem = email?.toLowerCase().includes('mailer-daemon') || 
                           email?.toLowerCase().includes('postmaster') || 
                           email?.toLowerCase().includes('noreply');
          
          if (isSelf || isSystem) {
             console.warn('[IMAP] E-mail IGNORADO pela proteção Anti-Loop. Remetente:', email);
             continue;
          }

          let text = parsed.text || ''; 
          
          // Limpeza de Texto (Reply Stripping)
          text = text.split(/Em \d+ de [a-z]{3}\. de \d{4}.*escreveu:/i)[0]; // regex request by user
          text = text.split(/\r?\n\s*>/)[0]; // > quotes
          text = text.split(/\r?\nFrom:\s/)[0]; // English mail
          text = text.split(/\r?\nDe:\s/)[0]; // Portuguese mail
          text = text.split(/On .* wrote:/i)[0]; // English inline
          text = text.trim();
          if (!text) {
             text = parsed.text || ''; // fallback se a regex cortar demais
          }

          if (!email) {
            console.warn('[IMAP] E-mail ignorado: remetente não identificado.');
            continue;
          }

          let userId = null;
          let empresaId = targetEmpresaId;
          try {
             const userContext = await this.resolveSenderContext(email, targetEmpresaId);
             userId = userContext.userId;
          } catch(err: any) {
             console.error('[IMAP] Erro ao resolver contexto de remetente:', err);
             await this.connection.addFlags(id, '\\Seen');
             continue;
          }

          console.log('[IMAP] A tentar criar/atualizar ticket no banco de dados...');
          
          const match = subject.match(/\[Ticket\s*#(\d+)\]/i);
          let handled = false;
          let targetTicketId: number | null = null;

          if (match) {
             targetTicketId = parseInt(match[1]);
          } else {
             // Duplicate check: Look for recent ticket (24h) with same user and subject
             let duplicateQuery = 'SELECT id FROM tickets WHERE titulo = ? AND empresa_id = ? AND created_at > (NOW() - INTERVAL 1 DAY) AND status != "fechado"';
             let duplicateParams: any[] = [subject, targetEmpresaId];
             
             if (userId) {
                duplicateQuery += ' AND usuario_id = ?';
                duplicateParams.push(userId);
             } else {
                duplicateQuery += ' AND solicitante_email = ?';
                duplicateParams.push(email);
             }
             
             duplicateQuery += ' ORDER BY created_at DESC LIMIT 1';
             
             const [recentTickets]: any = await pool.query(duplicateQuery, duplicateParams);
             if (recentTickets.length > 0) {
                targetTicketId = recentTickets[0].id;
                console.log(`[Email Listener] Found duplicate ticket within 24h: #${targetTicketId}`);
             }
          }

          if (targetTicketId) {
             const ticket = await ticketsService.getById(targetTicketId);
             if (ticket) {
               if (ticket.empresa_id !== targetEmpresaId) {
                  try {
                    await pool.query('INSERT INTO logs_sistema (acao, descricao, user_agent, ip) VALUES (?, ?, ?, ?)', ['EMAIL_TICKET_MISMATCH', `Tentativa de adicionar mensagem ao ticket #${targetTicketId} da empresa ${ticket.empresa_id} usando o suporte da empresa ${targetEmpresaId}. Ignorado.`, 'SYSTEM_LISTENER', '127.0.0.1']);
                  } catch(e){}
                  handled = true;
               } else {
                 const msgId = await ticketsService.addMessage({
                   ticket_id: targetTicketId,
                   usuario_id: userId || null,
                   mensagem: text,
                   interno: 0
                 });
                 console.log(`[Email Listener] Added reply to Ticket #${targetTicketId}`);
                 
                 // Real-time update via WebSocket
                 const updatedTicket = await ticketsService.getById(targetTicketId);
                 if (updatedTicket && io) {
                   io.to(`empresa_${empresaId}`).emit('ticketUpdated', updatedTicket);
                 }
                 
                 if (parsed.attachments && parsed.attachments.length > 0) {
                   for (const att of parsed.attachments) {
                     if (att.size > 5120) {
                       const filename = `email-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(att.filename || '.bin')}`;
                       const dir = path.join(process.cwd(), 'uploads', 'tickets');
                       if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                       const filePath = path.join(dir, filename);
                       fs.writeFileSync(filePath, att.content);
                       await attachmentsService.create({
                          ticket_id: targetTicketId,
                          mensagem_id: msgId,
                          usuario_id: userId || null,
                          empresa_id: empresaId,
                          nome_original: att.filename || 'anexo_email.bin',
                          nome_arquivo: filename,
                          caminho: filePath,
                          mime_type: att.contentType || 'application/octet-stream',
                          tamanho_bytes: att.size,
                          interno: false
                       });
                     }
                   }
                 }
                 
                 handled = true;
               }
             }
          }

          if (!handled) {
            const newTicketId = await ticketsService.create({
              empresa_id: empresaId,
              usuario_id: userId || null,
              solicitante_nome: name,
              solicitante_email: email,
              titulo: subject,
              descricao: text,
              prioridade: 'media',
              categoria: 'suporte_tecnico'
            });
            
            try {
               await pool.query('INSERT INTO logs_sistema (acao, descricao, user_agent, ip) VALUES (?, ?, ?, ?)', ['EMAIL_TICKET_CREATED', `Criado ticket #${newTicketId} para ${email} (Empresa ${empresaId}).`, 'SYSTEM_LISTENER', '127.0.0.1']);
            } catch(e) {}

            // Real-time update via WebSocket
            const newTicket = await ticketsService.getById(newTicketId);
            if (newTicket && io) {
              io.to(`empresa_${empresaId}`).emit('ticketCreated', newTicket);
            }
            
            if (parsed.attachments && parsed.attachments.length > 0) {
               for (const att of parsed.attachments) {
                 if (att.size > 5120) {
                   const filename = `email-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(att.filename || '.bin')}`;
                   const dir = path.join(process.cwd(), 'uploads', 'tickets');
                   if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                   const filePath = path.join(dir, filename);
                   fs.writeFileSync(filePath, att.content);
                   await attachmentsService.create({
                      ticket_id: newTicketId,
                      mensagem_id: null,
                      usuario_id: userId || null,
                      empresa_id: empresaId,
                      nome_original: att.filename || 'anexo_email.bin',
                      nome_arquivo: filename,
                      caminho: filePath,
                      mime_type: att.contentType || 'application/octet-stream',
                      tamanho_bytes: att.size,
                      interno: false
                   });
                 }
               }
            }
            
            
            console.log(`[Email Listener] Created new Ticket #${newTicketId} from email.`);
          }
        } catch (itemError) {
          console.error('[IMAP TICKET ERROR] Falha ao criar/atualizar:', itemError);
        } finally {
          await this.connection.addFlags(id, ['\\Seen']);
          console.log('[IMAP] E-mail marcado como Lido.');
        }
      }
    } catch (e) {
      console.error('[IMAP ERROR] Falha ao processar inbox:', e);
    } finally {
      this.isProcessing = false;
    }
  }

  static async resolveSenderContext(email: string, targetEmpresaId: number): Promise<{ userId: number | null }> {
    const [rows]: any = await pool.query('SELECT id, empresa_id, administrador, desenvolvedor FROM usuarios WHERE email = ?', [email]);
    if (rows.length > 0) {
      let user = rows[0];
      
      if (user.empresa_id && user.empresa_id !== targetEmpresaId) {
         try {
           await pool.query('INSERT INTO logs_sistema (acao, descricao, user_agent, ip) VALUES (?, ?, ?, ?)', ['EMAIL_COMPANY_MISMATCH', `O e-mail de ${email} (Empresa ${user.empresa_id}) foi recebido no suporte da empresa ${targetEmpresaId}. Tratado como usuário externo.`, 'SYSTEM_LISTENER', '127.0.0.1']);
         } catch(e) {}
         return { userId: null };
      }

      if (!user.empresa_id && (user.administrador || user.desenvolvedor)) {
         try {
           await pool.query('INSERT INTO logs_sistema (acao, descricao, user_agent, ip) VALUES (?, ?, ?, ?)', ['EMAIL_INTERNAL_USER_IGNORED_AS_REQUESTER', `Usuário interno ${email} enviou e-mail para suporte da empresa ${targetEmpresaId}. Tratado como usuário externo sem vinculo de empresa.`, 'SYSTEM_LISTENER', '127.0.0.1']);
         } catch(e) {}
         return { userId: null };
      }

      if (!user.empresa_id) {
         return { userId: null };
      }

      return { userId: user.id };
    }
    
    return { userId: null };
  }
}
