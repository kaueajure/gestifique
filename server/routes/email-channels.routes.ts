import { Router } from 'express';
import { emailChannelsService } from '../services/email-channels.service.js';
import { gmailOAuthService } from '../services/gmail-oauth.service.js';
import { authMiddleware } from '../middlewares/auth.js';
import { sendError, sendSuccess } from '../utils/response.js';
import { isValidEmail } from '../utils/validators.js';

const router = Router();
router.use(authMiddleware);

// Permissões:
// Dev pode ver e mexer em qualquer empresa
// Admin pode apenas na sua própria
const canManage = (req: any, targetEmpresaId: number) => {
    return req.user.desenvolvedor || (req.user.administrador && req.user.empresa_id === targetEmpresaId);
};

router.get('/companies/:companyId/email-channels', async (req: any, res) => {
    try {
        const companyId = parseInt(req.params.companyId, 10);
        if (!canManage(req, companyId)) {
             return sendError(res, 'Permissão negada', 403);
        }
        const canais = await emailChannelsService.listByCompany(companyId);
        return sendSuccess(res, canais);
    } catch(err: any) {
        return sendError(res, err.message, 500);
    }
});

router.post('/companies/:companyId/email-channels', async (req: any, res) => {
    try {
        const companyId = parseInt(req.params.companyId, 10);
        if (!canManage(req, companyId)) {
             return sendError(res, 'Permissão negada', 403);
        }
        
        const { email_publico, nome } = req.body;
        if (!email_publico || !isValidEmail(email_publico)) {
            return sendError(res, 'E-mail público inválido', 400);
        }

        const id = await emailChannelsService.createChannel({
            empresa_id: companyId,
            email_publico,
            nome
        });
        return sendSuccess(res, { id }, 'Canal criado com sucesso');
    } catch(err: any) {
        return sendError(res, err.message, 500);
    }
});

router.delete('/companies/:companyId/email-channels/:id', async (req: any, res) => {
    try {
        const companyId = parseInt(req.params.companyId, 10);
        if (!canManage(req, companyId)) {
             return sendError(res, 'Permissão negada', 403);
        }
        const id = parseInt(req.params.id, 10);
        await emailChannelsService.deleteChannel(id, companyId);
        return sendSuccess(res, null, 'Canal deletado com sucesso');
    } catch(err: any) {
        return sendError(res, err.message, 500);
    }
});

router.post('/companies/:companyId/email-channels/:id/regenerate', async (req: any, res) => {
    try {
        const companyId = parseInt(req.params.companyId, 10);
        if (!canManage(req, companyId)) {
             return sendError(res, 'Permissão negada', 403);
        }
        const id = parseInt(req.params.id, 10);
        await emailChannelsService.regenerate(id, companyId);
        return sendSuccess(res, null, 'Canal regenerado com sucesso');
    } catch(err: any) {
        return sendError(res, err.message, 500);
    }
});

router.get('/companies/:companyId/email-channels/:id/oauth/google/start', async (req: any, res) => {
    try {
        const companyId = parseInt(req.params.companyId, 10);
        const channelId = parseInt(req.params.id, 10);

        if (!canManage(req, companyId)) {
            return sendError(res, 'Permissão negada', 403);
        }
        if (!gmailOAuthService.isConfigured()) {
            return sendError(res, 'Google OAuth não está configurado no servidor', 503);
        }

        const channel = await emailChannelsService.getByIdAndCompany(channelId, companyId);
        if (!channel) {
            return sendError(res, 'Canal de e-mail não encontrado', 404);
        }

        const authUrl = gmailOAuthService.getAuthUrl(channelId, companyId, req.user.id);
        return res.redirect(authUrl);
    } catch (err: any) {
        return sendError(res, err.message, 500);
    }
});

router.post('/companies/:companyId/email-channels/:id/oauth/google/disconnect', async (req: any, res) => {
    try {
        const companyId = parseInt(req.params.companyId, 10);
        const channelId = parseInt(req.params.id, 10);

        if (!canManage(req, companyId)) {
            return sendError(res, 'Permissão negada', 403);
        }

        const channel = await emailChannelsService.getByIdAndCompany(channelId, companyId);
        if (!channel) {
            return sendError(res, 'Canal de e-mail não encontrado', 404);
        }

        await gmailOAuthService.disconnect(channelId, companyId, req.user.id);
        return sendSuccess(res, null, 'Gmail desconectado com sucesso');
    } catch (err: any) {
        return sendError(res, err.message, 500);
    }
});

router.post('/companies/:companyId/email-channels/:id/oauth/google/test-send', async (req: any, res) => {
    try {
        const companyId = parseInt(req.params.companyId, 10);
        const channelId = parseInt(req.params.id, 10);

        if (!canManage(req, companyId)) {
            return sendError(res, 'Permissão negada', 403);
        }
        if (!gmailOAuthService.isConfigured()) {
            return sendError(res, 'Google OAuth não está configurado no servidor', 503);
        }

        const channel = await emailChannelsService.getByIdAndCompany(channelId, companyId);
        if (!channel) {
            return sendError(res, 'Canal de e-mail não encontrado', 404);
        }
        if (channel.send_status !== 'connected') {
            return sendError(res, 'Conecte o Gmail antes de testar o envio', 400);
        }

        const { to } = req.body || {};
        if (to && !isValidEmail(to)) {
            return sendError(res, 'E-mail de destino inválido', 400);
        }

        const result = await gmailOAuthService.sendTestEmail(channelId, companyId, to);
        if (!result.success) {
            return sendError(res, result.error || 'Falha no envio de teste', 502);
        }

        return sendSuccess(res, { sent_to: to || channel.oauth_email || channel.email_publico }, 'E-mail de teste enviado');
    } catch (err: any) {
        return sendError(res, err.message, 500);
    }
});

export const emailChannelsRoutes = router;
