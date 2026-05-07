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
    const message = error instanceof Error ? error.message : 'E-mail ou senha inválidos';
    sendError(res, message, 401);
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  sendSuccess(res, null, 'Logout realizado com sucesso');
});

export default router;
