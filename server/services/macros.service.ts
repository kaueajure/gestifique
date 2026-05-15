import pool from '../db/connection.js';

class MacrosService {
  async list(empresaId: number, onlyActive = true) {
    let query = 'SELECT * FROM ticket_macros WHERE empresa_id = ?';
    if (onlyActive) query += ' AND ativo = 1';
    query += ' ORDER BY titulo ASC';
    
    const [rows]: any = await pool.query(query, [empresaId]);
    return rows.map((r: any) => ({
      ...r,
      ativo: Number(r.ativo) === 1
    }));
  }

  async getById(id: number, empresaId: number) {
    const [rows]: any = await pool.query(
      'SELECT * FROM ticket_macros WHERE id = ? AND empresa_id = ?',
      [id, empresaId]
    );
    if (!rows[0]) return null;
    return {
      ...rows[0],
      ativo: Number(rows[0].ativo) === 1
    };
  }

  async create(data: any) {
    const { empresa_id, titulo, conteudo, categoria, servico, tags_json, created_by } = data;
    const [result]: any = await pool.query(
      'INSERT INTO ticket_macros (empresa_id, titulo, conteudo, categoria, servico, tags_json, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [empresa_id, titulo, conteudo, categoria || null, servico || null, tags_json ? JSON.stringify(tags_json) : null, created_by]
    );
    return result.insertId;
  }

  async update(id: number, empresaId: number, data: any) {
    const fields: string[] = [];
    const params: any[] = [];

    if (data.titulo !== undefined) {
      fields.push('titulo = ?');
      params.push(data.titulo);
    }
    if (data.conteudo !== undefined) {
      fields.push('conteudo = ?');
      params.push(data.conteudo);
    }
    if (data.categoria !== undefined) {
      fields.push('categoria = ?');
      params.push(data.categoria || null);
    }
    if (data.servico !== undefined) {
      fields.push('servico = ?');
      params.push(data.servico || null);
    }
    if (data.tags_json !== undefined) {
      fields.push('tags_json = ?');
      params.push(JSON.stringify(data.tags_json || []));
    }
    if (data.ativo !== undefined) {
      fields.push('ativo = ?');
      params.push(data.ativo ? 1 : 0);
    }

    if (fields.length === 0) return true;

    params.push(id, empresaId);
    await pool.query(
      `UPDATE ticket_macros SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND empresa_id = ?`,
      params
    );
    return true;
  }

  async incrementUse(id: number, empresaId: number) {
    await pool.query('UPDATE ticket_macros SET uso_count = COALESCE(uso_count, 0) + 1 WHERE id = ? AND empresa_id = ?', [id, empresaId]);
  }

  async delete(id: number, empresaId: number, softDelete = true) {
    if (softDelete) {
      await pool.query(
        'UPDATE ticket_macros SET ativo = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND empresa_id = ?',
        [id, empresaId]
      );
    } else {
      await pool.query(
        'DELETE FROM ticket_macros WHERE id = ? AND empresa_id = ?',
        [id, empresaId]
      );
    }
    return true;
  }
}

export default new MacrosService();
