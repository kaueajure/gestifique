import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transporter = nodemailer.createTransport({
  host: env.SMTP.HOST,
  port: env.SMTP.PORT,
  secure: env.SMTP.PORT === 465,
  auth: {
    user: env.SMTP.USER,
    pass: env.SMTP.PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

export const verifySMTP = async () => {
  try {
    if (!env.SMTP.HOST || !env.SMTP.USER) {
      throw new Error('Configuração SMTP incompleta.');
    }
    await transporter.verify();
    return { success: true, message: 'SMTP conectado com sucesso.' };
  } catch (error: any) {
    console.error('[Mailer] SMTP Verification failed:', error.message);
    return { success: false, error: error.message };
  }
};

export const sendTestEmail = async (to: string) => {
  const mailOptions = {
    from: env.SMTP.FROM,
    to,
    subject: 'Teste de E-mail - Gestifique',
    text: 'Se você está recebendo isso, a configuração SMTP do Gestifique está funcionando corretamente!',
    html: '<b>Se você está recebendo isso, a configuração SMTP do Gestifique está funcionando corretamente!</b>',
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[Mailer] Test email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('[Mailer] Failed to send test email:', error);
    return { success: false, error: error.message };
  }
};

export const sendPasswordRecoveryEmail = async (email: string, token: string) => {
  const mailOptions = {
    from: env.SMTP.FROM,
    to: email,
    subject: 'Recuperação de Senha - Gestifique',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #2563eb; padding: 24px; text-align: center;">
          <h2 style="color: white; margin: 0;">Recuperação de Senha</h2>
        </div>
        <div style="padding: 32px; color: #334155;">
          <p style="font-size: 16px;">Você solicitou a redefinição de sua senha. Use o código abaixo para criar uma nova senha:</p>
          <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #0f172a;">${token}</span>
          </div>
          <p style="font-size: 14px; color: #64748b;">Este código é válido por 30 minutos. Se você não solicitou esta redefinição, apenas ignore este e-mail.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Mailer] Recovery email sent to ${email}`);
  } catch (error) {
    console.error(`[Mailer] Failed to send recovery email to ${email}:`, error);
  }
};

export interface TicketNotificationOptions {
  replyTo?: string;
  messageId?: string;
  references?: string[];
  inReplyTo?: string;
}

export const sendTicketNotification = async (
  email: string, 
  ticketId: number, 
  titulo: string, 
  mensagem: string,
  options: TicketNotificationOptions = {}
) => {
  if (!env.SMTP.HOST) {
    console.error('[Mailer] SMTP not configured. Skipping email notification.');
    return;
  }

  const msgId = options.messageId || `<ticket-${ticketId}-${Date.now()}@gestifique.com.br>`;

  const mailOptions: any = {
    from: env.SMTP.FROM,
    to: email,
    subject: `[Ticket #${ticketId}] ${titulo}`,
    messageId: msgId,
    replyTo: options.replyTo || env.IMAP.USER || env.SMTP.FROM,
    headers: {
      'X-Auto-Response-Suppress': 'OOF, AutoReply',
      'X-Gestifique-Ticket-ID': ticketId.toString()
    },
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #2563eb; padding: 24px; text-align: center;">
          <h2 style="color: white; margin: 0;">Atualização no Chamado #${ticketId}</h2>
        </div>
        <div style="padding: 32px; color: #334155;">
          <h3 style="margin-top: 0;">${titulo}</h3>
          <p style="font-size: 16px; line-height: 1.5;">${mensagem}</p>
          <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8;">
            <p>Por favor, responda a este e-mail para manter a conversa no chamado.</p>
            <p>Equipe Gestifique</p>
          </div>
        </div>
      </div>
    `,
  };

  if (options.inReplyTo) {
    mailOptions.inReplyTo = options.inReplyTo;
    mailOptions.references = options.references || [options.inReplyTo];
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Mailer] Ticket notification sent to ${email} (ID: ${ticketId})`);
  } catch (error) {
    console.error(`[Mailer] Failed to send ticket notification to ${email}:`, error);
  }
};

