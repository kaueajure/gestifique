import { Router } from 'express';
import reportsService from '../services/reports.service';
import { authMiddleware } from '../middlewares/auth';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: any, res) => {
  try {
    const stats = await reportsService.getDashboardStats(req.user);
    sendSuccess(res, stats);
  } catch (error: any) {
    sendError(res, error.message);
  }
});

export default router;
