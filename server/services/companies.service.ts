import pool from '../db/connection';

class CompaniesService {
  async list(filters: { search?: string; status?: string } = {}) {
    let query = `
      SELECT e.*, 
             (SELECT COUNT(*) FROM usuarios u WHERE u.empresa_id = e.id) as total_usuarios,
             (SELECT COUNT(*) FROM tickets t WHERE t.empresa_id = e.id) as total_tickets
      FROM empresas e
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.search) {
      query += ' AND (e.nome LIKE ? OR e.cnpj LIKE ? OR e.email LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.status === 'ativo') {
      query += ' AND e.ativo = 1';
    } else if (filters.status === 'inativo') {
      query += ' AND e.ativo = 0';
    }

    query += ' ORDER BY e.nome ASC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  async getById(id: number) {
    const [rows]: any = await pool.query('SELECT * FROM empresas WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async create(data: any) {
    const { nome, cnpj, email, telefone } = data;
    const [result]: any = await pool.query(
      'INSERT INTO empresas (nome, cnpj, email, telefone) VALUES (?, ?, ?, ?)',
      [nome, cnpj, email, telefone]
    );
    return result.insertId;
  }

  async update(id: number, data: any) {
    const fields: string[] = [];
    const params: any[] = [];
    Object.keys(data).forEach(key => {
      if (['nome', 'cnpj', 'email', 'telefone', 'ativo', 'cor_principal', 'logo'].includes(key)) {
        fields.push(`${key} = ?`);
        params.push(data[key]);
      }
    });
    if (fields.length === 0) return;
    params.push(id);
    await pool.query(`UPDATE empresas SET ${fields.join(', ')} WHERE id = ?`, params);
  }
}

export default new CompaniesService();
