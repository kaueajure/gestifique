import { Router } from 'express';
import reportsService from '../services/reports.service';
import { authMiddleware } from '../middlewares/auth';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

router.use(authMiddleware);

router.get('/stats', async (req: any, res) => {
  try {
    const empresaId = req.user.desenvolvedor ? undefined : req.user.empresa_id;
    const stats = await reportsService.getDashboardStats(empresaId);
    sendSuccess(res, stats);
  } catch (error: any) {
    sendError(res, error.message);
  }
});

router.get('/performance', async (req: any, res) => {
  try {
    const empresaId = req.user.desenvolvedor ? undefined : req.user.empresa_id;
    const perf = await reportsService.getPerformance(empresaId);
    sendSuccess(res, perf);
  } catch (error: any) {
    sendError(res, error.message);
  }
});

export default router;
