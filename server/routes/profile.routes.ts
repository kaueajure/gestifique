import { Router } from 'express';
import usersService from '../services/users.service';
import { authMiddleware } from '../middlewares/auth';
import { sendSuccess, sendError } from '../utils/response';
import { logSystemAction } from '../utils/logger';

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
    // Prevent privilege escalation
    const safeData = { ...req.body };
    delete safeData.administrador;
    delete safeData.desenvolvedor;
    delete safeData.empresa_id;
    delete safeData.ativo;

    await usersService.update(req.user.id, safeData);
    await logSystemAction(req, req.user.id, req.user.empresa_id, 'PROFILE_UPDATE', 'Usuário atualizou o próprio perfil');
    
    sendSuccess(res, null, 'Perfil atualizado com sucesso');
  } catch (error: any) {
    sendError(res, error.message);
  }
});

export default router;
