import pool from '../db/connection.js';
import { buildTicketEmailTemplate, sendTicketEmail, } from '../utils/mailer.js';
import { emailChannelsService } from './email-channels.service.js';
import { gmailOAuthService } from './gmail-oauth.service.js';
export async function trackTicketEmailMessageIds(empresaId, ticketId, outboundMessageId, result) {
    if (!result.success)
        return;
    const idsToTrack = [
        outboundMessageId,
        result.messageId,
        result.providerMessageId,
    ].filter((id) => typeof id === 'string' && id.trim().length > 0);
    for (const idToTrack of new Set(idsToTrack)) {
        try {
            await pool.query('INSERT IGNORE INTO processed_emails (message_id, empresa_id, ticket_id) VALUES (?, ?, ?)', [idToTrack.trim(), empresaId, ticketId]);
        }
        catch (dbErr) {
            console.error('[EmailOutbound] Error storing tracked message ID:', dbErr);
        }
    }
}
class EmailOutboundService {
    async sendTicketEmail(params) {
        const msgId = params.messageId || `<ticket-${params.ticketId}-${Date.now()}@gestifique.com.br>`;
        const template = buildTicketEmailTemplate(params);
        let channel = null;
        if (params.emailChannelId) {
            channel = await emailChannelsService.getByIdAndCompany(params.emailChannelId, params.empresaId);
        }
        const replyTo = channel?.email_publico || params.replyTo;
        if (channel &&
            channel.send_provider === 'gmail_oauth' &&
            channel.send_status === 'connected' &&
            gmailOAuthService.isConfigured()) {
            const gmailResult = await gmailOAuthService.sendEmail(channel.id, params.empresaId, {
                to: params.to,
                subject: template.subject,
                html: template.html,
                text: template.text,
                from: channel.oauth_email || channel.email_publico,
                messageId: msgId,
                inReplyTo: params.inReplyTo,
                references: params.references,
                extraHeaders: {
                    'X-Auto-Response-Suppress': 'OOF, AutoReply',
                    'X-Gestifique-Ticket-ID': params.ticketId.toString(),
                    'Auto-Submitted': 'no',
                    'X-Gestifique-System': 'true',
                    'X-Gestifique-Message-Type': params.type,
                    'X-Gestifique-Thread-Key': `ticket-${params.ticketId}`,
                },
            }, { updateChannelError: false });
            if (gmailResult.success) {
                console.log(`[EmailOutbound] Ticket email (${params.type}) sent via Gmail to ${params.to} (ticket #${params.ticketId})`);
                return {
                    success: true,
                    messageId: msgId,
                    providerMessageId: gmailResult.providerMessageId,
                    provider: 'gmail',
                };
            }
            console.warn(`[EmailOutbound] Gmail failed for ticket #${params.ticketId}, using SMTP fallback: ${gmailResult.error}`);
        }
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
