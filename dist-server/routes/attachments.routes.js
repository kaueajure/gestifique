import { Router } from 'express';
import attachmentsService from '../services/attachments.service.js';
import ticketsService from '../services/tickets.service.js';
import { authMiddleware } from '../middlewares/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logSystemAction } from '../utils/logger.js';
import { permissionsService } from '../services/permissions.service.js';
import { env } from '../config/env.js';
import { promises as fs } from 'fs';
import path from 'path';
const router = Router();
router.use(authMiddleware);
router.get('/:id/download', async (req, res) => {
    try {
        const currentUser = req.user;
        if (!currentUser)
            return sendError(res, 'Não autenticado', 401);
        const id = parseInt(req.params.id);
        const attachment = await attachmentsService.getById(id);
        if (!attachment)
            return sendError(res, 'Anexo não encontrado', 404);
        const ticketResult = await ticketsService.getByIdForUser(attachment.ticket_id, currentUser);
        if (!ticketResult)
            return sendError(res, 'Ticket não encontrado', 404);
        if (ticketResult.error === 'forbidden')
            return sendError(res, 'Acesso negado ao anexo', 403);
        const ticket = ticketResult;
        // S7: defesa em profundidade — somente desenvolvedor acessa anexo de outra empresa.
        // (getByIdForUser trata administrador como superusuário; este guard mantém a
        // regra de "admin acessa apenas a própria empresa" e bloqueia cross-empresa.)
        if (!currentUser.desenvolvedor && ticket.empresa_id !== currentUser.empresa_id) {
            return sendError(res, 'Acesso negado ao anexo (outra empresa)', 403);
        }
        const isAdminOrDev = currentUser.administrador || currentUser.desenvolvedor;
        const canViewInternal = isAdminOrDev || await permissionsService.hasPermission(currentUser, 'ticket_mensagens.ver_internos');
        // Internal attachment check
        if (attachment.interno && !canViewInternal) {
            return sendError(res, 'Acesso negado a anexo interno', 403);
        }
        // Path safety check (usa o diretório central de storage, não hardcoded)
        const absolutePath = path.resolve(attachment.caminho);
        const uploadsDir = path.resolve(process.cwd(), env.STORAGE_CONFIG.LOCAL_PATH);
        const relativePath = path.relative(uploadsDir, absolutePath);
        if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
            return sendError(res, 'Caminho de arquivo inválido', 400);
        }
        try {
            await fs.access(absolutePath);
        }
        catch {
            return sendError(res, 'Arquivo físico não encontrado no servidor', 404);
        }
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.download(absolutePath, attachment.nome_original);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao processar download';
        sendError(res, message);
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const currentUser = req.user;
        if (!currentUser)
            return sendError(res, 'Não autenticado', 401);
        const id = parseInt(req.params.id);
        const attachment = await attachmentsService.getById(id);
        if (!attachment)
            return sendError(res, 'Anexo não encontrado', 404);
        const isAdminOrDev = currentUser.administrador || currentUser.desenvolvedor;
        const isOwner = attachment.usuario_id === currentUser.id;
        if (!isAdminOrDev && !isOwner) {
            return sendError(res, 'Permissão negada para excluir anexo', 403);
        }
        // Even if owner, can't delete if from another enterprise (security)
        if (!currentUser.desenvolvedor && attachment.empresa_id !== currentUser.empresa_id) {
            return sendError(res, 'Acesso negado', 403);
        }
        await attachmentsService.delete(id);
        await logSystemAction(req, currentUser.id, currentUser.empresa_id, 'ATTACHMENT_DELETE', `Anexo excluído: ${attachment.nome_original} (ID: ${id})`);
        // Real-time update via WebSocket
        const io = req.app.get('io');
        if (io) {
            io.to(`empresa_${attachment.empresa_id}`).emit('ticketMessagesChanged', {
                ticketId: attachment.ticket_id,
                empresaId: attachment.empresa_id
            });
        }
        sendSuccess(res, null, 'Anexo excluído com sucesso');
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao excluir anexo';
        sendError(res, message);
    }
});
export default router;
