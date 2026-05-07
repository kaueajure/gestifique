import { Router } from 'express';
import companiesService from '../services/companies.service.js';
import { authMiddleware } from '../middlewares/auth.js';
import { isDev } from '../middlewares/permissions.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logSystemAction } from '../utils/logger.js';
const router = Router();
router.use(authMiddleware);
router.use(isDev);
router.get('/', async (req, res) => {
    try {
        const { search, status } = req.query;
        const companies = await companiesService.list({
            search: search,
            status: status
        });
        sendSuccess(res, companies);
    }
    catch (error) {
        sendError(res, error.message);
    }
});
router.post('/', async (req, res) => {
    try {
        if (!req.body.nome)
            return sendError(res, 'Nome é obrigatório', 400);
        const id = await companiesService.create(req.body);
        await logSystemAction(req, req.user.id, null, 'COMPANY_CREATE', `Criou empresa: ${req.body.nome}`);
        sendSuccess(res, { id }, 'Empresa criada com sucesso', 201);
    }
    catch (error) {
        sendError(res, error.message);
    }
});
router.patch('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await companiesService.update(id, req.body);
        await logSystemAction(req, req.user.id, null, 'COMPANY_UPDATE', `Atualizou empresa ID: ${id}`);
        sendSuccess(res, null, 'Empresa atualizada com sucesso');
    }
    catch (error) {
        sendError(res, error.message);
    }
});
router.patch('/:id/status', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { ativo } = req.body;
        await companiesService.update(id, { ativo });
        await logSystemAction(req, req.user.id, null, 'COMPANY_STATUS', `${ativo ? 'Ativou' : 'Desativou'} empresa ID ${id}`);
        sendSuccess(res, null, `Empresa ${ativo ? 'ativada' : 'desativada'} com sucesso`);
    }
    catch (error) {
        sendError(res, error.message);
    }
});
export default router;
