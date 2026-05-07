import { Router } from 'express';
import  usersService from  '../services/users.service.js';
import  { authMiddleware } from  '../middlewares/auth.js';
import  { sendSuccess, sendError } from  '../utils/response.js';
import  { logSystemAction } from  '../utils/logger.js';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: any, res) => {
  try {
    const profile = await usersService.getById(req.user.id);
    sendSuccess(res, profile);
  } catch (error: any) {
    sendError(res, error.message);
  }
});

router.patch('/', async (req: any, res) => {
  try {
    // Prevent privilege escalation - Only allow specific fields
    const safeData: any = {};
    if (req.body.nome) safeData.nome = req.body.nome;
    if (req.body.telefone) safeData.telefone = req.body.telefone;
    if (req.body.foto) safeData.foto = req.body.foto;

    if (Object.keys(safeData).length === 0) {
      return sendError(res, 'Nenhum dado válido para atualização');
    }

    await usersService.update(req.user.id, safeData);
    await logSystemAction(req, req.user.id, req.user.empresa_id, 'PROFILE_UPDATE', 'Usuário atualizou o próprio perfil');
    
    sendSuccess(res, null, 'Perfil atualizado com sucesso');
  } catch (error: any) {
    sendError(res, error.message);
  }
});

router.patch('/password', async (req: any, res) => {
  try {
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

    await usersService.updatePassword(req.user.id, currentPassword, newPassword);
    await logSystemAction(req, req.user.id, req.user.empresa_id, 'PASSWORD_CHANGE', 'Usuário alterou a senha');

    sendSuccess(res, null, 'Senha alterada com sucesso');
  } catch (error: any) {
    sendError(res, error.message);
  }
});

export default router;
