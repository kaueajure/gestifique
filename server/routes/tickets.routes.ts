import { Router } from 'express';
import  ticketsService from  '../services/tickets.service.js';
import  attachmentsService from  '../services/attachments.service.js';
import  { authMiddleware, AuthRequest } from  '../middlewares/auth.js';
import  { isAdmin } from  '../middlewares/permissions.js';
import  { sendSuccess, sendError } from  '../utils/response.js';
import  { logSystemAction } from  '../utils/logger.js';
import { ticketUpload } from '../middlewares/upload.js';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);

    const filters = {
      ...req.query,
      empresa_id: currentUser.empresa_id,
      usuario_id: currentUser.id,
      is_dev: currentUser.desenvolvedor,
      is_admin: currentUser.administrador
    };
    const tickets = await ticketsService.list(filters);
    sendSuccess(res, tickets);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao listar tickets';
    sendError(res, message);
  }
});

router.get('/kanban', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);

    const filters = {
      empresa_id: currentUser.empresa_id,
      usuario_id: currentUser.id,
      is_dev: currentUser.desenvolvedor,
      is_admin: currentUser.administrador,
      responsavel_id: req.query.responsavel_id,
      empresa_id_filter: req.query.empresa_id
    };
    
    const kanbanData = await ticketsService.getKanban(filters);
    sendSuccess(res, kanbanData);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao carregar Kanban';
    sendError(res, message);
  }
});

router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);

    const id = parseInt(req.params.id);
    const ticket = await ticketsService.getById(id);
    
    if (!ticket) return sendError(res, 'Ticket não encontrado', 404);
    
    // ACL
    if (!currentUser.desenvolvedor && ticket.empresa_id !== currentUser.empresa_id) {
      if (ticket.usuario_id !== currentUser.id) {
        return sendError(res, 'Permissão negada', 403);
      }
    }

    sendSuccess(res, ticket);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar ticket';
    sendError(res, message);
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);

    const { titulo, descricao, prioridade, categoria } = req.body;
    if (!titulo) return sendError(res, 'Título é obrigatório', 400);

    const targetEmpresaId = currentUser.desenvolvedor && req.body.empresa_id
      ? Number(req.body.empresa_id)
      : currentUser.empresa_id;

    if (!targetEmpresaId) {
      if (currentUser.desenvolvedor) {
        return sendError(res, 'Selecione uma empresa para abrir o atendimento.', 400);
      } else {
        return sendError(res, 'Sua conta não possui empresa vinculada para abrir atendimento.', 400);
      }
    }

    const ticketId = await ticketsService.create({
      empresa_id: targetEmpresaId,
      usuario_id: currentUser.id,
      titulo, descricao, prioridade, categoria
    });

    await logSystemAction(req, currentUser.id, targetEmpresaId, 'TICKET_CREATE', `Novo chamado criado: #${ticketId}`);
    
    sendSuccess(res, { id: ticketId }, 'Ticket aberto com sucesso', 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao criar ticket';
    sendError(res, message);
  }
});

router.patch('/:id/status', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);

    const id = parseInt(req.params.id);
    const { status } = req.body;
    if (!status) return sendError(res, 'Status é obrigatório', 400);

    const ticket = await ticketsService.getById(id);
    if (!ticket) return sendError(res, 'Ticket não encontrado', 404);

    const canManage = currentUser.administrador || currentUser.desenvolvedor;
    if (!canManage) {
        return sendError(res, 'Permissão negada', 403);
    }

    if (!currentUser.desenvolvedor && ticket.empresa_id !== currentUser.empresa_id) {
        return sendError(res, 'Permissão negada para atualizar chamados de outra empresa.', 403);
    }

    const updateResult = await ticketsService.updateStatus(id, status, currentUser.id, req);
    if (updateResult && updateResult.oldStatus !== updateResult.newStatus) {
       await logSystemAction(req, currentUser.id, updateResult.empresa_id, 'TICKET_STATUS_CHANGE', `Status do chamado #${id} alterado de ${updateResult.oldStatus} para ${updateResult.newStatus}`);
    }

    sendSuccess(res, null, 'Status atualizado com sucesso');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar status';
    sendError(res, message);
  }
});

router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);

    const id = parseInt(req.params.id);
    const ticket = await ticketsService.getById(id);
    if (!ticket) return sendError(res, 'Ticket não encontrado', 404);

    const canManage = currentUser.administrador || currentUser.desenvolvedor;
    if (!canManage && ticket.usuario_id !== currentUser.id) {
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

    await logSystemAction(req, currentUser.id, currentUser.empresa_id, 'TICKET_UPDATE', logMsg);
    
    sendSuccess(res, null, 'Ticket atualizado com sucesso');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar ticket';
    sendError(res, message);
  }
});

