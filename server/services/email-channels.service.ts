import crypto from 'crypto';
import pool from '../db/connection.js';
import { env } from '../config/env.js';

const PUBLIC_CHANNEL_COLUMNS = `
  id, empresa_id, nome, email_publico, inbound_address, verification_token, status,
  ultimo_erro, last_received_at, verified_at, created_at, updated_at
`;

export class EmailChannelsService {
  async listByCompany(empresaId: number) {
    const [rows]: any = await pool.query(
      `SELECT ${PUBLIC_CHANNEL_COLUMNS} FROM empresa_email_canais WHERE empresa_id = ? ORDER BY created_at DESC`,
      [empresaId]
    );
    return rows;
  }

  async getByIdAndCompany(channelId: number, empresaId: number) {
    const [rows]: any = await pool.query(
      'SELECT * FROM empresa_email_canais WHERE id = ? AND empresa_id = ? LIMIT 1',
      [channelId, empresaId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async createChannel(data: { empresa_id: number; nome?: string; email_publico: string }) {
    const { empresa_id, nome, email_publico } = data;

    const randomHex = crypto.randomBytes(4).toString('hex');
    const inbound_address =
      `${env.INBOUND_EMAIL_PREFIX}-${empresa_id}-${randomHex}@${env.INBOUND_EMAIL_DOMAIN}`.toLowerCase();
    const verification_token = crypto.randomBytes(16).toString('hex');

    const [result]: any = await pool.query(
      'INSERT INTO empresa_email_canais (empresa_id, nome, email_publico, inbound_address, verification_token, status) VALUES (?, ?, ?, ?, ?, ?)',
      [empresa_id, nome || null, email_publico, inbound_address, verification_token, 'pendente']
    );

    await pool.query(
      'INSERT INTO logs_sistema (empresa_id, acao, descricao, user_agent, ip) VALUES (?, ?, ?, ?, ?)',
      [
        empresa_id,
        'EMAIL_CHANNEL_CREATED',
        `Canal de e-mail criado: ${inbound_address} referenciando ${email_publico}`,
        'SYSTEM',
        '127.0.0.1',
      ]
    );

    return result.insertId;
  }

  async getByInboundAddress(address: string) {
    const [rows]: any = await pool.query(
      'SELECT * FROM empresa_email_canais WHERE inbound_address = ? LIMIT 1',
      [address.toLowerCase()]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async markVerified(channelId: number) {
    await pool.query(
      'UPDATE empresa_email_canais SET status = ?, verified_at = NOW() WHERE id = ? AND status = ?',
      ['ativo', channelId, 'pendente']
    );

    await pool.query(
      'INSERT INTO logs_sistema (acao, descricao, user_agent, ip) VALUES (?, ?, ?, ?)',
      ['EMAIL_CHANNEL_VERIFIED', `Canal de e-mail ID ${channelId} verificado/ativado.`, 'SYSTEM_LISTENER', '127.0.0.1']
    );
  }

  async markError(channelId: number, errorMsg: string) {
    await pool.query(
      'UPDATE empresa_email_canais SET status = ?, ultimo_erro = ? WHERE id = ?',
      ['erro', errorMsg, channelId]
    );

    await pool.query(
      'INSERT INTO logs_sistema (acao, descricao, user_agent, ip) VALUES (?, ?, ?, ?)',
      ['EMAIL_CHANNEL_ERROR', `Erro no canal de e-mail ID ${channelId}: ${errorMsg}`, 'SYSTEM_LISTENER', '127.0.0.1']
    );
  }

  async touchReceived(channelId: number) {
    await pool.query(
      'UPDATE empresa_email_canais SET last_received_at = NOW(), ultimo_erro = NULL WHERE id = ?',
      [channelId]
    );

    await pool.query(
      'UPDATE empresa_email_canais SET status = ?, verified_at = NOW() WHERE id = ? AND (status = ? OR status = ?)',
      ['ativo', channelId, 'pendente', 'erro']
    );
  }

  async deleteChannel(id: number, empresaId: number) {
    await pool.query('DELETE FROM empresa_email_canais WHERE id = ? AND empresa_id = ?', [id, empresaId]);
  }

  async regenerate(id: number, empresaId: number) {
    const randomHex = crypto.randomBytes(4).toString('hex');
    const inbound_address =
      `${env.INBOUND_EMAIL_PREFIX}-${empresaId}-${randomHex}@${env.INBOUND_EMAIL_DOMAIN}`.toLowerCase();
    const verification_token = crypto.randomBytes(16).toString('hex');

    await pool.query(
      'UPDATE empresa_email_canais SET inbound_address = ?, verification_token = ?, status = ? WHERE id = ? AND empresa_id = ?',
      [inbound_address, verification_token, 'pendente', id, empresaId]
    );
  }
}

export const emailChannelsService = new EmailChannelsService();
