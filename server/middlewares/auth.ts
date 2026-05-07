import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import  { env } from  '../config/env.js';

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

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Não autorizado' });
  }

  try {
    const decoded = jwt.verify(token, SECRET) as UserPayload;
    
    // Payload validation
    if (!decoded || typeof decoded !== 'object' || !decoded.id || !decoded.email) {
      return res.status(401).json({ success: false, message: 'Sessão inválida. Faça login novamente.' });
    }

    // Check if user is active
    if (decoded.ativo === false) {
      return res.status(403).json({ success: false, message: 'Sua conta está inativada' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Sessão inválida ou expirada' });
  }
};
