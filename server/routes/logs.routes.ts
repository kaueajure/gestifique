import { Router } from 'express';
import logsService from '../services/logs.service';
import { authMiddleware } from '../middlewares/auth';
import { isAdmin } from '../middlewares/permissions';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

router.use(authMiddleware);
router.use(isAdmin);

router.get('/', async (req: any, res) => {
  try {
    const filters = {
      ...req.query,
      empresa_id: req.user.empresa_id,
      is_dev: req.user.desenvolvedor
    };
    const logs = await logsService.list(filters);
    sendSuccess(res, logs);
  } catch (error: any) {
    sendError(res, error.message);
  }
});

export default router;
