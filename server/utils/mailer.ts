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

export type TicketEmailType = 'ticket_created' | 'agent_reply' | 'ticket_resolved' | 'ticket_closed';

export interface TicketEmailParams {
  to: string;
  ticketId: number;
  type: TicketEmailType;
  title: string;
  customerName?: string;
  agentName?: string;
  message?: string;
  status?: string;
  priority?: string;
  category?: string;
  resolutionReason?: string;
  resolutionObservation?: string;
  messageId?: string;
  inReplyTo?: string;
  references?: string[];
  replyTo?: string;
}

const escapeHtml = (unsafe: string) => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n/g, "<br>");
};

export const buildTicketEmailTemplate = (params: Pick<TicketEmailParams, 'type' | 'ticketId' | 'title' | 'customerName' | 'agentName' | 'message' | 'status' | 'priority' | 'category' | 'resolutionReason' | 'resolutionObservation'>) => {
  const {
    type,
    ticketId,
    title,
    customerName = 'Cliente',
    agentName = 'Nossa equipe',
    message = '',
    status = 'Aberto',
    priority = 'Normal',
    category = 'Geral',
    resolutionReason = '',
    resolutionObservation = ''
  } = params;

  let subject = '';
  let contentHtml = '';

  const safeTitle = escapeHtml(title);
  const safeCustomerName = escapeHtml(customerName);
  const safeAgentName = escapeHtml(agentName);
  const safeMessage = escapeHtml(message);
  const safeCategory = escapeHtml(category);
  const safePriority = escapeHtml(priority);
  const safeStatus = escapeHtml(status);

  switch (type) {
    case 'ticket_created':
      subject = `[Ticket #${ticketId}] Recebemos sua solicitação: ${title}`;
      contentHtml = `
        <p>Olá, ${safeCustomerName}.</p>
        <p>Recebemos sua solicitação e abrimos o chamado <strong>#${ticketId}</strong>.</p>
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #e2e8f0;">
          <h4 style="margin-top: 0; color: #334155; font-size: 14px; text-transform: uppercase;">Resumo do chamado</h4>
          <p style="margin: 4px 0;"><strong>Título:</strong> ${safeTitle}</p>
          <p style="margin: 4px 0;"><strong>Categoria:</strong> ${safeCategory}</p>
          <p style="margin: 4px 0;"><strong>Prioridade:</strong> ${safePriority}</p>
          <p style="margin: 4px 0;"><strong>Status:</strong> ${safeStatus}</p>
        </div>
        <div style="margin: 16px 0;">
          <h4 style="margin-bottom: 8px; color: #334155; font-size: 14px; text-transform: uppercase;">Mensagem recebida:</h4>
          <blockquote style="margin: 0; padding-left: 12px; border-left: 4px solid #cbd5e1; color: #475569; font-style: italic;">
            ${safeMessage}
          </blockquote>
        </div>
        <p>Nossa equipe irá analisar sua solicitação e responderá por este mesmo e-mail.</p>
        <p>Para adicionar novas informações, basta responder esta mensagem.</p>
      `;
      break;

    case 'agent_reply':
      subject = `[Ticket #${ticketId}] Nova resposta: ${title}`;
      contentHtml = `
        <p>Olá, ${safeCustomerName}.</p>
        <p><strong>${safeAgentName}</strong> respondeu ao seu chamado <strong>#${ticketId}</strong>.</p>
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #e2e8f0;">
          <p style="margin: 0;">${message} <!-- Already formatted by our generic notification when using old method, but if empty we just show it. Ideally we shouldn't escape if message contains HTML like <br>, but we did above. So we will assume message comes as text --></p>
        </div>
        <p>Status atual: <strong>${safeStatus}</strong></p>
        <p>Para continuar o atendimento, responda este e-mail. Sua resposta será adicionada automaticamente ao chamado.</p>
      `;
      // Override message render to support basic HTML if provided by older method
      if (message.includes('<br>') || message.includes('<i>')) {
        contentHtml = contentHtml.replace('${message}', message); // skip full escape if it smells like HTML already provided
      } else {
        contentHtml = contentHtml.replace('${message}', safeMessage);
      }
      break;

    case 'ticket_resolved':
      subject = `[Ticket #${ticketId}] Chamado resolvido: ${title}`;
      contentHtml = `
        <p>Olá, ${safeCustomerName}.</p>
        <p>Seu chamado <strong>#${ticketId}</strong> foi marcado como <strong>resolvido</strong>.</p>
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #e2e8f0;">
          <h4 style="margin-top: 0; color: #334155; font-size: 14px; text-transform: uppercase;">Resumo do fechamento</h4>
          <p style="margin: 4px 0;"><strong>Título:</strong> ${safeTitle}</p>
          <p style="margin: 4px 0;"><strong>Status:</strong> Resolvido</p>
          ${resolutionReason ? `<p style="margin: 4px 0;"><strong>Motivo da resolução:</strong> ${escapeHtml(resolutionReason)}</p>` : ''}
          ${resolutionObservation ? `<p style="margin: 4px 0;"><strong>Observação:</strong> ${escapeHtml(resolutionObservation)}</p>` : ''}
        </div>
        <p>Se ainda precisar de ajuda, responda este e-mail. Nossa equipe poderá reavaliar o atendimento.</p>
      `;
      break;

    case 'ticket_closed':
      subject = `[Ticket #${ticketId}] Chamado encerrado: ${title}`;
      contentHtml = `
        <p>Olá, ${safeCustomerName}.</p>
        <p>Seu chamado <strong>#${ticketId}</strong> foi <strong>encerrado</strong>.</p>
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #e2e8f0;">
          <p style="margin: 4px 0;"><strong>Título:</strong> ${safeTitle}</p>
          <p style="margin: 4px 0;"><strong>Status:</strong> Fechado</p>
          <p style="margin: 4px 0;"><strong>Data de encerramento:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
        </div>
        <p>Este atendimento foi finalizado. Caso precise de ajuda novamente, responda este e-mail ou abra uma nova solicitação.</p>
      `;
      break;
  }

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #334155;">
      <div style="padding: 32px 0;">
        ${contentHtml}
        <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b;">
          <p style="margin: 0;">Atenciosamente,</p>
          <p style="margin: 4px 0 0 0; font-weight: 600; color: #334155;">Equipe de Atendimento</p>
          <p style="margin: 4px 0 0 0;">Gestifique</p>
        </div>
      </div>
    </div>
  `;

  return { subject, html, text: html.replace(/<[^>]*>?/gm, '') };
};

export const sendTicketEmail = async (params: TicketEmailParams) => {
  if (!env.SMTP.HOST) {
    console.error('[Mailer] SMTP not configured. Skipping email notification.');
    return { success: false, error: 'SMTP not configured' };
  }

  const msgId = params.messageId || `<ticket-${params.ticketId}-${Date.now()}@gestifique.com.br>`;
  const template = buildTicketEmailTemplate(params);

  const mailOptions: any = {
    from: env.SMTP.FROM,
    to: params.to,
    subject: template.subject,
    messageId: msgId,
    replyTo: params.replyTo || env.IMAP.USER || env.SMTP.FROM,
    headers: {
      'X-Auto-Response-Suppress': 'OOF, AutoReply',
      'X-Gestifique-Ticket-ID': params.ticketId.toString(),
      'Auto-Submitted': 'no',
      'X-Gestifique-System': 'true',
      'X-Gestifique-Message-Type': params.type,
      'X-Gestifique-Thread-Key': `ticket-${params.ticketId}`
    },
    html: template.html,
    text: template.text,
  };

  if (params.inReplyTo) {
    mailOptions.inReplyTo = params.inReplyTo;
    mailOptions.references = params.references || [params.inReplyTo];
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Mailer] Ticket email (${params.type}) sent to ${params.to} (ID: ${params.ticketId}, Message-ID: ${info.messageId})`);
    return {
      success: true,
      messageId: msgId,
      providerMessageId: info.messageId
    };
  } catch (error: any) {
    console.error(`[Mailer] Failed to send ticket email (${params.type}) to ${params.to}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const sendPortalAccessCodeEmail = async (params: {
  to: string;
  code: string;
  empresaNome?: string;
  expiresMinutes?: number;
}) => {
  const { to, code, empresaNome = 'Gestifique', expiresMinutes = 10 } = params;
  const safeEmpresaNome = escapeHtml(empresaNome);

  const mailOptions = {
    from: env.SMTP.FROM,
    to,
    subject: 'Código de acesso ao Portal do Cliente',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #2563eb; padding: 24px; text-align: center;">
          <h2 style="color: white; margin: 0;">Código de Acesso</h2>
        </div>
        <div style="padding: 32px; color: #334155;">
          <p style="font-size: 16px;">Você solicitou acesso ao Portal do Cliente da <strong>${safeEmpresaNome}</strong>. Use o código abaixo para entrar:</p>
          <div style="background-color: #f1f5f9; padding: 24px; border-radius: 8px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 12px; color: #0f172a; font-family: monospace;">${code}</span>
          </div>
          <p style="font-size: 14px; color: #64748b;">Este código é válido por ${expiresMinutes} minutos.</p>
          <p style="font-size: 14px; color: #94a3b8; margin-top: 24px;">Se você não solicitou este acesso, pode ignorar este e-mail com segurança.</p>
        </div>
        <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
          Enviado por Gestifique - Gestão de Atendimento
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Mailer] Portal access code sent to ${to}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[Mailer] Failed to send portal access code to ${to}:`, error);
    return { success: false, error: error.message };
  }
};

export const sendTicketNotification = async (
  email: string, 
  ticketId: number, 
  titulo: string, 
  mensagem: string,
  options: TicketNotificationOptions = {}
) => {
  // Legacy support for basic notifications using exactly the new system
  return sendTicketEmail({
    to: email,
    ticketId,
    type: 'agent_reply',
    title: titulo,
    message: mensagem,
    messageId: options.messageId,
    inReplyTo: options.inReplyTo,
    references: options.references,
    replyTo: options.replyTo,
  });
};

