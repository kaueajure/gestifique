import { Router } from 'express';
import  usersService from  '../services/users.service.js';
import  { authMiddleware, AuthRequest } from  '../middlewares/auth.js';
import  { isAdmin, isDev } from  '../middlewares/permissions.js';
import  { sendSuccess, sendError } from  '../utils/response.js';
import  { logSystemAction } from  '../utils/logger.js';
import  { isValidEmail } from  '../utils/validators.js';
import pool from '../db/connection.js';
import { permissionsService } from '../services/permissions.service.js';

const router = Router();

router.use(authMiddleware);

router.get('/team', async (req: AuthRequest, res) => {
    try {
        const currentUser = req.user;
        if (!currentUser) return sendError(res, 'Não autenticado', 401);

        if (!currentUser.empresa_id && !currentUser.desenvolvedor) {
            return sendSuccess(res, []);
        }

        const empresaId = currentUser.empresa_id; // Devs also will have empresa_id filtering if we want, or just get from own current context
        let query = `
          SELECT u.id, u.nome, u.email, u.cargo,
                 (SELECT COUNT(id) FROM tickets t WHERE t.responsavel_id = u.id AND t.status NOT IN ('resolvido', 'fechado')) as ticket_count
          FROM usuarios u
          WHERE u.ativo = 1 AND u.empresa_id = ?
          ORDER BY u.nome ASC
        `;
        const params: any[] = [empresaId];

        // Dev without company gets empty list or we can pass ?empresa_id= query param
        if (currentUser.desenvolvedor && !empresaId && !req.query.empresa_id) {
            return sendSuccess(res, []);
        }

        if (currentUser.desenvolvedor && req.query.empresa_id) {
           params[0] = req.query.empresa_id;
        }

        const [rows] = await pool.query(query, params);
        sendSuccess(res, rows);
    } catch (e: any) {
        sendError(res, e.message);
    }
});

router.get('/', isAdmin, async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);

    const { search, status } = req.query;
    const empresaId = currentUser.desenvolvedor ? undefined : currentUser.empresa_id;
    
    if (!currentUser.desenvolvedor && !empresaId) {
      return sendSuccess(res, []);
    }

    const users = await usersService.list({ 
      empresaId, 
      search: search as string, 
      status: status as string
    });
    sendSuccess(res, users);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao listar usuários';
    sendError(res, message);
  }
});

router.post('/', isAdmin, async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);

    const { nome, email, password, administrador, desenvolvedor, empresa_id, cargo, telefone, perfil } = req.body;
    
    if (!nome || !email || !password) return sendError(res, 'Nome, email e senha são obrigatórios', 400);
    if (!isValidEmail(email)) return sendError(res, 'Email inválido', 400);
    if (password.length < 8) return sendError(res, 'A senha deve ter pelo menos 8 caracteres', 400);

    const targetEmpresaId = currentUser.desenvolvedor ? empresa_id : currentUser.empresa_id;
    
    if (!currentUser.desenvolvedor && !targetEmpresaId) {
      return sendError(res, 'Sua conta não possui uma empresa vinculada para realizar esta ação', 403);
    }

    if (!currentUser.desenvolvedor && (desenvolvedor || perfil === 'desenvolvedor')) {
      return sendError(res, 'Apenas desenvolvedores podem criar usuários com perfil de desenvolvedor', 403);
    }

    const buildData = {
      nome, email, password, cargo, telefone,
      empresa_id: targetEmpresaId,
      administrador: administrador === true,
      desenvolvedor: currentUser.desenvolvedor ? (desenvolvedor === true) : false,
      perfil: currentUser.desenvolvedor ? perfil : (perfil === 'desenvolvedor' ? 'atendente' : perfil)
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
        const currentUser = req.user;
        if (!currentUser) return sendError(res, 'Não autenticado', 401);

        const id = parseInt(req.params.id);
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
            if (req.body.perfil === 'desenvolvedor') {
                delete req.body.perfil;
            }
        }

        // Validate email if present
        if (req.body.email && req.body.email !== targetUser.email) {
            if (!isValidEmail(req.body.email)) {
                return sendError(res, 'Email inválido', 400);
            }
        }

        await usersService.update(id, req.body);
        permissionsService.invalidateCache(id);
        await logSystemAction(req, currentUser.id, currentUser.empresa_id, 'USER_UPDATE', `Atualizou usuário ID ${id}`);
        
        sendSuccess(res, null, 'Usuário atualizado com sucesso');
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erro ao atualizar usuário';
        sendError(res, message);
    }
});

router.patch('/:id/status', isAdmin, async (req: AuthRequest, res) => {
    try {
        const currentUser = req.user;
        if (!currentUser) return sendError(res, 'Não autenticado', 401);

        const id = parseInt(req.params.id);
        const { ativo } = req.body;
        const targetUser = await usersService.getById(id);
        
        if (!targetUser) return sendError(res, 'Usuário não encontrado', 404);
        
        if (!currentUser.desenvolvedor && (targetUser.empresa_id !== currentUser.empresa_id || targetUser.desenvolvedor)) {
            return sendError(res, 'Acesso proibido', 403);
        }

        await usersService.update(id, { ativo });
        permissionsService.invalidateCache(id);
        
        if (!ativo) {
            // Unassign tickets and flag them for review
            try {
               await pool.query(`
                   UPDATE tickets 
                   SET responsavel_id = NULL, precisa_revisao_responsavel = 1 
                   WHERE responsavel_id = ? AND status NOT IN ('resolvido', 'fechado')
               `, [id]);
            } catch(e) {
               console.error("Erro ao liberar tickets do usuário desativado:", e);
            }
        }
        
        await logSystemAction(req, currentUser.id, currentUser.empresa_id, 'USER_STATUS', `${ativo ? 'Ativou' : 'Desativou'} usuário ID ${id}`);
        
        sendSuccess(res, null, `Usuário ${ativo ? 'ativado' : 'desativado'} com sucesso`);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erro ao alterar status';
        sendError(res, message);
    }
});

router.patch('/:id/password', isAdmin, async (req: AuthRequest, res) => {
    try {
        const currentUser = req.user;
        if (!currentUser) return sendError(res, 'Não autenticado', 401);

        const id = parseInt(req.params.id);
        const { password } = req.body;
        
        if (!password || password.length < 8) return sendError(res, 'A senha deve ter pelo menos 8 caracteres', 400);

        const targetUser = await usersService.getById(id);
        if (!targetUser) return sendError(res, 'Usuário não encontrado', 404);
        
        if (!currentUser.desenvolvedor && (targetUser.empresa_id !== currentUser.empresa_id || targetUser.desenvolvedor)) {
            return sendError(res, 'Acesso proibido', 403);
        }

        await usersService.update(id, { password });
        await logSystemAction(req, currentUser.id, currentUser.empresa_id, 'USER_PASSWORD', `Alterou senha do usuário ID ${id}`);
        
        sendSuccess(res, null, 'Senha alterada com sucesso');
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erro ao alterar senha';
        sendError(res, message);
    }
});

export default router;
