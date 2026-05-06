import pool from '../db/connection';

class TicketsService {
  async list(filters: any) {
    const { empresa_id, usuario_id, is_dev, is_admin, status, prioridade, busca, page = 1, limit = 20 } = filters;
    
    let query = `
      SELECT t.*, u.nome as cliente_nome, r.nome as responsavel_nome, e.nome as empresa_nome
      FROM tickets t
      JOIN usuarios u ON t.usuario_id = u.id
      JOIN empresas e ON t.empresa_id = e.id
      LEFT JOIN usuarios r ON t.responsavel_id = r.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // ACL
    if (!is_dev) {
      if (is_admin) {
        query += ' AND t.empresa_id = ?';
        params.push(empresa_id);
      } else {
        query += ' AND t.usuario_id = ?';
        params.push(usuario_id);
      }
    }

    // Filters
    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }
    if (prioridade) {
      query += ' AND t.prioridade = ?';
      params.push(prioridade);
    }
    if (busca) {
      query += ' AND (t.titulo LIKE ? OR t.descricao LIKE ? OR t.id = ?)';
      params.push(`%${busca}%`, `%${busca}%`, busca);
    }

    query += ' ORDER BY t.created_at DESC';
    
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit.toString()), offset);

    const [rows] = await pool.query(query, params);
    return rows;
  }

  async create(data: any) {
    const { empresa_id, usuario_id, titulo, descricao, prioridade, categoria } = data;
    const [result]: any = await pool.query(
      'INSERT INTO tickets (empresa_id, usuario_id, titulo, descricao, prioridade, categoria) VALUES (?, ?, ?, ?, ?, ?)',
      [empresa_id, usuario_id, titulo, descricao, prioridade || 'media', categoria || 'suporte']
    );
    return result.insertId;
  }

  async getById(id: number) {
    const [rows]: any = await pool.query(
      `SELECT t.*, u.nome as cliente_nome, r.nome as responsavel_nome 
       FROM tickets t 
       JOIN usuarios u ON t.usuario_id = u.id 
       LEFT JOIN usuarios r ON t.responsavel_id = r.id 
       WHERE t.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async update(id: number, data: any) {
    const fields: string[] = [];
    const params: any[] = [];

    if (data.status === 'resolvido' || data.status === 'fechado') {
      fields.push('finalizado_em = NOW()');
    }

    Object.keys(data).forEach(key => {
      if (['titulo', 'descricao', 'status', 'prioridade', 'responsavel_id', 'categoria'].includes(key)) {
        fields.push(`${key} = ?`);
        params.push(data[key]);
      }
    });

    if (fields.length === 0) return;

    params.push(id);
    await pool.query(`UPDATE tickets SET ${fields.join(', ')} WHERE id = ?`, params);
  }

  async getMessages(ticketId: number, includeInternal: boolean) {
    let query = `
      SELECT m.*, u.nome as usuario_nome 
      FROM ticket_mensagens m
      JOIN usuarios u ON m.usuario_id = u.id
      WHERE m.ticket_id = ?
    `;
    if (!includeInternal) query += ' AND m.interno = 0';
    query += ' ORDER BY m.created_at ASC';
    
    const [rows] = await pool.query(query, [ticketId]);
    return rows;
  }

  async addMessage(data: any) {
    const { ticket_id, usuario_id, mensagem, interno } = data;
    await pool.query(
      'INSERT INTO ticket_mensagens (ticket_id, usuario_id, mensagem, interno) VALUES (?, ?, ?, ?)',
      [ticket_id, usuario_id, mensagem, interno ? 1 : 0]
    );
    await pool.query('UPDATE tickets SET updated_at = NOW() WHERE id = ?', [ticket_id]);
  }
}

export default new TicketsService();
