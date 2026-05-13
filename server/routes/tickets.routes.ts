import { Router } from 'express';
import  ticketsService, { toPositiveInt } from  '../services/tickets.service.js';
import  attachmentsService from  '../services/attachments.service.js';
import  { authMiddleware, AuthRequest } from  '../middlewares/auth.js';
import  { isAdmin } from  '../middlewares/permissions.js';
import  { sendSuccess, sendError } from  '../utils/response.js';
import  { logSystemAction } from  '../utils/logger.js';
import { ticketUpload } from '../middlewares/upload.js';
import pool from '../db/connection.js';

const router = Router();

function parseTicketQueue(value: unknown): string {
  const validQueues = [
    'todos',
    'meus',
    'sem_responsavel',
    'urgentes',
    'sla_vencido',
    'vence_em_breve',
    'aguardando_cliente'
  ];
  return typeof value === 'string' && validQueues.includes(value) ? value : 'todos';
}

router.use(authMiddleware);

router.delete('/cleanup-spam', async (req: AuthRequest, res) => {
  try {
    const result = await ticketsService.cleanupSpam();
    sendSuccess(res, result, 'Limpeza concluída');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro na limpeza';
    sendError(res, message);
  }
});

router.get('/', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);

    const empresaIdFilter = currentUser.desenvolvedor 
      ? toPositiveInt(req.query.empresa_id) 
      : undefined;

    if (currentUser.desenvolvedor && !empresaIdFilter) {
      return sendSuccess(res, {
        data: [],
        meta: { page: 1, limit: 15, total: 0, totalPages: 1 },
        summary: { total: 0, aberto: 0, em_andamento: 0, aguardando_cliente: 0, resolvido: 0, fechado: 0 },
        queues: { todos: 0, meus: 0, sem_responsavel: 0, urgentes: 0, sla_vencido: 0, vence_em_breve: 0, aguardando_cliente: 0 }
      });
    }
      
    const responsavelId = toPositiveInt(req.query.responsavel_id);

    const fila = parseTicketQueue(req.query.fila);

    const filters = {
      empresa_id: currentUser.empresa_id,
      usuario_id: currentUser.id,
      is_dev: currentUser.desenvolvedor,
      is_admin: currentUser.administrador,
      responsavel_id: responsavelId,
      empresa_id_filter: empresaIdFilter,
      fila,
      status: typeof req.query.status === 'string' && req.query.status !== 'todos' ? req.query.status : undefined,
      prioridade: typeof req.query.prioridade === 'string' && req.query.prioridade !== 'todas' ? req.query.prioridade : undefined,
      categoria: typeof req.query.categoria === 'string' && req.query.categoria !== 'todas' ? req.query.categoria : undefined,
      search: typeof req.query.search === 'string' ? req.query.search.trim() : undefined,
      page: toPositiveInt(req.query.page) ?? 1,
      limit: toPositiveInt(req.query.limit) ?? 15
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
    
    // Explicit validation for query parameters
    const empresaIdFilter = currentUser.desenvolvedor
      ? toPositiveInt(req.query.empresa_id)
      : undefined;

    if (currentUser.desenvolvedor && !empresaIdFilter) {
      return sendSuccess(res, {
        columns: [
          { id: 'aberto', title: 'Aberto', count: 0, tickets: [] },
          { id: 'em_andamento', title: 'Em andamento', count: 0, tickets: [] },
          { id: 'aguardando_cliente', title: 'Aguardando resposta', count: 0, tickets: [] },
          { id: 'resolvido', title: 'Finalizado', count: 0, tickets: [] }
        ],
        totals: { total: 0, aberto: 0, em_andamento: 0, aguardando_cliente: 0, resolvido: 0, fechado: 0 },
        queues: { todos: 0, meus: 0, sem_responsavel: 0, urgentes: 0, sla_vencido: 0, vence_em_breve: 0, aguardando_cliente: 0 }
      });
    }

    const responsavelId = toPositiveInt(req.query.responsavel_id);

    const validStatuses = ['aberto', 'em_andamento', 'aguardando_cliente', 'resolvido', 'fechado', 'todos'];
    const validPriorities = ['baixa', 'media', 'alta', 'urgente', 'todas'];
    
    const status = typeof req.query.status === 'string' && validStatuses.includes(req.query.status) 
      ? (req.query.status === 'todos' ? undefined : req.query.status) 
      : undefined;
      
    const prioridade = typeof req.query.prioridade === 'string' && validPriorities.includes(req.query.prioridade)
      ? (req.query.prioridade === 'todas' ? undefined : req.query.prioridade)
      : undefined;
      
    const categoria = typeof req.query.categoria === 'string' && req.query.categoria !== 'todas' 
      ? req.query.categoria 
      : undefined;

    const fila = parseTicketQueue(req.query.fila);

    const filters = {
      empresa_id: currentUser.empresa_id,
      usuario_id: currentUser.id,
      is_dev: currentUser.desenvolvedor,
      is_admin: currentUser.administrador,
      responsavel_id: responsavelId,
      empresa_id_filter: empresaIdFilter,
      search: typeof req.query.search === 'string' ? req.query.search.trim() : undefined,
      status,
      prioridade,
      categoria,
      fila
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
    const result: any = await ticketsService.getByIdForUser(id, currentUser);
    
    if (!result) return sendError(res, 'Ticket não encontrado', 404);
    if (result.error === 'forbidden') return sendError(res, 'Permissão negada', 403);

    sendSuccess(res, result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar ticket';
    sendError(res, message);
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);

    let { titulo, descricao, prioridade, categoria } = req.body;
    
    // Validations
    if (!titulo || titulo.trim().length < 3) return sendError(res, 'Título obrigatório (min 3 caracteres)', 400);
    if (!descricao || descricao.trim().length < 5) return sendError(res, 'Descrição obrigatória (min 5 caracteres)', 400);

    const validPriorities = ['baixa', 'media', 'alta', 'urgente'];
    const validCategories = ['suporte_tecnico', 'financeiro', 'recursos_humanos', 'comercial', 'outros'];

    if (prioridade && !validPriorities.includes(prioridade)) return sendError(res, 'Prioridade inválida', 400);
    if (categoria && !validCategories.includes(categoria)) return sendError(res, 'Categoria inválida', 400);
    
    if (!prioridade) prioridade = 'media';
    if (!categoria) categoria = 'suporte_tecnico';

    const targetEmpresaId = req.body.empresa_id && currentUser.desenvolvedor
      ? Number(req.body.empresa_id)
      : currentUser.empresa_id;

    if (!targetEmpresaId) {
       return sendError(res, 'Sua conta não possui empresa vinculada para abrir atendimento.', 400);
    }

    // Check if empresa exists and is active
    const [empresaRows]: any = await pool.query('SELECT ativo FROM empresas WHERE id = ?', [targetEmpresaId]);
    if (empresaRows.length === 0 || Number(empresaRows[0].ativo) !== 1) {
       return sendError(res, 'Empresa inválida ou inativa.', 400);
    }

    const ticketId = await ticketsService.create({
      empresa_id: targetEmpresaId,
      usuario_id: currentUser.id,
      titulo, descricao, prioridade, categoria
    });

    await logSystemAction(req, currentUser.id, targetEmpresaId, 'TICKET_CREATE', `Novo chamado criado: #${ticketId}`);
    
    try {
      const fullTicket = await ticketsService.getByIdForUser(ticketId, currentUser);
      const io = req.app.get('io');
      if (io && fullTicket) {
        io.to(`empresa_${targetEmpresaId}`).emit('ticketCreated', fullTicket);
      }
    } catch(e) {}

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

    const validStatuses = ['aberto', 'em_andamento', 'aguardando_cliente', 'resolvido', 'fechado'];
    if (!validStatuses.includes(status)) return sendError(res, 'Status inválido', 400);

    const result: any = await ticketsService.getByIdForUser(id, currentUser);
    if (!result) return sendError(res, 'Ticket não encontrado', 404);
    if (result.error === 'forbidden') return sendError(res, 'Permissão negada', 403);

    const ticket = result;

    const canManage = currentUser.administrador || currentUser.desenvolvedor;
    if (!canManage) {
        return sendError(res, 'Permissão negada', 403);
    }

    const updateResult = await ticketsService.updateStatus(id, status, currentUser.id, req);
    if (updateResult && updateResult.oldStatus !== updateResult.newStatus) {
       await logSystemAction(req, currentUser.id, updateResult.empresa_id, 'TICKET_STATUS_CHANGE', `Status do chamado #${id} alterado de ${updateResult.oldStatus} para ${updateResult.newStatus}`);
       
       try {
         const fullTicket = await ticketsService.getByIdForUser(id, currentUser);
         const io = req.app.get('io');
         if (io && fullTicket) {
           io.to(`empresa_${updateResult.empresa_id}`).emit('ticketUpdated', fullTicket);
         }
       } catch(e) {}
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
    const result: any = await ticketsService.getByIdForUser(id, currentUser);
    if (!result) return sendError(res, 'Ticket não encontrado', 404);
    if (result.error === 'forbidden') return sendError(res, 'Permissão negada', 403);

    const ticket = result;

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

    // Prevent duplicated status loop: If status was sent, we update status separately or ignore it here if we want route separation 
    // We already have a /status route, better to call updateStatus from service here if it was passed, so we notify correctly and then log.
    // However, the rule requested: 'no PATCH /:id, se vier status, chamar updateStatus ou impedir status ali para evitar duplicação'
    let oldStatus = ticket.status;
    let oldResp = ticket.responsavel_id;
    let oldPrio = ticket.prioridade;
    
    // Validations for update
    const validStatuses = ['aberto', 'em_andamento', 'aguardando_cliente', 'resolvido', 'fechado'];
    const validPriorities = ['baixa', 'media', 'alta', 'urgente'];
    
    if (req.body.status && !validStatuses.includes(req.body.status)) return sendError(res, 'Status inválido', 400);
    if (req.body.prioridade && !validPriorities.includes(req.body.prioridade)) return sendError(res, 'Prioridade inválida', 400);
    if (req.body.responsavel_id !== undefined && req.body.responsavel_id !== null) {
      if (!toPositiveInt(req.body.responsavel_id)) return sendError(res, 'Responsável inválido', 400);
      
      const newRespId = toPositiveInt(req.body.responsavel_id);
      if (newRespId) {
        const [respUser]: any = await pool.query('SELECT empresa_id FROM usuarios WHERE id = ?', [newRespId]);
        if (!respUser[0]) return sendError(res, 'Usuário responsável não encontrado', 404);
        if (respUser[0].empresa_id !== ticket.empresa_id && !currentUser.desenvolvedor) {
           return sendError(res, 'O responsável deve pertencer à mesma empresa do chamado', 400);
        }
        if (respUser[0].empresa_id !== ticket.empresa_id && currentUser.desenvolvedor) {
           // Even devs shouldn't cross-assign
           return sendError(res, 'O responsável deve pertencer à mesma empresa do chamado, mesmo sendo desenvolvedor', 400);
        }
      }
    }

    if (req.body.status && req.body.status !== ticket.status) {
       const updateResult = await ticketsService.updateStatus(id, req.body.status, currentUser.id, req);
       if (updateResult && updateResult.oldStatus !== updateResult.newStatus) {
         await logSystemAction(req, currentUser.id, ticket.empresa_id, 'TICKET_STATUS_CHANGE', `Status do chamado #${id} alterado de ${updateResult.oldStatus} para ${updateResult.newStatus}`);
       }
    }
    
    // Always remove status from body so it's not updated twice by ticketsService.update
    if ('status' in req.body) {
       delete req.body.status;
    }

    await ticketsService.update(id, req.body);
    
    let descriptions = [];
    if (req.body.prioridade && req.body.prioridade !== oldPrio) descriptions.push(`prioridade para ${req.body.prioridade}`);
    if (req.body.responsavel_id !== undefined && req.body.responsavel_id !== oldResp) {
       descriptions.push(`responsável atualizado`);
    }

    // Since status logs itself, we only log here if other fields materially changed
    if (descriptions.length > 0) {
      const logMsg = `Atualizou chamado #${id}: ${descriptions.join(', ')}`;
      await logSystemAction(req, currentUser.id, ticket.empresa_id, 'TICKET_UPDATE', logMsg);
    } else if (Object.keys(req.body).length > 0 && !Object.keys(req.body).every(k => k === 'status')) {
      const logMsg = `Atualizou detalhes do chamado #${id}`;
      await logSystemAction(req, currentUser.id, ticket.empresa_id, 'TICKET_UPDATE', logMsg);
    }
    
    try {
      const fullTicket = await ticketsService.getByIdForUser(id, currentUser);
      const io = req.app.get('io');
      if (io && fullTicket) {
        io.to(`empresa_${ticket.empresa_id}`).emit('ticketUpdated', fullTicket);
      }
    } catch(e) {}
    
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
    const result: any = await ticketsService.getByIdForUser(id, currentUser);
    if (!result) return sendError(res, 'Ticket não encontrado', 404);
    if (result.error === 'forbidden') return sendError(res, 'Permissão negada', 403);

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

router.get('/:id/timeline', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);

    const id = parseInt(req.params.id);
    const isAdminOrDev = !!(currentUser.administrador || currentUser.desenvolvedor);
    
    const timeline = await ticketsService.getTimeline(id, isAdminOrDev);
    if (!timeline) return sendError(res, 'Ticket não encontrado', 404);

    sendSuccess(res, timeline);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao carregar linha do tempo';
    sendError(res, message);
  }
});

