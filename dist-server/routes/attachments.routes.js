import { Router } from 'express';
import attachmentsService from '../services/attachments.service.js';
import ticketsService from '../services/tickets.service.js';
import { authMiddleware } from '../middlewares/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logSystemAction } from '../utils/logger.js';
import { permissionsService } from '../services/permissions.service.js';
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
        const ticket = await ticketsService.getById(attachment.ticket_id);
        if (!ticket)
            return sendError(res, 'Ticket não encontrado', 404);
        const isAdminOrDev = currentUser.administrador || currentUser.desenvolvedor;
        const isOwner = ticket.usuario_id === currentUser.id;
        const isSameEnterprise = ticket.empresa_id === currentUser.empresa_id;
        // ACL Check
        // Desenvolvedor: tudo
        // Administrador: tickets da empresa
        // Usuário comum: apenas tickets próprios
        if (!currentUser.desenvolvedor) {
            if (currentUser.administrador) {
                if (!isSameEnterprise) {
                    return sendError(res, 'Acesso negado ao ticket (Admin)', 403);
                }
            }
            else {
                // Usuário comum
                if (!isOwner) {
                    return sendError(res, 'Acesso negado ao ticket (Comum)', 403);
                }
            }
        }
        const canViewInternal = isAdminOrDev || await permissionsService.hasPermission(currentUser, 'ticket_mensagens.ver_internos');
        // Internal attachment check
        if (attachment.interno && !canViewInternal) {
            return sendError(res, 'Acesso negado a anexo interno', 403);
        }
        // Path safety check
        const absolutePath = path.resolve(attachment.caminho);
        const uploadsDir = path.resolve(process.cwd(), 'uploads', 'tickets');
        if (!absolutePath.startsWith(uploadsDir)) {
            return sendError(res, 'Caminho de arquivo inválido', 400);
        }
        try {
            await fs.access(absolutePath);
        }
        catch {
            return sendError(res, 'Arquivo físico não encontrado no servidor', 404);
        }
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
