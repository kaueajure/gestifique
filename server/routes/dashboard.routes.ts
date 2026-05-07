import { Router } from 'express';
import  reportsService from  '../services/reports.service.js';
import  { authMiddleware, AuthRequest } from  '../middlewares/auth.js';
import  { sendSuccess, sendError } from  '../utils/response.js';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);
    
    const stats = await reportsService.getDashboardStats(currentUser);
    sendSuccess(res, stats);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao carregar dashboard';
    sendError(res, message);
  }
});

export default router;
