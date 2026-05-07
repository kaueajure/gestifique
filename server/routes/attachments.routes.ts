import { Router } from 'express';
import attachmentsService from '../services/attachments.service.js';
import ticketsService from '../services/tickets.service.js';
import { authMiddleware } from '../middlewares/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logSystemAction } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';

const router = Router();

router.use(authMiddleware);

router.get('/:id/download', async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const attachment = await attachmentsService.getById(id);
    
    if (!attachment) return sendError(res, 'Anexo não encontrado', 404);

    const ticket = await ticketsService.getById(attachment.ticket_id);
    if (!ticket) return sendError(res, 'Ticket não encontrado', 404);

    const isAdminOrDev = req.user.administrador || req.user.desenvolvedor;
    const isOwner = ticket.usuario_id === req.user.id;
    const isSameEnterprise = ticket.empresa_id === req.user.empresa_id;

    // Basic access check
    if (!isAdminOrDev && !isOwner) {
       if (!isSameEnterprise) {
          return sendError(res, 'Acesso negado ao ticket', 403);
       }
       // If same enterprise but not admin, they can see shared tickets if implemented, 
       // but for now we follow the ticket route's logic.
    }
    
    // Internal attachment check
    if (attachment.interno && !isAdminOrDev) {
       return sendError(res, 'Acesso negado a anexo interno', 403);
    }

    if (!fs.existsSync(attachment.caminho)) {
       return sendError(res, 'Arquivo físico não encontrado no servidor', 404);
    }

    res.download(attachment.caminho, attachment.nome_original);
  } catch (error: any) {
    sendError(res, error.message);
  }
});

router.delete('/:id', async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const attachment = await attachmentsService.getById(id);
    
    if (!attachment) return sendError(res, 'Anexo não encontrado', 404);

    const isAdminOrDev = req.user.administrador || req.user.desenvolvedor;
    const isOwner = attachment.usuario_id === req.user.id;
    
    if (!isAdminOrDev && !isOwner) {
       return sendError(res, 'Permissão negada para excluir anexo', 403);
    }

    // Even if owner, can't delete if from another enterprise (security)
    if (!req.user.desenvolvedor && attachment.empresa_id !== req.user.empresa_id) {
       return sendError(res, 'Acesso negado', 403);
    }

    await attachmentsService.delete(id);
    await logSystemAction(req, req.user.id, req.user.empresa_id, 'ATTACHMENT_DELETE', `Anexo excluído: ${attachment.nome_original} (ID: ${id})`);
    
    sendSuccess(res, null, 'Anexo excluído com sucesso');
  } catch (error: any) {
    sendError(res, error.message);
  }
});

export default router;
