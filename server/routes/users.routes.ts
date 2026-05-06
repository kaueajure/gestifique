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
    const empresaId = req.user.desenvolvedor ? undefined : req.user.empresa_id;
    const users = await usersService.list(empresaId);
    sendSuccess(res, users);
  } catch (error: any) {
    sendError(res, error.message);
  }
});

router.post('/', isAdmin, async (req: any, res) => {
  try {
    const { nome, email, senha, is_admin, is_dev, empresa_id_target, cargo } = req.body;
    
    if (!nome || !email || !senha) return sendError(res, 'Nome, email e senha são obrigatórios', 400);
    if (!isValidEmail(email)) return sendError(res, 'Email inválido', 400);
    if (!isValidPassword(senha)) return sendError(res, 'Senha deve ter ao menos 6 caracteres', 400);

    const empresa_id = req.user.desenvolvedor ? empresa_id_target : req.user.empresa_id;
    
    // Security: non-dev cannot create dev
    const buildData = {
      nome, email, senha, cargo,
      empresa_id,
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
        
        // Security check
        if (!req.user.desenvolvedor && targetUser.empresa_id !== req.user.empresa_id) {
            return sendError(res, 'Acesso proibido', 403);
        }

        // Prevent non-dev from editing dev
        if (!req.user.desenvolvedor && targetUser.desenvolvedor) {
             return sendError(res, 'Você não tem permissão para editar um desenvolvedor', 403);
        }

        await usersService.update(id, req.body);
        await logSystemAction(req, req.user.id, req.user.empresa_id, 'USER_UPDATE', `Atualizou usuário ID ${id}`);
        
        sendSuccess(res, null, 'Usuário atualizado com sucesso');
    } catch (error: any) {
        sendError(res, error.message);
    }
});

export default router;
