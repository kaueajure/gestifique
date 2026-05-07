import { Router } from 'express';
import reportsService from '../services/reports.service.js';
import { authMiddleware, AuthRequest } from '../middlewares/auth.js';
import { isAdmin } from '../middlewares/permissions.js';
import { sendSuccess, sendError } from '../utils/response.js';

const router = Router();

router.use(authMiddleware);
router.use(isAdmin); // At least Admin required

router.get('/summary', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);

    const { start_date, end_date, empresa_id, responsavel_id, status, prioridade } = req.query;

    const filters: any = {
      start_date,
      end_date,
      responsavel_id: responsavel_id ? parseInt(responsavel_id as string) : undefined,
      status,
      prioridade
    };

    // Permission check for empresa_id
    if (!currentUser.desenvolvedor) {
      filters.empresa_id = currentUser.empresa_id;
    } else if (empresa_id) {
      filters.empresa_id = parseInt(empresa_id as string);
    }

    const summary = await reportsService.getSummary(filters);
    sendSuccess(res, summary);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao gerar relatório';
    sendError(res, message);
  }
});

export default router;