router.post('/:id/messages', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);

    const id = parseInt(req.params.id);
    
    const result: any = await ticketsService.getByIdForUser(id, currentUser);
    if (!result) return sendError(res, 'Ticket não encontrado', 404);
    if (result.error === 'forbidden') return sendError(res, 'Permissão negada', 403);

    const { mensagem, interno } = req.body;
    
    const isAdminOrDev = currentUser.administrador || currentUser.desenvolvedor;
    
    const ticket = result;
    const messageId = await ticketsService.addMessage({
      ticket_id: id,
      usuario_id: currentUser.id,
      mensagem,
      interno: isAdminOrDev ? interno : false
    });

    await logSystemAction(req, currentUser.id, ticket.empresa_id, 'MESSAGE_SEND', `Nova mensagem no chamado #${id}`);
    
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
    const result: any = await ticketsService.getByIdForUser(id, currentUser);
    if (!result) return sendError(res, 'Ticket não encontrado', 404);
    if (result.error === 'forbidden') return sendError(res, 'Permissão negada', 403);

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

    // Validate mensagem_id belongs to ticket
    if (mensagem_id) {
      const msgIdNum = Number(mensagem_id);
      if (isNaN(msgIdNum)) {
        await attachmentsService.deleteMultiple(files);
        return sendError(res, 'ID da mensagem inválido.', 400);
      }
      
      const [msgRows]: any = await pool.query('SELECT ticket_id FROM ticket_mensagens WHERE id = ?', [msgIdNum]);
      if (msgRows.length === 0 || msgRows[0].ticket_id !== id) {
        await attachmentsService.deleteMultiple(files);
        return sendError(res, 'A mensagem informada não pertence a este ticket.', 400);
      }
    }

    const ticketResult: any = await ticketsService.getByIdForUser(id, currentUser);
    if (!ticketResult) {
      await attachmentsService.deleteMultiple(files);
      return sendError(res, 'Ticket não encontrado', 404);
    }
    if (ticketResult.error === 'forbidden') {
      await attachmentsService.deleteMultiple(files);
      return sendError(res, 'Permissão negada', 403);
    }

    const ticket = ticketResult;

    const isAdminOrDev = !!(currentUser.administrador || currentUser.desenvolvedor);
    const isInternal = isAdminOrDev ? (interno === 'true' || interno === true) : false;

    const createdAttachments = await Promise.all(files.map(async (file) => {
      const attachmentId = await attachmentsService.create({
        ticket_id: id,
        mensagem_id: mensagem_id ? parseInt(mensagem_id) : null,
        usuario_id: currentUser.id,
        empresa_id: ticket.empresa_id,
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

    await logSystemAction(req, currentUser.id, ticket.empresa_id, 'ATTACHMENT_UPLOAD', `Anexo(s) enviado(s) para o chamado #${id}`);

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
