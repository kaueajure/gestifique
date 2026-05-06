import { Router } from 'express';
import usersService from '../services/users.service';
import { authMiddleware } from '../middlewares/auth';
import { isAdmin, isDev } from '../middlewares/permissions';
import { sendSuccess, sendError } from '../utils/response';
import { logSystemAction } from '../utils/logger';
import { isValidEmail, isValidPassword } from '../utils/validators';

const router = Router();

router.use(authMiddleware);

router.get('/', isAdmin, async (req: any, res) => {
  try {
    const { search, status, permission } = req.query;
    const empresaId = req.user.desenvolvedor ? undefined : req.user.empresa_id;
    const users = await usersService.list({ 
      empresaId, 
      search: search as string, 
      status: status as string, 
      permission: permission as string 
    });
    sendSuccess(res, users);
  } catch (error: any) {
    sendError(res, error.message);
  }
});

router.post('/', isAdmin, async (req: any, res) => {
  try {
    const { nome, email, password, is_admin, is_dev, empresa_id, cargo, telefone } = req.body;
    
    if (!nome || !email || !password) return sendError(res, 'Nome, email e senha são obrigatórios', 400);
    if (!isValidEmail(email)) return sendError(res, 'Email inválido', 400);
    if (!isValidPassword(password)) return sendError(res, 'Senha deve ter ao menos 6 caracteres', 400);

    const targetEmpresaId = req.user.desenvolvedor ? empresa_id : req.user.empresa_id;
    
    if (!req.user.desenvolvedor && is_dev) {
      return sendError(res, 'Apenas desenvolvedores podem criar outros desenvolvedores', 403);
    }

    const buildData = {
      nome, email, password, cargo, telefone,
      empresa_id: targetEmpresaId,
      administrador: is_admin,
      desenvolvedor: req.user.desenvolvedor ? is_dev : false
    };

    const newUser = await usersService.create(buildData);
    await logSystemAction(req, req.user.id, req.user.empresa_id, 'USER_CREATE', `Criou novo usuário: ${email}`);
    
    sendSuccess(res, newUser, 'Usuário criado com sucesso', 201);
  } catch (error: any) {
    sendError(res, error.message);
  }
});

router.patch('/:id', isAdmin, async (req: any, res) => {
    try {
        const id = parseInt(req.params.id);
        const targetUser = await usersService.getById(id);
        
        if (!targetUser) return sendError(res, 'Usuário não encontrado', 404);
        
        // Security checks
        if (!req.user.desenvolvedor) {
            if (targetUser.empresa_id !== req.user.empresa_id) {
                return sendError(res, 'Acesso proibido', 403);
            }
            if (targetUser.desenvolvedor) {
                return sendError(res, 'Você não tem permissão para editar um desenvolvedor', 403);
            }
            // Admin cannot change empresa_id
            delete req.body.empresa_id;
            // Admin cannot promote to dev
            delete req.body.desenvolvedor;
        }

        await usersService.update(id, req.body);
        await logSystemAction(req, req.user.id, req.user.empresa_id, 'USER_UPDATE', `Atualizou usuário ID ${id}`);
        
        sendSuccess(res, null, 'Usuário atualizado com sucesso');
    } catch (error: any) {
        sendError(res, error.message);
    }
});

router.patch('/:id/status', isAdmin, async (req: any, res) => {
    try {
        const id = parseInt(req.params.id);
        const { ativo } = req.body;
        const targetUser = await usersService.getById(id);
        
        if (!targetUser) return sendError(res, 'Usuário não encontrado', 404);
        
        if (!req.user.desenvolvedor && (targetUser.empresa_id !== req.user.empresa_id || targetUser.desenvolvedor)) {
            return sendError(res, 'Acesso proibido', 403);
        }

        await usersService.update(id, { ativo });
        await logSystemAction(req, req.user.id, req.user.empresa_id, 'USER_STATUS', `${ativo ? 'Ativou' : 'Desativou'} usuário ID ${id}`);
        
        sendSuccess(res, null, `Usuário ${ativo ? 'ativado' : 'desativado'} com sucesso`);
    } catch (error: any) {
        sendError(res, error.message);
    }
});

router.patch('/:id/password', isAdmin, async (req: any, res) => {
    try {
        const id = parseInt(req.params.id);
        const { password } = req.body;
        
        if (!password || !isValidPassword(password)) return sendError(res, 'Senha inválida', 400);

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
