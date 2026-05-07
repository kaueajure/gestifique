import pool from '../db/connection.js';
import { promises as fs } from 'fs';

export interface AttachmentData {
  id: number;
  ticket_id: number;
  mensagem_id?: number | null;
  usuario_id: number;
  empresa_id: number | null;
  nome_original: string;
  nome_arquivo: string;
  caminho: string;
  mime_type: string;
  tamanho_bytes: number;
  tipo: string;
  interno: boolean;
  created_at: string;
  usuario_nome?: string;
  url?: string;
}

class AttachmentsService {
  async listByTicket(ticketId: number, includeInternal: boolean): Promise<AttachmentData[]> {
    let query = `
      SELECT a.*, u.nome as usuario_nome
      FROM ticket_anexos a
      JOIN usuarios u ON a.usuario_id = u.id
      WHERE a.ticket_id = ?
    `;
    if (!includeInternal) {
      query += ' AND a.interno = 0';
    }
    query += ' ORDER BY a.created_at DESC';
    
    const [rows]: any = await pool.query(query, [ticketId]);
    return (rows as AttachmentData[]).map(row => ({
      ...row,
      interno: !!row.interno,
      url: `/api/attachments/${row.id}/download`
    }));
  }

  async getById(id: number): Promise<AttachmentData | null> {
    const [rows]: any = await pool.query(
      'SELECT a.*, t.empresa_id as ticket_empresa_id FROM ticket_anexos a JOIN tickets t ON a.ticket_id = t.id WHERE a.id = ?',
      [id]
    );
    const data = rows[0];
    if (!data) return null;
    return {
      ...data,
      interno: !!data.interno
    };
  }

  async create(data: {
    ticket_id: number;
    mensagem_id?: number | null;
    usuario_id: number;
    empresa_id: number | null;
    nome_original: string;
    nome_arquivo: string;
    caminho: string;
    mime_type: string;
    tamanho_bytes: number;
    interno: boolean;
  }): Promise<number> {
    const { ticket_id, mensagem_id, usuario_id, empresa_id, nome_original, nome_arquivo, caminho, mime_type, tamanho_bytes, interno } = data;
    
    const [result]: any = await pool.query(
      `INSERT INTO ticket_anexos 
        (ticket_id, mensagem_id, usuario_id, empresa_id, nome_original, nome_arquivo, caminho, mime_type, tamanho_bytes, interno) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ticket_id, mensagem_id || null, usuario_id, empresa_id, nome_original, nome_arquivo, caminho, mime_type, tamanho_bytes, interno ? 1 : 0]
    );
    
    return result.insertId;
  }

  async delete(id: number): Promise<boolean> {
    const attachment = await this.getById(id);
    if (!attachment) return false;

    // Remove from DB
    await pool.query('DELETE FROM ticket_anexos WHERE id = ?', [id]);

    // Remove file from disk
    try {
      await fs.unlink(attachment.caminho);
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        console.error(`Error deleting file: ${attachment.caminho}`, err);
      }
    }

    return true;
  }

  async getByMessage(messageId: number, includeInternal: boolean): Promise<AttachmentData[]> {
    let query = 'SELECT * FROM ticket_anexos WHERE mensagem_id = ?';
    if (!includeInternal) {
      query += ' AND interno = 0';
    }

    const [rows]: any = await pool.query(query, [messageId]);
    return (rows as AttachmentData[]).map(row => ({
      ...row,
      interno: !!row.interno,
      url: `/api/attachments/${row.id}/download`
    }));
  }

  async deleteMultiple(files: Express.Multer.File[]): Promise<void> {
    await Promise.all(files.map(file => fs.unlink(file.path).catch(() => {})));
  }
}

export default new AttachmentsService();
