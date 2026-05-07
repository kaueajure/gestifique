import { Router } from 'express';
import  ticketsService from  '../services/tickets.service.js';
import  attachmentsService from  '../services/attachments.service.js';
import  { authMiddleware } from  '../middlewares/auth.js';
import  { isAdmin } from  '../middlewares/permissions.js';
import  { sendSuccess, sendError } from  '../utils/response.js';
import  { logSystemAction } from  '../utils/logger.js';
import { ticketUpload } from '../middlewares/upload.js';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: any, res) => {
  try {
    const filters = {
      ...req.query,
      empresa_id: req.user.empresa_id,
      usuario_id: req.user.id,
      is_dev: req.user.desenvolvedor,
      is_admin: req.user.administrador
    };
    const tickets = await ticketsService.list(filters);
    sendSuccess(res, tickets);
  } catch (error: any) {
    sendError(res, error.message);
  }
});

router.get('/:id', async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const ticket = await ticketsService.getById(id);
    
    if (!ticket) return sendError(res, 'Ticket não encontrado', 404);
    
    // ACL
    if (!req.user.desenvolvedor && ticket.empresa_id !== req.user.empresa_id) {
      if (ticket.usuario_id !== req.user.id) {
        return sendError(res, 'Permissão negada', 403);
      }
    }

    sendSuccess(res, ticket);
  } catch (error: any) {
    sendError(res, error.message);
  }
});

router.post('/', async (req: any, res) => {
  try {
    const { titulo, descricao, prioridade, categoria } = req.body;
    if (!titulo) return sendError(res, 'Título é obrigatório', 400);

    const ticketId = await ticketsService.create({
      empresa_id: req.user.empresa_id,
      usuario_id: req.user.id,
      titulo, descricao, prioridade, categoria
    });

    await logSystemAction(req, req.user.id, req.user.empresa_id, 'TICKET_CREATE', `Novo chamado criado: #${ticketId}`);
    
    sendSuccess(res, { id: ticketId }, 'Ticket aberto com sucesso', 201);
  } catch (error: any) {
    sendError(res, error.message);
  }
});

router.patch('/:id', async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const ticket = await ticketsService.getById(id);
    if (!ticket) return sendError(res, 'Ticket não encontrado', 404);

    const canManage = req.user.administrador || req.user.desenvolvedor;
    if (!canManage && ticket.usuario_id !== req.user.id) {
        return sendError(res, 'Permissão negada', 403);
    }

    // Common users can't change status/priority/technician
    if (!canManage) {
        delete req.body.status;
        delete req.body.prioridade;
        delete req.body.responsavel_id;
    }

    const oldTicket = await ticketsService.getById(id);
    await ticketsService.update(id, req.body);
    
    let descriptions = [];
    if (req.body.status && req.body.status !== oldTicket.status) descriptions.push(`status para ${req.body.status}`);
    if (req.body.prioridade && req.body.prioridade !== oldTicket.prioridade) descriptions.push(`prioridade para ${req.body.prioridade}`);
    if (req.body.responsavel_id !== undefined && req.body.responsavel_id !== oldTicket.responsavel_id) {
       descriptions.push(`responsável atualizado`);
    }

    const logMsg = descriptions.length > 0 
      ? `Atualizou chamado #${id}: ${descriptions.join(', ')}`
      : `Atualizou detalhes do chamado #${id}`;

    await logSystemAction(req, req.user.id, req.user.empresa_id, 'TICKET_UPDATE', logMsg);
    
    sendSuccess(res, null, 'Ticket atualizado com sucesso');
  } catch (error: any) {
    sendError(res, error.message);
  }
});

router.get('/:id/messages', async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const isAdminOrDev = req.user.administrador || req.user.desenvolvedor;
    const messages = await ticketsService.getMessages(id, isAdminOrDev);
    
    // Fetch attachments for each message
    const messagesWithAttachments = await Promise.all((messages as any[]).map(async (msg: any) => {
      const attachments = await attachmentsService.getByMessage(msg.id);
      return { ...msg, attachments };
    }));

    sendSuccess(res, messagesWithAttachments);
  } catch (error: any) {
    sendError(res, error.message);
  }
});

router.post('/:id/messages', async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const { mensagem, interno } = req.body;
    
    const isAdminOrDev = req.user.administrador || req.user.desenvolvedor;
    
    const messageId = await ticketsService.addMessage({
      ticket_id: id,
      usuario_id: req.user.id,
      mensagem,
      interno: isAdminOrDev ? interno : false
    });

    await logSystemAction(req, req.user.id, req.user.empresa_id, 'MESSAGE_SEND', `Nova mensagem no chamado #${id}`);
    
    sendSuccess(res, { id: messageId }, 'Mensagem enviada');
  } catch (error: any) {
    sendError(res, error.message);
  }
});

// Attachment routes
router.get('/:id/attachments', async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const isAdminOrDev = req.user.administrador || req.user.desenvolvedor;
    const attachments = await attachmentsService.listByTicket(id, isAdminOrDev);
    sendSuccess(res, attachments);
  } catch (error: any) {
    sendError(res, error.message);
  }
});

router.post('/:id/attachments', ticketUpload.array('files', 5), async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const { mensagem_id, interno } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return sendError(res, 'Nenhum arquivo enviado', 400);
    }

    const ticket = await ticketsService.getById(id);
    if (!ticket) return sendError(res, 'Ticket não encontrado', 404);

    const isInternal = req.user.administrador || req.user.desenvolvedor ? (interno === 'true' || interno === true) : false;

    const createdAttachments = await Promise.all(files.map(async (file) => {
      const attachmentId = await attachmentsService.create({
        ticket_id: id,
        mensagem_id: mensagem_id ? parseInt(mensagem_id) : null,
        usuario_id: req.user.id,
        empresa_id: req.user.empresa_id,
        nome_original: file.originalname,
        nome_arquivo: file.filename,
        caminho: file.path,
        mime_type: file.mimetype,
        tamanho_bytes: file.size,
        interno: isInternal
      });

      return {
        id: attachmentId,
        nome_original: file.originalname,
        mime_type: file.mimetype,
        tamanho_bytes: file.size,
        url: `/api/attachments/${attachmentId}/download`
      };
    }));

    await logSystemAction(req, req.user.id, req.user.empresa_id, 'ATTACHMENT_UPLOAD', `Anexo(s) enviado(s) para o chamado #${id}`);

    sendSuccess(res, createdAttachments, 'Arquivos enviados com sucesso', 201);
  } catch (error: any) {
    sendError(res, error.message);
  }
});

export default router;
