import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
import { hasPermission } from '../utils/permissions.js';

export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    
    if (hasPermission(req.user, permission)) {
      return next();
    }
    
    return res.status(403).json({ error: 'Acesso negado: permissão requerida' });
  };
};
