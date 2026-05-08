import  pool from  '../db/connection.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import  { env } from  '../config/env.js';

const SECRET = env.JWT_SECRET;

class AuthService {
  async login(email: string, password: string) {
    const [rows]: any = await pool.query(
      `SELECT u.*, e.ativo as empresa_ativa 
       FROM usuarios u 
       LEFT JOIN empresas e ON u.empresa_id = e.id 
       WHERE u.email = ?`,
      [email]
    );

    if (rows.length === 0) {
      throw new Error('E-mail ou senha incorretos');
    }

    const user = rows[0];

    const validPassword = await bcrypt.compare(password, user.senha_hash);
    if (!validPassword) {
      throw new Error('E-mail ou senha incorretos');
    }

    if (Number(user.ativo) !== 1) {
      throw new Error('Sua conta foi desativada pelo administrador');
    }

    if (user.empresa_id && !user.empresa_ativa) {
      throw new Error('Acesso bloqueado: Sua empresa está inativa no sistema.');
    }

    await pool.query('UPDATE usuarios SET ultimo_login = NOW() WHERE id = ?', [user.id]);

    const payload = {
      id: user.id,
      empresa_id: user.empresa_id,
      nome: user.nome,
      email: user.email,
      administrador: !!user.administrador,
      desenvolvedor: !!user.desenvolvedor,
      ativo: !!user.ativo
    };

    const token = jwt.sign(payload, SECRET, { expiresIn: '1d' });
    
    const { senha_hash, ...uPublic } = user;
    return { token, user: uPublic };
  }
}

export default new AuthService();
