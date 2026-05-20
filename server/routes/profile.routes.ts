import { Router } from 'express';
import  usersService from  '../services/users.service.js';
import  { authMiddleware, AuthRequest } from  '../middlewares/auth.js';
import  { sendSuccess, sendError } from  '../utils/response.js';
import  { logSystemAction } from  '../utils/logger.js';
import { permissionsService } from '../services/permissions.service.js';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);

    const profile = await usersService.getById(currentUser.id);
    const permissions = await permissionsService.getEffectivePermissions(profile);
    const isSuperUser = !!(profile.desenvolvedor || profile.administrador);

    sendSuccess(res, {
      ...profile,
      permissions,
      isSuperUser
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar perfil';
    sendError(res, message);
  }
});

router.patch('/', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);

    // Prevent privilege escalation - Only allow specific fields
    const safeData: Partial<{nome: string; telefone: string; foto: string}> = {};
    if (req.body.nome) safeData.nome = req.body.nome;
    if (req.body.telefone) safeData.telefone = req.body.telefone;
    if (req.body.foto) safeData.foto = req.body.foto;

    if (Object.keys(safeData).length === 0) {
      return sendError(res, 'Nenhum dado válido para atualização');
    }

    await usersService.update(currentUser.id, safeData);
    await logSystemAction(req, currentUser.id, currentUser.empresa_id, 'PROFILE_UPDATE', 'Usuário atualizou o próprio perfil');
    
    sendSuccess(res, null, 'Perfil atualizado com sucesso');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar perfil';
    sendError(res, message);
  }
});

router.patch('/password', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return sendError(res, 'Todos os campos são obrigatórios');
    }

    if (newPassword.length < 8) {
      return sendError(res, 'A nova senha deve ter no mínimo 8 caracteres');
    }

    if (newPassword !== confirmPassword) {
      return sendError(res, 'A confirmação de senha não confere');
    }

    await usersService.updatePassword(currentUser.id, currentPassword, newPassword);
    await logSystemAction(req, currentUser.id, currentUser.empresa_id, 'PASSWORD_CHANGE', 'Usuário alterou a senha');

    sendSuccess(res, null, 'Senha alterada com sucesso');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao alterar senha';
    sendError(res, message);
  }
});

export default router;
