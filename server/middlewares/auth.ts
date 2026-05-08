import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import  { env } from  '../config/env.js';
import pool from '../db/connection.js';

const SECRET = env.JWT_SECRET;

export interface UserPayload {
  id: number;
  nome: string;
  email: string;
  empresa_id: number | null;
  administrador: boolean;
  desenvolvedor: boolean;
  ativo: boolean;
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token de acesso ausente. Faça login novamente.' });
  }

  try {
    const decoded = jwt.verify(token, SECRET) as UserPayload;
    
    // Payload validation
    if (!decoded || typeof decoded !== 'object' || !decoded.id || !decoded.email) {
      return res.status(401).json({ success: false, message: 'Sessão corrompida. Faça login novamente.' });
    }

    // Strict validation: check database
    const [rows]: any = await pool.query('SELECT ativo FROM usuarios WHERE id = ?', [decoded.id]);
    
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Sua conta não foi encontrada no sistema.' });
    }

    if (Number(rows[0].ativo) !== 1) {
      return res.status(403).json({ success: false, message: 'Sua conta foi desativada pelo administrador.' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Sessão inválida ou expirada' });
  }
};
