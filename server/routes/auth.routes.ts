import { Router } from 'express';
import  authService from  '../services/auth.service.js';
import  { sendSuccess, sendError } from  '../utils/response.js';
import  { logSystemAction } from  '../utils/logger.js';
import  { env } from  '../config/env.js';

const router = Router();

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const data = await authService.login(email, password);
    
    // Set Secure Cookie
    res.cookie('token', data.token, {
      httpOnly: true,
      secure: env.IS_PROD,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    await logSystemAction(req, data.user.id, data.user.empresa_id, 'LOGIN', 'Usuário realizou login com sucesso');
    
    sendSuccess(res, data, 'Login realizado com sucesso');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'E-mail ou senha incorretos';
    res.status(401).json({ success: false, message });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  sendSuccess(res, null, 'Logout realizado com sucesso');
});

router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return sendError(res, 'O e-mail é obrigatório.', 400);
    }
    const data = await authService.forgotPassword(email);
    sendSuccess(res, data, 'Processo iniciado.');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao processar solicitação de recuperação.';
    sendError(res, message, 500);
  }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      return sendError(res, 'E-mail, token e nova senha são obrigatórios.', 400);
    }
    if (newPassword.length < 6) {
      return sendError(res, 'A senha deve ter pelo menos 6 caracteres.', 400);
    }
    const data = await authService.resetPassword(email, token, newPassword);
    sendSuccess(res, data, 'Senha redefinida com sucesso.');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao redefinir a senha.';
    sendError(res, message, 400);
  }
});

export default router;