router.get('/:id/messages', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);

    const id = parseInt(req.params.id);
    const isAdminOrDev = currentUser.administrador || currentUser.desenvolvedor;
    const messages = await ticketsService.getMessages(id, isAdminOrDev);
    
    // Fetch attachments for each message
    const messagesWithAttachments = await Promise.all((messages as any[]).map(async (msg: any) => {
      const attachments = await attachmentsService.getByMessage(msg.id, isAdminOrDev);
      return { ...msg, attachments };
    }));

    sendSuccess(res, messagesWithAttachments);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao listar mensagens';
    sendError(res, message);
  }
});

router.post('/:id/messages', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);

    const id = parseInt(req.params.id);
    const { mensagem, interno } = req.body;
    
    const isAdminOrDev = currentUser.administrador || currentUser.desenvolvedor;
    
    const messageId = await ticketsService.addMessage({
      ticket_id: id,
      usuario_id: currentUser.id,
      mensagem,
      interno: isAdminOrDev ? interno : false
    });

    await logSystemAction(req, currentUser.id, currentUser.empresa_id, 'MESSAGE_SEND', `Nova mensagem no chamado #${id}`);
    
    sendSuccess(res, { id: messageId }, 'Mensagem enviada');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao enviar mensagem';
    sendError(res, message);
  }
});

// Attachment routes
router.get('/:id/attachments', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);

    const id = parseInt(req.params.id);
    const isAdminOrDev = currentUser.administrador || currentUser.desenvolvedor;
    const attachments = await attachmentsService.listByTicket(id, isAdminOrDev);
    sendSuccess(res, attachments);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao listar anexos';
    sendError(res, message);
  }
});

router.post('/:id/attachments', ticketUpload.array('files', 5), async (req: AuthRequest, res) => {
  const files = req.files as Express.Multer.File[];
  try {
    const currentUser = req.user;
    if (!currentUser) {
      await attachmentsService.deleteMultiple(files);
      return sendError(res, 'Não autenticado', 401);
    }

    const id = parseInt(req.params.id);
    const { mensagem_id, interno } = req.body;

    if (!files || files.length === 0) {
      return sendError(res, 'Nenhum arquivo enviado', 400);
    }

    const ticket = await ticketsService.getById(id);
    if (!ticket) {
      await attachmentsService.deleteMultiple(files);
      return sendError(res, 'Ticket não encontrado', 404);
    }

    // ACL Check
    const isAdminOrDev = !!(currentUser.administrador || currentUser.desenvolvedor);
    const isOwner = ticket.usuario_id === currentUser.id;
    const isSameEnterprise = ticket.empresa_id === currentUser.empresa_id;

    // Desenvolvedor: tudo
    // Administrador: tickets da empresa
    // Usuário comum: apenas tickets próprios
    if (!currentUser.desenvolvedor) {
       if (currentUser.administrador) {
          if (!isSameEnterprise) {
            await attachmentsService.deleteMultiple(files);
            return sendError(res, 'Permissão negada para anexar arquivos neste ticket (Admin)', 403);
          }
       } else {
          // Usuário comum
          if (!isOwner) {
            await attachmentsService.deleteMultiple(files);
            return sendError(res, 'Permissão negada para anexar arquivos neste ticket (Comum)', 403);
          }
       }
    }

    const isInternal = isAdminOrDev ? (interno === 'true' || interno === true) : false;

    const createdAttachments = await Promise.all(files.map(async (file) => {
      const attachmentId = await attachmentsService.create({
        ticket_id: id,
        mensagem_id: mensagem_id ? parseInt(mensagem_id) : null,
        usuario_id: currentUser.id,
        empresa_id: currentUser.empresa_id,
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

    await logSystemAction(req, currentUser.id, currentUser.empresa_id, 'ATTACHMENT_UPLOAD', `Anexo(s) enviado(s) para o chamado #${id}`);

    sendSuccess(res, createdAttachments, 'Arquivos enviados com sucesso', 201);
  } catch (error: unknown) {
    if (files && files.length > 0) {
      await attachmentsService.deleteMultiple(files);
    }
    const message = error instanceof Error ? error.message : 'Erro ao enviar anexos';
    sendError(res, message);
  }
});

export default router;
