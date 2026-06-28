import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { maskEmail, maskIdentifier } from './sanitize.js';

const transporter = nodemailer.createTransport({
  host: env.SMTP.HOST,
  port: env.SMTP.PORT,
  secure: env.SMTP.PORT === 465,
  auth: {
    user: env.SMTP.USER,
    pass: env.SMTP.PASS,
  },
  tls: {
    // S1: padrão seguro (valida o certificado). Só relaxa via MAIL_TLS_INSECURE=true.
    rejectUnauthorized: !env.MAIL_TLS_INSECURE
  }
});

export interface ChannelSmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: { user: string; pass: string };
}

/**
 * Verifica conexão/autenticação de um SMTP de canal (sem enviar e-mail).
 */
export const verifyChannelSmtp = async (config: ChannelSmtpConfig) => {
  try {
    const t = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
      tls: { rejectUnauthorized: !env.MAIL_TLS_INSECURE }
    });
    await t.verify();
    return { success: true, message: 'SMTP do canal conectado com sucesso.' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

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
    console.log(`[Mailer] Test email sent to ${maskEmail(to)} (Message-ID: ${maskIdentifier(info.messageId)})`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[Mailer] Failed to send test email to ${maskEmail(to)}:`, error.message);
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
    console.log(`[Mailer] Recovery email sent to ${maskEmail(email)}`);
  } catch (error: any) {
    console.error(`[Mailer] Failed to send recovery email to ${maskEmail(email)}:`, error.message);
  }
};

export interface TicketNotificationOptions {
  replyTo?: string;
  messageId?: string;
  references?: string[];
  inReplyTo?: string;
}

export type TicketEmailType = 'ticket_created' | 'agent_reply' | 'ticket_resolved' | 'ticket_closed';

export interface TicketEmailAttachment {
  filename: string;
  path: string;
  contentType?: string;
}

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
  attachments?: TicketEmailAttachment[];
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
  let headline = '';
  let leadText = '';
  let messageLabel = 'Mensagem';
  let messageHtml = '';
  let actionHtml = '';

  const safeTitle = escapeHtml(title);
  const safeCustomerName = escapeHtml(customerName);
  const safeAgentName = escapeHtml(agentName);
  const safeMessage = escapeHtml(message);
  const safeCategory = escapeHtml(category);
  const safePriority = escapeHtml(priority);
  const safeStatus = escapeHtml(status);
  const safeResolutionReason = escapeHtml(resolutionReason);
  const safeResolutionObservation = escapeHtml(resolutionObservation);
  const safeSubjectTitle = String(title || '').replace(/[\r\n]+/g, ' ').trim();

  const normalizedStatus = String(status || '').toLowerCase();
  const statusColor = normalizedStatus.includes('resol') || normalizedStatus.includes('fech')
    ? '#15803d'
    : normalizedStatus.includes('aguard')
      ? '#b45309'
      : '#2563eb';
  const statusBg = normalizedStatus.includes('resol') || normalizedStatus.includes('fech')
    ? '#dcfce7'
    : normalizedStatus.includes('aguard')
      ? '#fef3c7'
      : '#dbeafe';

  switch (type) {
    case 'ticket_created':
      subject = `[Ticket #${ticketId}] Recebemos sua solicitação: ${safeSubjectTitle}`;
      headline = 'Recebemos sua solicitação';
      leadText = `Olá, ${safeCustomerName}. Abrimos o chamado <strong>#${ticketId}</strong> e nossa equipe vai acompanhar por este mesmo e-mail.`;
      messageLabel = 'Mensagem recebida';
      messageHtml = safeMessage;
      actionHtml = 'Para adicionar novas informações, basta responder este e-mail. Sua resposta será registrada automaticamente no chamado.';
      break;

    case 'agent_reply':
      subject = `[Ticket #${ticketId}] Nova resposta: ${safeSubjectTitle}`;
      headline = 'Nova resposta no seu chamado';
      leadText = `Olá, ${safeCustomerName}. <strong>${safeAgentName}</strong> respondeu ao chamado <strong>#${ticketId}</strong>.`;
      messageLabel = 'Resposta do atendimento';
      messageHtml = safeMessage;
      actionHtml = 'Para continuar o atendimento, responda este e-mail. Sua resposta será adicionada automaticamente ao chamado.';
      break;

    case 'ticket_resolved':
      subject = `[Ticket #${ticketId}] Chamado resolvido: ${safeSubjectTitle}`;
      headline = 'Chamado resolvido';
      leadText = `Olá, ${safeCustomerName}. Seu chamado <strong>#${ticketId}</strong> foi marcado como resolvido.`;
      messageLabel = 'Resumo do fechamento';
      messageHtml = `
        ${safeResolutionReason ? `<p style="margin:0 0 8px 0;"><strong>Motivo:</strong> ${safeResolutionReason}</p>` : ''}
        ${safeResolutionObservation ? `<p style="margin:0;"><strong>Observação:</strong> ${safeResolutionObservation}</p>` : '<p style="margin:0;">O atendimento foi marcado como resolvido pela nossa equipe.</p>'}
      `;
      actionHtml = 'Se ainda precisar de ajuda, responda este e-mail. Nossa equipe poderá reavaliar o atendimento.';
      break;

    case 'ticket_closed':
      subject = `[Ticket #${ticketId}] Chamado encerrado: ${safeSubjectTitle}`;
      headline = 'Chamado encerrado';
      leadText = `Olá, ${safeCustomerName}. Seu chamado <strong>#${ticketId}</strong> foi encerrado.`;
      messageLabel = 'Encerramento';
      messageHtml = `
        <p style="margin:0 0 8px 0;"><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
        <p style="margin:0;">Este atendimento foi finalizado.</p>
      `;
      actionHtml = 'Caso precise de ajuda novamente, responda este e-mail ou abra uma nova solicitação.';
      break;
  }

  const html = `
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">
      Atualização do chamado #${ticketId}: ${safeSubjectTitle}
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%; background:#f4f7fb; margin:0; padding:0; border-collapse:collapse;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="720" cellspacing="0" cellpadding="0" style="width:100%; max-width:720px; border-collapse:collapse;">
            <tr>
              <td style="background:#0f172a; border-radius:16px 16px 0 0; padding:22px 26px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="font-family:Arial, Helvetica, sans-serif; color:#ffffff;">
                      <div style="font-size:13px; letter-spacing:.04em; text-transform:uppercase; color:#93c5fd; font-weight:700;">Gestifique</div>
                      <div style="font-size:22px; line-height:1.25; font-weight:700; margin-top:6px;">${headline}</div>
                    </td>
                    <td align="right" style="font-family:Arial, Helvetica, sans-serif; color:#cbd5e1; font-size:13px; white-space:nowrap;">
                      <span style="display:inline-block; background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.16); color:#ffffff; border-radius:999px; padding:8px 12px; font-weight:700;">Ticket #${ticketId}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff; border:1px solid #dbe3ef; border-top:0; border-radius:0 0 16px 16px; overflow:hidden;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="padding:28px 30px 18px 30px; font-family:Arial, Helvetica, sans-serif; color:#1f2937;">
                      <p style="margin:0; font-size:15px; line-height:1.65;">${leadText}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 30px 20px 30px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate; border-spacing:0; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px;">
                        <tr>
                          <td style="padding:16px 18px; font-family:Arial, Helvetica, sans-serif;">
                            <div style="font-size:12px; letter-spacing:.04em; text-transform:uppercase; color:#64748b; font-weight:700; margin-bottom:8px;">Resumo do chamado</div>
                            <div style="font-size:17px; line-height:1.35; color:#0f172a; font-weight:700; margin-bottom:14px;">${safeTitle}</div>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                              <tr>
                                <td style="padding:6px 0; font-size:13px; color:#64748b;">Status</td>
                                <td align="right" style="padding:6px 0;">
                                  <span style="display:inline-block; background:${statusBg}; color:${statusColor}; border-radius:999px; padding:5px 10px; font-size:12px; font-weight:700;">${safeStatus}</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding:6px 0; font-size:13px; color:#64748b;">Prioridade</td>
                                <td align="right" style="padding:6px 0; font-size:13px; color:#111827; font-weight:700;">${safePriority}</td>
                              </tr>
                              <tr>
                                <td style="padding:6px 0; font-size:13px; color:#64748b;">Categoria</td>
                                <td align="right" style="padding:6px 0; font-size:13px; color:#111827; font-weight:700;">${safeCategory}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 30px 20px 30px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate; border-spacing:0; border:1px solid #dbeafe; border-radius:12px; background:#ffffff;">
                        <tr>
                          <td style="padding:18px 20px; font-family:Arial, Helvetica, sans-serif;">
                            <div style="font-size:12px; letter-spacing:.04em; text-transform:uppercase; color:#2563eb; font-weight:700; margin-bottom:10px;">${messageLabel}</div>
                            <div style="font-size:15px; line-height:1.65; color:#1f2937;">${messageHtml}</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 30px 24px 30px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate; border-spacing:0; background:#eff6ff; border:1px solid #bfdbfe; border-radius:12px;">
                        <tr>
                          <td style="padding:14px 18px; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.6; color:#1e3a8a;">
                            ${actionHtml}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:20px 30px 28px 30px; background:#fbfdff; border-top:1px solid #e5edf7; font-family:Arial, Helvetica, sans-serif;">
                      <p style="margin:0 0 6px 0; font-size:13px; color:#64748b;">Atenciosamente,</p>
                      <p style="margin:0; font-size:15px; color:#0f172a; font-weight:700;">Equipe de Atendimento</p>
                      <p style="margin:4px 0 0 0; font-size:13px; color:#64748b;">Gestifique</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  return { subject, html, text: html.replace(/<[^>]*>?/gm, '') };
};

export const sendTicketEmail = async (
  params: TicketEmailParams,
  options?: {
    transportConfig?: {
      host: string;
      port: number;
      secure: boolean;
      auth: { user: string; pass: string };
    };
    from?: string;
  }
) => {
  const useChannelTransport = !!options?.transportConfig;

  // Transporter por canal (identidade da empresa) ou global (fallback técnico).
  const activeTransporter = useChannelTransport
    ? nodemailer.createTransport({
        host: options!.transportConfig!.host,
        port: options!.transportConfig!.port,
        secure: options!.transportConfig!.secure,
        auth: options!.transportConfig!.auth,
        tls: {
          // S1: validação de certificado segura por padrão.
          rejectUnauthorized: !env.MAIL_TLS_INSECURE
        }
      })
    : transporter;

  if (!useChannelTransport && !env.SMTP.HOST) {
    console.error('[Mailer] SMTP not configured. Skipping email notification.');
    return { success: false, error: 'SMTP not configured' };
  }

  const msgId = params.messageId || `<ticket-${params.ticketId}-${Date.now()}@gestifique.com.br>`;
  const template = buildTicketEmailTemplate(params);

  const mailOptions: any = {
    // From: identidade do canal quando fornecida; senão, global (fallback técnico).
    from: options?.from || env.SMTP.FROM,
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

  if (params.attachments && params.attachments.length > 0) {
    mailOptions.attachments = params.attachments.map(attachment => ({
      filename: attachment.filename,
      path: attachment.path,
      contentType: attachment.contentType
    }));
  }

  if (params.inReplyTo) {
    mailOptions.inReplyTo = params.inReplyTo;
    mailOptions.references = params.references || [params.inReplyTo];
  }

  try {
    const info = await activeTransporter.sendMail(mailOptions);
    console.log(`[Mailer] Ticket email (${params.type}) sent to ${maskEmail(params.to)} (ID: ${params.ticketId}, via: ${useChannelTransport ? 'channel' : 'global'}, Message-ID: ${maskIdentifier(info.messageId)})`);
    return {
      success: true,
      messageId: msgId,
      providerMessageId: info.messageId
    };
  } catch (error: any) {
    console.error(`[Mailer] Failed to send ticket email (${params.type}) to ${maskEmail(params.to)}:`, error.message);
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
    console.log(`[Mailer] Portal access code sent to ${maskEmail(to)} (Message-ID: ${maskIdentifier(info.messageId)})`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[Mailer] Failed to send portal access code to ${maskEmail(to)}:`, error.message);
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

