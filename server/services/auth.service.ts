import pool from '../db/connection';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

const SECRET = env.JWT_SECRET;

class AuthService {
  async login(email: string, password: string) {
    const [rows]: any = await pool.query(
      `SELECT u.*, e.ativo as empresa_ativa 
       FROM usuarios u 
       LEFT JOIN empresas e ON u.empresa_id = e.id 
       WHERE u.email = ? AND u.ativo = 1`,
      [email]
    );

    if (rows.length === 0) {
      throw new Error('Usuário não encontrado ou inativo');
    }

    const user = rows[0];

    if (user.empresa_id && !user.empresa_ativa) {
      throw new Error('Sua empresa está desativada. Entre em contato com o suporte.');
    }

    const validPassword = await bcrypt.compare(password, user.senha_hash);
    if (!validPassword) {
      throw new Error('Senha incorreta');
    }

    await pool.query('UPDATE usuarios SET ultimo_login = NOW() WHERE id = ?', [user.id]);

    const payload = {
      id: user.id,
      empresa_id: user.id === 1 ? null : user.empresa_id, // System dev id 1 bypass
      nome: user.nome,
      email: user.email,
      administrador: !!user.administrador,
      desenvolvedor: !!user.desenvolvedor
    };

    const token = jwt.sign(payload, SECRET, { expiresIn: '1d' });
    
    const { senha_hash, ...uPublic } = user;
    return { token, user: uPublic };
  }
}

export default new AuthService();
