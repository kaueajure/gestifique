import { Router } from 'express';
import { gmailOAuthService } from '../services/gmail-oauth.service.js';
import { env } from '../config/env.js';

const router = Router();

function getFrontendBaseUrl(): string {
  const base = env.FRONTEND_URL || env.CORS_ORIGINS?.[0] || 'http://localhost:5173';
  return base.replace(/\/$/, '');
}

function redirectAfterOAuth(
  res: any,
  params: { success: boolean; empresaId?: number; channelId?: number; error?: string }
) {
  const url = new URL(getFrontendBaseUrl());

  if (params.success) {
    url.searchParams.set('gmail_oauth', 'success');
    if (params.empresaId) url.searchParams.set('empresa_id', String(params.empresaId));
    if (params.channelId) url.searchParams.set('channel_id', String(params.channelId));
  } else {
    url.searchParams.set('gmail_oauth', 'error');
    if (params.error) {
      url.searchParams.set('message', params.error.slice(0, 500));
    }
  }

  return res.redirect(url.toString());
}

router.get('/google/callback', async (req, res) => {
  const code = typeof req.query.code === 'string' ? req.query.code : null;
  const state = typeof req.query.state === 'string' ? req.query.state : null;
  const oauthError = typeof req.query.error === 'string' ? req.query.error : null;

  if (oauthError) {
    return redirectAfterOAuth(res, {
      success: false,
      error: `Autorização cancelada ou negada pelo Google (${oauthError})`,
    });
  }

  if (!code || !state) {
    return redirectAfterOAuth(res, {
      success: false,
      error: 'Resposta OAuth incompleta. Tente conectar o Gmail novamente.',
    });
  }

  try {
    const result = await gmailOAuthService.handleCallback(code, state);
    return redirectAfterOAuth(res, {
      success: true,
      empresaId: result.empresaId,
      channelId: result.channelId,
    });
  } catch (error: any) {
    console.error('[Gmail OAuth] Callback error:', error);
    return redirectAfterOAuth(res, {
      success: false,
      error: error?.message || 'Falha ao conectar Gmail',
    });
  }
});

export const gmailOAuthCallbackRoutes = router;
