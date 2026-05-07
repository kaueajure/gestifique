import { Router } from 'express';
import logsService from '../services/logs.service.js';
import { authMiddleware } from '../middlewares/auth.js';
import { isAdmin } from '../middlewares/permissions.js';
import { sendSuccess, sendError } from '../utils/response.js';
const router = Router();
router.use(authMiddleware);
router.use(isAdmin);
router.get('/', async (req, res) => {
    try {
        const filters = {
            ...req.query,
            empresa_id: req.user.empresa_id,
            is_dev: req.user.desenvolvedor
        };
        const logs = await logsService.list(filters);
        sendSuccess(res, logs);
    }
    catch (error) {
        sendError(res, error.message);
    }
});
export default router;
