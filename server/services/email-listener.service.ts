import cron from 'node-cron';
import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import pool from '../db/connection.js';
import ticketsService from './tickets.service.js';
import attachmentsService from './attachments.service.js';
import { env } from '../config/env.js';
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

      const [empresas]: any = await pool.query('SELECT id FROM empresas ORDER BY id ASC LIMIT 1');
      const fallbackEmpresaId = empresas.length > 0 ? empresas[0].id : 1;

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

          const { id: userId, empresa_id: empresaId } = await this.getOrCreateUser(email, name, fallbackEmpresaId);

          console.log('[IMAP] A tentar criar/atualizar ticket no banco de dados...');
          
          const match = subject.match(/\[Ticket\s*#(\d+)\]/i);
          let handled = false;
          let targetTicketId: number | null = null;

          if (match) {
             targetTicketId = parseInt(match[1]);
          } else {
             // Duplicate check: Look for recent ticket (24h) with same user and subject
             const [recentTickets]: any = await pool.query(
               'SELECT id FROM tickets WHERE usuario_id = ? AND titulo = ? AND created_at > (NOW() - INTERVAL 1 DAY) AND status != "fechado" ORDER BY created_at DESC LIMIT 1',
               [userId, subject]
             );
             if (recentTickets.length > 0) {
                targetTicketId = recentTickets[0].id;
                console.log(`[Email Listener] Found duplicate ticket within 24h: #${targetTicketId}`);
             }
          }

          if (targetTicketId) {
             const ticket = await ticketsService.getById(targetTicketId);
             if (ticket) {
               const msgId = await ticketsService.addMessage({
                 ticket_id: targetTicketId,
                 usuario_id: userId,
                 mensagem: text,
                 interno: 0
               });
               console.log(`[Email Listener] Added reply to Ticket #${targetTicketId}`);
               
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
                        usuario_id: userId,
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

          if (!handled) {
            const newTicketId = await ticketsService.create({
              empresa_id: empresaId,
              usuario_id: userId,
              titulo: subject,
              descricao: text,
              prioridade: 'media',
              categoria: 'suporte'
            });
            
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
                      usuario_id: userId,
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

  static async getOrCreateUser(email: string, name: string, fallbackEmpresaId: number): Promise<{ id: number, empresa_id: number }> {
    const [rows]: any = await pool.query('SELECT id, empresa_id FROM usuarios WHERE email = ?', [email]);
    if (rows.length > 0) {
      let user = rows[0];
      if (!user.empresa_id) {
         await pool.query('UPDATE usuarios SET empresa_id = ? WHERE id = ?', [fallbackEmpresaId, user.id]);
         user.empresa_id = fallbackEmpresaId;
      }
      return { id: user.id, empresa_id: user.empresa_id };
    }

    let targetEmpresaId = fallbackEmpresaId;
    const domainPart = email.split('@')[1];
    
    if (domainPart) {
      const publicDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'icloud.com'];
      if (!publicDomains.includes(domainPart.toLowerCase())) {
        const [domainRows]: any = await pool.query('SELECT empresa_id FROM usuarios WHERE email LIKE ? AND empresa_id IS NOT NULL LIMIT 1', [`%@${domainPart}`]);
        if (domainRows.length > 0) {
           targetEmpresaId = domainRows[0].empresa_id;
        }
      }
    }

    const defaultPass = await bcrypt.hash(Math.random().toString(), 10);
    const [result]: any = await pool.query(
      'INSERT INTO usuarios (nome, email, senha_hash, cargo, ativo, empresa_id) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, defaultPass, 'Cliente Externo', 1, targetEmpresaId]
    );
    return { id: result.insertId, empresa_id: targetEmpresaId };
  }
}
