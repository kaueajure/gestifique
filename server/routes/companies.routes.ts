import { Router } from 'express';
import  companiesService from  '../services/companies.service.js';
import  { authMiddleware, AuthRequest } from  '../middlewares/auth.js';
import { isDev, isAdmin } from  '../middlewares/permissions.js';
import  { sendSuccess, sendError } from  '../utils/response.js';
import  { logSystemAction } from  '../utils/logger.js';

const router = Router();

router.use(authMiddleware);

// Listar e Criar empresas apenas para Devs
router.get('/', isDev, async (req: AuthRequest, res) => {
  try {
    const { search, status } = req.query;
    const companies = await companiesService.list({ 
      search: search as string, 
      status: status as string 
    });
    sendSuccess(res, companies);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao listar empresas';
    sendError(res, message);
  }
});

router.post('/', isDev, async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user!;
    if (!req.body.nome) return sendError(res, 'Nome é obrigatório', 400);
    const id = await companiesService.create(req.body);
    await logSystemAction(req, currentUser.id, null, 'COMPANY_CREATE', `Criou empresa: ${req.body.nome}`);
    sendSuccess(res, { id }, 'Empresa criada com sucesso', 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao criar empresa';
    sendError(res, message);
  }
});

// Update company: Devs can update any, Admins only their own
router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const currentUser = req.user!;
    
    if (!currentUser.desenvolvedor) {
      if (!currentUser.administrador || currentUser.empresa_id !== id) {
        return sendError(res, 'Acesso negado', 403);
      }
    }

    await companiesService.update(id, req.body);
    await logSystemAction(req, currentUser.id, id, 'COMPANY_UPDATE', `Atualizou informações da empresa ID: ${id}`);
    sendSuccess(res, null, 'Empresa atualizada com sucesso');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar empresa';
    sendError(res, message);
  }
});

router.patch('/:id/status', isDev, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const { ativo } = req.body;
    const currentUser = req.user!;
    await companiesService.update(id, { ativo });
    await logSystemAction(req, currentUser.id, null, 'COMPANY_STATUS', `${ativo ? 'Ativou' : 'Desativou'} empresa ID ${id}`);
    sendSuccess(res, null, `Empresa ${ativo ? 'ativada' : 'desativada'} com sucesso`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao alterar status da empresa';
    sendError(res, message);
  }
});

export default router;
