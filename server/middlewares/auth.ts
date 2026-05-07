import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import  { env } from  '../config/env.js';

const SECRET = env.JWT_SECRET;

export interface AuthRequest extends Request {
  user?: any;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Não autorizado' });
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Sessão inválida ou expirada' });
  }
};
