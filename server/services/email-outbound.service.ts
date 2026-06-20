import pool from '../db/connection.js';
import { sendTicketEmail, TicketEmailParams } from '../utils/mailer.js';
import { emailChannelsService } from './email-channels.service.js';

export interface TicketOutboundParams extends TicketEmailParams {
  empresaId: number;
  emailChannelId?: number | null;
}

export interface TicketEmailSendResult {
  success: boolean;
  messageId?: string;
  providerMessageId?: string;
  provider?: 'smtp';
  error?: string;
}

export async function trackTicketEmailMessageIds(
  empresaId: number,
  ticketId: number,
  outboundMessageId: string,
  result: TicketEmailSendResult
) {
  if (!result.success) return;

  const idsToTrack = [
    outboundMessageId,
    result.messageId,
    result.providerMessageId,
  ].filter((id): id is string => typeof id === 'string' && id.trim().length > 0);

  for (const idToTrack of new Set(idsToTrack)) {
    try {
      await pool.query(
        'INSERT IGNORE INTO processed_emails (message_id, empresa_id, ticket_id) VALUES (?, ?, ?)',
        [idToTrack.trim(), empresaId, ticketId]
      );
    } catch (dbErr: any) {
      console.error('[EmailOutbound] Error storing tracked message ID:', dbErr);
    }
  }
}

class EmailOutboundService {
  async sendTicketEmail(params: TicketOutboundParams): Promise<TicketEmailSendResult> {
    const msgId = params.messageId || `<ticket-${params.ticketId}-${Date.now()}@gestifique.com.br>`;

    let channel: any = null;
    if (params.emailChannelId) {
      channel = await emailChannelsService.getByIdAndCompany(
        params.emailChannelId,
        params.empresaId
      );
    }

    const replyTo = channel?.email_publico || params.replyTo;

    const smtpResult = await sendTicketEmail({
      ...params,
      messageId: msgId,
      replyTo,
    });

    return {
      success: smtpResult.success,
      messageId: smtpResult.messageId,
      providerMessageId: smtpResult.providerMessageId,
      provider: 'smtp',
      error: smtpResult.error,
    };
  }
}

export const emailOutboundService = new EmailOutboundService();
