import pool from '../db/connection';

class CompaniesService {
  async list() {
    const [rows] = await pool.query('SELECT * FROM empresas ORDER BY nome ASC');
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
