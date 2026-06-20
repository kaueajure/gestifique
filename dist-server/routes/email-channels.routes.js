import { Router } from 'express';
import { emailChannelsService } from '../services/email-channels.service.js';
import { authMiddleware } from '../middlewares/auth.js';
import { sendError, sendSuccess } from '../utils/response.js';
import { isValidEmail } from '../utils/validators.js';
const router = Router();
router.use(authMiddleware);
// Dev can manage any company; admins can manage only their own company.
const canManage = (req, targetEmpresaId) => {
    return req.user.desenvolvedor || (req.user.administrador && req.user.empresa_id === targetEmpresaId);
};
router.get('/companies/:companyId/email-channels', async (req, res) => {
    try {
        const companyId = parseInt(req.params.companyId, 10);
        if (!canManage(req, companyId)) {
            return sendError(res, 'Permissao negada', 403);
        }
        const canais = await emailChannelsService.listByCompany(companyId);
        return sendSuccess(res, canais);
    }
    catch (err) {
        return sendError(res, err.message, 500);
    }
});
router.post('/companies/:companyId/email-channels', async (req, res) => {
    try {
        const companyId = parseInt(req.params.companyId, 10);
        if (!canManage(req, companyId)) {
            return sendError(res, 'Permissao negada', 403);
        }
        const { email_publico, nome } = req.body;
        if (!email_publico || !isValidEmail(email_publico)) {
            return sendError(res, 'E-mail publico invalido', 400);
        }
        const id = await emailChannelsService.createChannel({
            empresa_id: companyId,
            email_publico,
            nome,
        });
        return sendSuccess(res, { id }, 'Canal criado com sucesso');
    }
    catch (err) {
        return sendError(res, err.message, 500);
    }
});
router.delete('/companies/:companyId/email-channels/:id', async (req, res) => {
    try {
        const companyId = parseInt(req.params.companyId, 10);
        if (!canManage(req, companyId)) {
            return sendError(res, 'Permissao negada', 403);
        }
        const id = parseInt(req.params.id, 10);
        await emailChannelsService.deleteChannel(id, companyId);
        return sendSuccess(res, null, 'Canal deletado com sucesso');
    }
    catch (err) {
        return sendError(res, err.message, 500);
    }
});
router.post('/companies/:companyId/email-channels/:id/regenerate', async (req, res) => {
    try {
        const companyId = parseInt(req.params.companyId, 10);
        if (!canManage(req, companyId)) {
            return sendError(res, 'Permissao negada', 403);
        }
        const id = parseInt(req.params.id, 10);
        await emailChannelsService.regenerate(id, companyId);
        return sendSuccess(res, null, 'Canal regenerado com sucesso');
    }
    catch (err) {
        return sendError(res, err.message, 500);
    }
});
export const emailChannelsRoutes = router;
