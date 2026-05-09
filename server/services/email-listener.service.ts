import cron from 'node-cron';
import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import pool from '../db/connection.js';
import ticketsService from './tickets.service.js';
import { env } from '../config/env.js';
import bcrypt from 'bcryptjs';

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
        const allStringParts: any = item.parts.filter((part: any) => part.which === '');
        const id = item.attributes.uid;
        
        let mailStr = '';
        if (allStringParts && allStringParts.length > 0) {
           mailStr = allStringParts[0].body;
        }

        const parsed = await simpleParser(mailStr);

        const fromObj = parsed.from?.value[0];
        const email = fromObj?.address;
        const name = fromObj?.name || email || 'Sem Nome';
        const subject = parsed.subject || 'Sem Assunto';
        const text = parsed.text || ''; 

        if (!email) {
          await connection.addFlags(id, ['\\Seen']);
          continue;
        }

        const { id: userId, empresa_id: empresaId } = await this.getOrCreateUser(email, name, fallbackEmpresaId);

        const match = subject.match(/\[Ticket\s*#(\d+)\]/i);
        if (match) {
           const ticketId = parseInt(match[1]);
           const ticket = await ticketsService.getById(ticketId);
           if (ticket) {
             await ticketsService.addMessage({
               ticket_id: ticketId,
               usuario_id: userId,
               mensagem: text,
               interno: 0
             });
             console.log(`[Email Listener] Added reply to Ticket #${ticketId}`);
             await connection.addFlags(id, ['\\Seen']);
             continue;
           }
        }

        const newTicketId = await ticketsService.create({
          empresa_id: empresaId,
          usuario_id: userId,
          titulo: subject,
          descricao: text,
          prioridade: 'media',
          categoria: 'suporte'
        });
        
        console.log(`[Email Listener] Created new Ticket #${newTicketId} from email.`);
        await connection.addFlags(id, ['\\Seen']);
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

    const defaultPass = await bcrypt.hash(Math.random().toString(), 10);
    const [result]: any = await pool.query(
      'INSERT INTO usuarios (nome, email, senha_hash, cargo, ativo, empresa_id) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, defaultPass, 'Cliente Externo', 1, fallbackEmpresaId]
    );
    return { id: result.insertId, empresa_id: fallbackEmpresaId };
  }
}
