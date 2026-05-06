import { Router } from 'express';
import authService from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/response';
import { logSystemAction } from '../utils/logger';

const router = Router();

router.post('/login', async (req, res, next) => {
  try {
    const { email, senha } = req.body;
    const data = await authService.login(email, senha);
    
    await logSystemAction(req, data.user.id, data.user.empresa_id, 'LOGIN', 'Usuário realizou login com sucesso');
    
    sendSuccess(res, data, 'Login realizado com sucesso');
  } catch (error: any) {
    sendError(res, error.message, 401);
  }
});

export default router;
