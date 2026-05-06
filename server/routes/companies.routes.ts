import { Router } from 'express';
import companiesService from '../services/companies.service';
import { authMiddleware } from '../middlewares/auth';
import { isDev } from '../middlewares/permissions';
import { sendSuccess, sendError } from '../utils/response';
import { logSystemAction } from '../utils/logger';

const router = Router();

router.use(authMiddleware);
router.use(isDev);

router.get('/', async (req, res) => {
  try {
    const companies = await companiesService.list();
    sendSuccess(res, companies);
  } catch (error: any) {
    sendError(res, error.message);
  }
});

router.post('/', async (req: any, res) => {
  try {
    if (!req.body.nome) return sendError(res, 'Nome é obrigatório', 400);
    const id = await companiesService.create(req.body);
    await logSystemAction(req, req.user.id, null, 'COMPANY_CREATE', `Criou empresa: ${req.body.nome}`);
    sendSuccess(res, { id }, 'Empresa criada com sucesso', 201);
  } catch (error: any) {
    sendError(res, error.message);
  }
});

router.patch('/:id', async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    await companiesService.update(id, req.body);
    await logSystemAction(req, req.user.id, null, 'COMPANY_UPDATE', `Atualizou empresa ID: ${id}`);
    sendSuccess(res, null, 'Empresa atualizada com sucesso');
  } catch (error: any) {
    sendError(res, error.message);
  }
});

export default router;
