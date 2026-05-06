import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const isDev = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.desenvolvedor) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Acesso negado: Requer privilégios de desenvolvedor' });
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.administrador || req.user?.desenvolvedor) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Acesso negado: Requer privilégios de administrador' });
};
