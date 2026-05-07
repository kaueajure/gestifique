import { Router } from 'express';
import reportsService from '../services/reports.service.js';
import { authMiddleware } from '../middlewares/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';
const router = Router();
router.use(authMiddleware);
router.get('/', async (req, res) => {
    try {
        const stats = await reportsService.getDashboardStats(req.user);
        sendSuccess(res, stats);
    }
    catch (error) {
        sendError(res, error.message);
    }
});
export default router;
