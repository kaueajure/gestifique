import  pool from  '../db/connection.js';

class LogsService {
  async list(filters: any) {
    const { 
      empresa_id, 
      user_id, 
      action, 
      start_date, 
      end_date, 
      search, 
      company_id,
      is_dev,
      page = 1,
      limit = 20
    } = filters;

    const offset = (page - 1) * limit;

    let query = `
      SELECT l.*, u.nome as usuario_nome, e.nome as empresa_nome
      FROM logs_sistema l
      LEFT JOIN usuarios u ON l.usuario_id = u.id
      LEFT JOIN empresas e ON l.empresa_id = e.id
      WHERE 1=1
    `;
    let countQuery = `SELECT COUNT(*) as total FROM logs_sistema l WHERE 1=1`;
    const params: any[] = [];
    const countParams: any[] = [];

    if (!is_dev) {
      const filter = ' AND l.empresa_id = ?';
      query += filter;
      countQuery += filter;
      params.push(empresa_id);
      countParams.push(empresa_id);
    } else if (company_id) {
      const filter = ' AND l.empresa_id = ?';
      query += filter;
      countQuery += filter;
      params.push(company_id);
      countParams.push(company_id);
    }

    if (user_id) {
      const filter = ' AND l.usuario_id = ?';
      query += filter;
      countQuery += filter;
      params.push(user_id);
      countParams.push(user_id);
    }

    if (action) {
      const filter = ' AND l.acao = ?';
      query += filter;
      countQuery += filter;
      params.push(action);
      countParams.push(action);
    }

    if (search) {
      const filter = ' AND (l.descricao LIKE ? OR l.acao LIKE ?)';
      query += filter;
      countQuery += filter;
      const searchVal = `%${search}%`;
      params.push(searchVal, searchVal);
      countParams.push(searchVal, searchVal);
    }

    if (start_date) {
      const filter = ' AND l.created_at >= ?';
      query += filter;
      countQuery += filter;
      params.push(start_date);
      countParams.push(start_date);
    }

    if (end_date) {
      const filter = ' AND l.created_at <= ?';
      query += filter;
      countQuery += filter;
      params.push(end_date);
      countParams.push(end_date);
    }

    query += ' ORDER BY l.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const [[{ total }]]: any = await pool.query(countQuery, countParams);
    const [rows]: any = await pool.query(query, params);

    return {
      items: rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

export default new LogsService();
