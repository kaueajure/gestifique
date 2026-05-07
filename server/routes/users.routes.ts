import { Router } from 'express';
import  usersService from  '../services/users.service.js';
import  { authMiddleware, AuthRequest } from  '../middlewares/auth.js';
import  { isAdmin, isDev } from  '../middlewares/permissions.js';
import  { sendSuccess, sendError } from  '../utils/response.js';
import  { logSystemAction } from  '../utils/logger.js';
import  { isValidEmail } from  '../utils/validators.js';

const router = Router();

router.use(authMiddleware);

router.get('/', isAdmin, async (req: AuthRequest, res) => {
  try {
    const { search, status, permission } = req.query;
    const empresaId = req.user?.desenvolvedor ? undefined : req.user?.empresa_id;
    const users = await usersService.list({ 
      empresaId, 
      search: search as string, 
      status: status as string, 
      permission: permission as string 
    });
    sendSuccess(res, users);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao listar usuários';
    sendError(res, message);
  }
});

router.post('/', isAdmin, async (req: AuthRequest, res) => {
  try {
    const { nome, email, password, administrador, desenvolvedor, empresa_id, cargo, telefone } = req.body;
    
    if (!nome || !email || !password) return sendError(res, 'Nome, email e senha são obrigatórios', 400);
    if (!isValidEmail(email)) return sendError(res, 'Email inválido', 400);
    if (password.length < 8) return sendError(res, 'A senha deve ter pelo menos 8 caracteres', 400);

    const currentUser = req.user!;
    const targetEmpresaId = currentUser.desenvolvedor ? empresa_id : currentUser.empresa_id;
    
    if (!currentUser.desenvolvedor && desenvolvedor) {
      return sendError(res, 'Apenas desenvolvedores podem criar outros desenvolvedores', 403);
    }

    const buildData = {
      nome, email, password, cargo, telefone,
      empresa_id: targetEmpresaId,
      administrador: administrador === true,
      desenvolvedor: currentUser.desenvolvedor ? (desenvolvedor === true) : false
    };

    const newUser = await usersService.create(buildData);
    await logSystemAction(req, currentUser.id, currentUser.empresa_id, 'USER_CREATE', `Criou novo usuário: ${email}`);
    
    sendSuccess(res, newUser, 'Usuário criado com sucesso', 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao criar usuário';
    sendError(res, message);
  }
});

router.patch('/:id', isAdmin, async (req: AuthRequest, res) => {
    try {
        const id = parseInt(req.params.id);
        const currentUser = req.user!;
        const targetUser = await usersService.getById(id);
        
        if (!targetUser) return sendError(res, 'Usuário não encontrado', 404);
        
        // Security checks
        if (!currentUser.desenvolvedor) {
            if (targetUser.empresa_id !== currentUser.empresa_id) {
                return sendError(res, 'Acesso proibido', 403);
            }
            if (targetUser.desenvolvedor) {
                return sendError(res, 'Você não tem permissão para editar um desenvolvedor', 403);
            }
            // Admin cannot change empresa_id, administrador (to dev level) or desenvolvedor
            delete req.body.empresa_id;
            delete req.body.desenvolvedor;
        }

        // Validate email if present
        if (req.body.email && req.body.email !== targetUser.email) {
            if (!isValidEmail(req.body.email)) {
                return sendError(res, 'Email inválido', 400);
            }
        }

        await usersService.update(id, req.body);
        await logSystemAction(req, currentUser.id, currentUser.empresa_id, 'USER_UPDATE', `Atualizou usuário ID ${id}`);
        
        sendSuccess(res, null, 'Usuário atualizado com sucesso');
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erro ao atualizar usuário';
        sendError(res, message);
    }
});

router.patch('/:id/status', isAdmin, async (req: AuthRequest, res) => {
    try {
        const id = parseInt(req.params.id);
        const { ativo } = req.body;
        const currentUser = req.user!;
        const targetUser = await usersService.getById(id);
        
        if (!targetUser) return sendError(res, 'Usuário não encontrado', 404);
        
        if (!currentUser.desenvolvedor && (targetUser.empresa_id !== currentUser.empresa_id || targetUser.desenvolvedor)) {
            return sendError(res, 'Acesso proibido', 403);
        }

        await usersService.update(id, { ativo });
        await logSystemAction(req, currentUser.id, currentUser.empresa_id, 'USER_STATUS', `${ativo ? 'Ativou' : 'Desativou'} usuário ID ${id}`);
        
        sendSuccess(res, null, `Usuário ${ativo ? 'ativado' : 'desativado'} com sucesso`);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erro ao alterar status';
        sendError(res, message);
    }
});

router.patch('/:id/password', isAdmin, async (req: any, res) => {
    try {
        const id = parseInt(req.params.id);
        const { password } = req.body;
        
        if (!password || password.length < 8) return sendError(res, 'A senha deve ter pelo menos 8 caracteres', 400);

        const targetUser = await usersService.getById(id);
        if (!targetUser) return sendError(res, 'Usuário não encontrado', 404);
        
        if (!req.user.desenvolvedor && (targetUser.empresa_id !== req.user.empresa_id || targetUser.desenvolvedor)) {
            return sendError(res, 'Acesso proibido', 403);
        }

        await usersService.update(id, { password });
        await logSystemAction(req, req.user.id, req.user.empresa_id, 'USER_PASSWORD', `Alterou senha do usuário ID ${id}`);
        
        sendSuccess(res, null, 'Senha alterada com sucesso');
    } catch (error: any) {
        sendError(res, error.message);
    }
});

export default router;
