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
  static init() {
    if (!env.IMAP.HOST || !env.IMAP.USER || !env.IMAP.PASS) {
      console.warn('[Email Listener] Missing IMAP credentials, skipping init.');
      return;
    }

    // Run every 2 minutes
    cron.schedule('*/2 * * * *', async () => {
      console.log('[Email Listener] Checking for new emails...');
      await this.processInbox();
    });
    
    // Also run once on startup
    this.processInbox();
  }

  static async processInbox() {
    const config = {
      imap: {
        user: env.IMAP.USER,
        password: env.IMAP.PASS,
        host: env.IMAP.HOST,
        port: env.IMAP.PORT ? Number(env.IMAP.PORT) : 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        authTimeout: 15000
      }
    };

    let connection: any = null;
    try {
      console.log('[IMAP] A tentar ligar à caixa de entrada...');
      connection = await imaps.connect(config);
      console.log('[IMAP] Ligação estabelecida. A procurar e-mails não lidos...');
      await connection.openBox('INBOX');

      const searchCriteria = ['UNSEEN'];
      const fetchOptions = {
        bodies: ['HEADER', 'TEXT', ''],
        markSeen: false 
      };

      const messages = await connection.search(searchCriteria, fetchOptions);
      if (messages.length === 0) {
        connection.end();
        return;
      }

      const [empresas]: any = await pool.query('SELECT id FROM empresas ORDER BY id ASC LIMIT 1');
      const fallbackEmpresaId = empresas.length > 0 ? empresas[0].id : 1;

      console.log(`[Email Listener] Found ${messages.length} unseen emails.`);

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
          let text = parsed.text || ''; 
          
          // Limpeza de Texto (Reply Stripping)
          text = text.split(/\r?\n\s*>/)[0]; // > quotes
          text = text.split(/\r?\nFrom:\s/)[0]; // English mail
          text = text.split(/\r?\nDe:\s/)[0]; // Portuguese mail
          text = text.split(/On .* wrote:/i)[0]; // English inline
          text = text.split(/Em .* escreveu:/i)[0]; // Portuguese inline
          text = text.trim();
          if (!text) {
             text = parsed.text || ''; // fallback se a regex cortar demais
          }

          if (!email) {
            await connection.addFlags(id, ['\\Seen']);
            continue;
          }

          const { id: userId, empresa_id: empresaId } = await this.getOrCreateUser(email, name, fallbackEmpresaId);

          const match = subject.match(/\[Ticket\s*#(\d+)\]/i);
          let handled = false;
          if (match) {
             const ticketId = parseInt(match[1]);
             const ticket = await ticketsService.getById(ticketId);
             if (ticket) {
               const msgId = await ticketsService.addMessage({
                 ticket_id: ticketId,
                 usuario_id: userId,
                 mensagem: text,
                 interno: 0
               });
               console.log(`[Email Listener] Added reply to Ticket #${ticketId}`);
               
               if (parsed.attachments && parsed.attachments.length > 0) {
                 for (const att of parsed.attachments) {
                   if (att.size > 5120) {
                     const filename = `email-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(att.filename || '.bin')}`;
                     const dir = path.join(process.cwd(), 'uploads', 'tickets');
                     if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                     const filePath = path.join(dir, filename);
                     fs.writeFileSync(filePath, att.content);
                     await attachmentsService.create({
                        ticket_id: ticketId,
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
               
               await connection.addFlags(id, ['\\Seen']);
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
                      mensagem_id: null, // Initial ticket description, not a message
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
            await connection.addFlags(id, ['\\Seen']);
          }
        } catch (itemError) {
          console.error(`[IMAP ERROR] Falha ao processar email (UID: ${id}):`, itemError);
          // Marca como lido para evitar loop infinito de erro
          await connection.addFlags(id, ['\\Seen']);
        }
      }

      connection.end();
    } catch (e) {
      console.error('[IMAP ERROR] Falha no ouvinte:', e);
      if (connection) connection.end();
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
