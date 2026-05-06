import pool from '../db/connection';
import bcrypt from 'bcryptjs';

class UsersService {
  async list(empresaId?: number) {
    let query = `
      SELECT u.id, u.nome, u.email, u.cargo, u.administrador, u.desenvolvedor, u.ativo, u.created_at, e.nome as empresa_nome 
      FROM usuarios u
      LEFT JOIN empresas e ON u.empresa_id = e.id
    `;
    const params = [];

    if (empresaId) {
      query += ' WHERE u.empresa_id = ?';
      params.push(empresaId);
    }

    const [rows] = await pool.query(query, params);
    return rows;
  }

  async getById(id: number) {
    const [rows]: any = await pool.query('SELECT * FROM usuarios WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    const { senha_hash, ...user } = rows[0];
    return user;
  }

  async create(data: any) {
    const { nome, email, senha, empresa_id, cargo, administrador, desenvolvedor } = data;
    const hash = await bcrypt.hash(senha, 10);
    
    const [result]: any = await pool.query(
      'INSERT INTO usuarios (nome, email, senha_hash, empresa_id, cargo, administrador, desenvolvedor) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nome, email, hash, empresa_id, cargo, administrador ? 1 : 0, desenvolvedor ? 1 : 0]
    );
    
    return { id: result.insertId, nome, email };
  }

  async update(id: number, data: any) {
    const fields: string[] = [];
    const params: any[] = [];

    Object.keys(data).forEach(key => {
      if (['nome', 'email', 'cargo', 'administrador', 'desenvolvedor', 'ativo', 'telefone', 'foto'].includes(key)) {
        fields.push(`${key} = ?`);
        params.push(data[key]);
      }
    });

    if (data.senha) {
      fields.push('senha_hash = ?');
      params.push(await bcrypt.hash(data.senha, 10));
    }

    if (fields.length === 0) return;

    params.push(id);
    await pool.query(`UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`, params);
  }
}

export default new UsersService();
