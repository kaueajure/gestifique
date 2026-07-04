import pool from '../db/connection.js';
import { buildTicketEmailTemplate } from '../utils/mailer.js';
import { emailOutboundService, trackTicketEmailMessageIds } from './email-outbound.service.js';
import { maskEmail, maskIdentifier } from '../utils/sanitize.js';
const MAX_ATTEMPTS = 5;
const BACKOFF_MINUTES = [5, 15, 30, 60];
const LOCK_NAME = 'gestifique:email_outbox_processor';
function serializePayload(params) {
    return JSON.stringify(params);
}
function getNextAttemptSql(attempts) {
    const minutes = BACKOFF_MINUTES[Math.min(Math.max(attempts - 1, 0), BACKOFF_MINUTES.length - 1)];
    return `DATE_ADD(NOW(), INTERVAL ${minutes} MINUTE)`;
}
class EmailOutboxService {
    async enqueueTicketEmail(params) {
        const template = buildTicketEmailTemplate(params);
        const dedupeKey = params.dedupeKey || params.messageId || null;
        const [result] = await pool.query(`
        INSERT INTO email_outbox (
          empresa_id, ticket_id, tipo, destinatario, assunto, payload_json, dedupe_key, status, next_attempt_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pendente', NOW())
        ON DUPLICATE KEY UPDATE
          id = LAST_INSERT_ID(id),
          updated_at = updated_at
      `, [
            params.empresaId,
            params.ticketId,
            params.type,
            params.to,
            template.subject,
            serializePayload(params),
            dedupeKey
        ]);
        if (result.affectedRows === 1) {
            console.log(`[EmailOutbox] E-mail enfileirado para ${maskEmail(params.to)} ticket #${params.ticketId} (${params.type}, dedupe=${maskIdentifier(dedupeKey || '')}).`);
        }
        else {
            console.log(`[EmailOutbox] E-mail ja estava enfileirado para ticket #${params.ticketId} (${params.type}, dedupe=${maskIdentifier(dedupeKey || '')}).`);
        }
        return result.insertId || null;
    }
    async processPending(limit = 20) {
        const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
        const connection = await pool.getConnection();
        let hasLock = false;
        try {
            const [lockRows] = await connection.query('SELECT GET_LOCK(?, 1) AS locked', [LOCK_NAME]);
            hasLock = Number(lockRows?.[0]?.locked) === 1;
            if (!hasLock) {
                console.log('[EmailOutbox] Outro processador esta executando. Ciclo ignorado.');
                return { processed: 0, sent: 0, failed: 0 };
            }
            await connection.query(`
          UPDATE email_outbox
          SET status = 'erro',
              ultimo_erro = COALESCE(ultimo_erro, 'Processamento interrompido antes da conclusao.'),
              next_attempt_at = NOW(),
              updated_at = NOW()
          WHERE status = 'processando'
            AND locked_at < (NOW() - INTERVAL 10 MINUTE)
            AND sent_at IS NULL
        `);
            await connection.beginTransaction();
            const [claimResult] = await connection.query(`
          UPDATE email_outbox
          SET status = 'processando',
              locked_at = NOW(),
              tentativas = tentativas + 1,
              updated_at = NOW()
          WHERE status IN ('pendente', 'erro')
            AND tentativas < ?
            AND next_attempt_at <= NOW()
          ORDER BY next_attempt_at ASC, id ASC
          LIMIT ${safeLimit}
        `, [MAX_ATTEMPTS]);
            const [rows] = await connection.query(`
          SELECT *
          FROM email_outbox
          WHERE status = 'processando'
            AND locked_at >= (NOW() - INTERVAL 2 MINUTE)
          ORDER BY locked_at ASC, id ASC
          LIMIT ${safeLimit}
        `);
            await connection.commit();
            if (claimResult.affectedRows === 0 || rows.length === 0) {
                return { processed: 0, sent: 0, failed: 0 };
            }
            let sent = 0;
            let failed = 0;
            for (const row of rows) {
                try {
                    const payload = typeof row.payload_json === 'string' ? JSON.parse(row.payload_json) : row.payload_json;
                    const sendResult = await emailOutboundService.sendTicketEmail(payload);
                    if (sendResult.success) {
                        await pool.query(`
                UPDATE email_outbox
                SET status = 'enviado',
                    ultimo_erro = NULL,
                    sent_at = NOW(),
                    updated_at = NOW()
                WHERE id = ?
              `, [row.id]);
                        if (payload.messageId) {
                            await trackTicketEmailMessageIds(payload.empresaId, payload.ticketId, payload.messageId, sendResult);
                        }
                        sent++;
                        console.log(`[EmailOutbox] E-mail #${row.id} enviado para ${maskEmail(row.destinatario)} ticket #${row.ticket_id}.`);
                    }
                    else {
                        failed++;
                        await this.markFailed(row.id, row.tentativas, sendResult.error || 'Falha desconhecida no envio');
                    }
                }
                catch (err) {
                    failed++;
                    await this.markFailed(row.id, row.tentativas, err?.message || 'Erro inesperado ao processar outbox');
                }
            }
            return { processed: rows.length, sent, failed };
        }
        catch (err) {
            try {
                await connection.rollback();
            }
            catch { }
            console.error('[EmailOutbox] Falha no processamento da outbox:', err);
            throw err;
        }
        finally {
            if (hasLock) {
                try {
                    await connection.query('SELECT RELEASE_LOCK(?)', [LOCK_NAME]);
                }
                catch { }
            }
            connection.release();
        }
    }
    async markFailed(id, attempts, error) {
        const finalError = attempts >= MAX_ATTEMPTS;
        const nextAttemptSql = finalError ? 'NULL' : getNextAttemptSql(attempts);
        await pool.query(`
        UPDATE email_outbox
        SET status = 'erro',
            ultimo_erro = ?,
            next_attempt_at = COALESCE(${nextAttemptSql}, next_attempt_at),
            updated_at = NOW()
        WHERE id = ?
      `, [String(error).slice(0, 4000), id]);
        console.error(`[EmailOutbox] E-mail #${id} falhou na tentativa ${attempts}/${MAX_ATTEMPTS}: ${error}`);
    }
}
export const emailOutboxService = new EmailOutboxService();
