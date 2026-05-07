import  pool from  '../db/connection.js';
import bcrypt from 'bcryptjs';

class UsersService {
  async list(filters: { empresaId?: number; search?: string; status?: string; permission?: string }) {
    let query = `
      SELECT u.id, u.nome, u.email, u.telefone, u.cargo, u.administrador, u.desenvolvedor, 
             u.ativo, u.ultimo_login, u.created_at, u.empresa_id, e.nome as empresa_nome 
      FROM usuarios u
      LEFT JOIN empresas e ON u.empresa_id = e.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.empresaId) {
      query += ' AND u.empresa_id = ?';
      params.push(filters.empresaId);
    }

    if (filters.search) {
      query += ' AND (u.nome LIKE ? OR u.email LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.status === 'ativo') {
      query += ' AND u.ativo = 1';
    } else if (filters.status === 'inativo') {
      query += ' AND u.ativo = 0';
    }

    if (filters.permission === 'desenvolvedor') {
      query += ' AND u.desenvolvedor = 1';
    } else if (filters.permission === 'administrador') {
      query += ' AND u.administrador = 1 AND u.desenvolvedor = 0';
    } else if (filters.permission === 'usuario') {
      query += ' AND u.administrador = 0 AND u.desenvolvedor = 0';
    }

    query += ' ORDER BY u.nome ASC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  async getById(id: number) {
    const [rows]: any = await pool.query(
      `SELECT u.*, e.nome as empresa_nome 
       FROM usuarios u 
       LEFT JOIN empresas e ON u.empresa_id = e.id 
       WHERE u.id = ?`, 
      [id]
    );
    if (rows.length === 0) return null;
    const { senha_hash, ...user } = rows[0];
    return user;
  }

  async create(data: any) {
    const { nome, email, password, empresa_id, cargo, telefone, administrador, desenvolvedor } = data;
    const hash = await bcrypt.hash(password, 10);
    
    const [result]: any = await pool.query(
      'INSERT INTO usuarios (nome, email, senha_hash, empresa_id, cargo, telefone, administrador, desenvolvedor, ativo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)',
      [nome, email, hash, empresa_id, cargo, telefone, administrador ? 1 : 0, desenvolvedor ? 1 : 0]
    );
    
    return { id: result.insertId, nome, email };
  }

  async update(id: number, data: any) {
    const fields: string[] = [];
    const params: any[] = [];

    Object.keys(data).forEach(key => {
      if (['nome', 'email', 'cargo', 'administrador', 'desenvolvedor', 'ativo', 'telefone', 'foto', 'empresa_id'].includes(key)) {
        fields.push(`${key} = ?`);
        params.push(data[key]);
      }
    });

    if (data.password) {
      fields.push('senha_hash = ?');
      params.push(await bcrypt.hash(data.password, 10));
    }

    if (fields.length === 0) return;

    params.push(id);
    await pool.query(`UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`, params);
  }
}

export default new UsersService();
