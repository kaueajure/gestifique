import { Router } from 'express';
import pool from '../db/connection.js';
import { AuthRequest } from '../middlewares/auth.js';

const router = Router();

const sendSuccess = (res: any, data: any) => res.json({ success: true, data });
const sendError = (res: any, error: string, num = 500) => res.status(num).json({ success: false, error });

router.get('/company/:companyId', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);
    const companyId = parseInt(req.params.companyId);
    if (!currentUser.desenvolvedor && currentUser.empresa_id !== companyId) return sendError(res, 'Acesso negado', 403);
    
    const [rows] = await pool.query('SELECT * FROM ticket_automacoes WHERE empresa_id = ? ORDER BY ordem ASC', [companyId]);
    sendSuccess(res, rows);
  } catch (error: unknown) {
    sendError(res, 'Erro ao buscar automações');
  }
});

export default router;
