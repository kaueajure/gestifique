import { Router } from 'express';
import  ticketsService, { isValidTicketStatus, toPositiveInt } from  '../services/tickets.service.js';
import  attachmentsService from  '../services/attachments.service.js';
import { authMiddleware, AuthRequest } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permissions.middleware.js';
import { permissionsService } from '../services/permissions.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import  { logSystemAction } from  '../utils/logger.js';
import { ticketUpload } from '../middlewares/upload.js';
import { validateUploadedFile } from '../utils/file-security.js';
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
    'aguardando_cliente',
    'precisa_resposta'
  ];
  return typeof value === 'string' && validQueues.includes(value) ? value : 'todos';
}

const isAgentUser = (user: any) => !!(user.administrador || user.desenvolvedor || user.perfil === 'gestor' || user.perfil === 'atendente');
const canManageTickets = (user: any) => !!(user.administrador || user.desenvolvedor || user.perfil === 'gestor');
const FINAL_TICKET_STATUSES = new Set(['resolvido', 'fechado']);

async function ensureStatusTransitionPermission(res: any, currentUser: any, oldStatus: unknown, newStatus: unknown) {
  const oldValue = String(oldStatus || '');
  const newValue = String(newStatus || '');
  if (!newValue || oldValue === newValue) return null;

  if (FINAL_TICKET_STATUSES.has(oldValue) && !FINAL_TICKET_STATUSES.has(newValue)) {
    const hasReopenPerm = await permissionsService.hasPermission(currentUser, 'tickets.reabrir');
    if (!hasReopenPerm) {
      return sendError(res, 'Acesso proibido: Sem permissao para reabrir chamados (tickets.reabrir).', 403);
    }
  }

  if (newValue === 'resolvido') {
    const hasFinalizePerm = await permissionsService.hasPermission(currentUser, 'tickets.finalizar');
    if (!hasFinalizePerm) {
      return sendError(res, 'Acesso proibido: Sem permissao para finalizar chamados (tickets.finalizar).', 403);
    }
  }

  if (newValue === 'fechado') {
    const hasClosePerm = await permissionsService.hasPermission(currentUser, 'tickets.fechar');
    if (!hasClosePerm) {
      return sendError(res, 'Acesso proibido: Sem permissao para fechar chamados (tickets.fechar).', 403);
    }
  }

  return null;
}

async function hasAnyTicketPermission(currentUser: any, permissionKeys: string[]): Promise<boolean> {
  for (const permissionKey of permissionKeys) {
    if (await permissionsService.hasPermission(currentUser, permissionKey)) return true;
  }
  return false;
}

async function getBulkActionPermissionError(currentUser: any, action: string, value: unknown): Promise<string | null> {
  switch (action) {
    case 'status': {
      const hasStatusPerm = await permissionsService.hasPermission(currentUser, 'tickets.editar_status');
      if (!hasStatusPerm) return 'Acesso proibido: Sem permissao para alterar status em massa (tickets.editar_status).';

      if (value === 'resolvido' && !await permissionsService.hasPermission(currentUser, 'tickets.finalizar')) {
        return 'Acesso proibido: Sem permissao para finalizar chamados em massa (tickets.finalizar).';
      }

      if (value === 'fechado' && !await permissionsService.hasPermission(currentUser, 'tickets.fechar')) {
        return 'Acesso proibido: Sem permissao para fechar chamados em massa (tickets.fechar).';
      }
      return null;
    }
    case 'fechar':
      return await permissionsService.hasPermission(currentUser, 'tickets.fechar')
        ? null
        : 'Acesso proibido: Sem permissao para fechar chamados em massa (tickets.fechar).';
    case 'prioridade':
      return await permissionsService.hasPermission(currentUser, 'tickets.editar_prioridade')
        ? null
        : 'Acesso proibido: Sem permissao para alterar prioridade em massa (tickets.editar_prioridade).';
    case 'responsavel': {
      const wantsRemove = value === null || value === undefined || value === '';
      if (wantsRemove) {
        return await permissionsService.hasPermission(currentUser, 'tickets.remover_responsavel')
          ? null
          : 'Acesso proibido: Sem permissao para remover responsavel em massa (tickets.remover_responsavel).';
      }

      const canAssignResponsavel = await hasAnyTicketPermission(currentUser, [
        'tickets.assumir',
        'tickets.atribuir',
        'tickets.transferir'
      ]);
      return canAssignResponsavel
        ? null
        : 'Acesso proibido: Sem permissao para atribuir responsavel em massa.';
    }
    case 'add_tag':
      return await permissionsService.hasPermission(currentUser, 'tickets.gerenciar_tags')
        ? null
        : 'Acesso proibido: Sem permissao para gerenciar tags em massa (tickets.gerenciar_tags).';
    default:
      return 'Acao invalida';
  }
}

router.use(authMiddleware);

router.get('/options', requirePermission('tickets.visualizar'), async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Nao autenticado', 401);

    const empresaId = currentUser.desenvolvedor
      ? toPositiveInt(req.query.empresa_id) || currentUser.empresa_id
      : currentUser.empresa_id;

    if (!empresaId) {
      return sendSuccess(res, { empresa_id: null, categories: [], services: [] });
    }

    const [categories]: any = await pool.query(
      'SELECT id, nome, sigla, valor, ativo, ordem FROM empresa_ticket_categorias WHERE empresa_id = ? ORDER BY ordem ASC, id ASC',
      [empresaId]
    );
    const [services]: any = await pool.query(
      'SELECT id, nome, valor, ativo, ordem FROM empresa_ticket_servicos WHERE empresa_id = ? ORDER BY ordem ASC, id ASC',
      [empresaId]
    );

    sendSuccess(res, {
      empresa_id: empresaId,
      categories,
      services
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao carregar opcoes de atendimento';
    sendError(res, message);
  }
});

router.post('/:id/read', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);

    const id = parseInt(req.params.id);
    const result: any = await ticketsService.getByIdForUser(id, currentUser);
    
    if (!result) return sendError(res, 'Ticket não encontrado', 404);
    if (result.error === 'forbidden') return sendError(res, 'Permissão negada', 403);

    await ticketsService.markAsRead(id, currentUser.id);
    sendSuccess(res, null, 'Ticket marcado como lido');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao marcar como lido';
    sendError(res, message);
  }
});

router.delete('/cleanup-spam', requirePermission('sistema.executar_manutencao'), async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Nao autenticado', 401);
    if (!currentUser.desenvolvedor) {
      return sendError(res, 'Acesso proibido: manutencao critica e exclusiva para desenvolvedores.', 403);
    }

    const empresaId = toPositiveInt(req.query.empresa_id ?? req.body?.empresa_id);
    if (!empresaId) return sendError(res, 'empresa_id e obrigatorio para limpeza de spam.', 400);

    const result = await ticketsService.cleanupSpam(empresaId);
    await logSystemAction(
      req,
      currentUser.id,
      empresaId,
      'TICKET_CLEANUP_SPAM',
      `Executou limpeza de spam na empresa ID ${empresaId}: ${result.deletedCount} chamados removidos`
    );
    sendSuccess(res, result, 'Limpeza concluída');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro na limpeza';
    sendError(res, message);
  }
});

router.get('/', requirePermission('tickets.visualizar'), async (req: AuthRequest, res) => {
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
      servico: typeof req.query.servico === 'string' && req.query.servico !== 'todos' ? req.query.servico : undefined,
      search: typeof req.query.search === 'string' ? req.query.search.trim() : undefined,
      page: toPositiveInt(req.query.page) ?? 1,
      limit: toPositiveInt(req.query.limit) ?? 15,
      // Advanced Filters
      tag: typeof req.query.tag === 'string' ? req.query.tag : undefined,
      origem: typeof req.query.origem === 'string' ? req.query.origem : undefined,
      created_from: typeof req.query.created_from === 'string' ? req.query.created_from : undefined,
      created_to: typeof req.query.created_to === 'string' ? req.query.created_to : undefined,
      updated_from: typeof req.query.updated_from === 'string' ? req.query.updated_from : undefined,
      updated_to: typeof req.query.updated_to === 'string' ? req.query.updated_to : undefined,
      sla_status: typeof req.query.sla_status === 'string' ? req.query.sla_status as any : undefined,
      custom_field_search: typeof req.query.custom_field_search === 'string' ? req.query.custom_field_search : undefined,
      sort_by: typeof req.query.sort_by === 'string' ? req.query.sort_by : undefined,
      sort_order: req.query.sort_order === 'asc' || req.query.sort_order === 'desc' ? req.query.sort_order : undefined
    };
    const tickets = await ticketsService.list(filters);
    sendSuccess(res, tickets);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao listar tickets';
    sendError(res, message);
  }
});

router.get('/kanban', requirePermission('tickets.visualizar'), async (req: AuthRequest, res) => {
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
          { id: 'resolvido', title: 'Finalizado', count: 0, tickets: [] },
          { id: 'fechado', title: 'Fechado', count: 0, tickets: [] }
        ],
        totals: { total: 0, aberto: 0, em_andamento: 0, aguardando_cliente: 0, resolvido: 0, fechado: 0 },
        queues: { todos: 0, meus: 0, sem_responsavel: 0, urgentes: 0, sla_vencido: 0, vence_em_breve: 0, aguardando_cliente: 0 }
      });
    }

    const responsavelId = toPositiveInt(req.query.responsavel_id);

    const validPriorities = ['baixa', 'media', 'alta', 'urgente', 'todas'];
    
    const status = typeof req.query.status === 'string' && (req.query.status === 'todos' || isValidTicketStatus(req.query.status))
      ? (req.query.status === 'todos' ? undefined : req.query.status) 
      : undefined;
      
    const prioridade = typeof req.query.prioridade === 'string' && validPriorities.includes(req.query.prioridade)
      ? (req.query.prioridade === 'todas' ? undefined : req.query.prioridade)
      : undefined;
      
    const categoria = typeof req.query.categoria === 'string' && req.query.categoria !== 'todas' 
      ? req.query.categoria 
      : undefined;

    const servico = typeof req.query.servico === 'string' && req.query.servico !== 'todos' 
      ? req.query.servico 
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
      servico,
      fila,
      // Advanced Filters
      tag: typeof req.query.tag === 'string' ? req.query.tag : undefined,
      origem: typeof req.query.origem === 'string' ? req.query.origem : undefined,
      created_from: typeof req.query.created_from === 'string' ? req.query.created_from : undefined,
      created_to: typeof req.query.created_to === 'string' ? req.query.created_to : undefined,
      updated_from: typeof req.query.updated_from === 'string' ? req.query.updated_from : undefined,
      updated_to: typeof req.query.updated_to === 'string' ? req.query.updated_to : undefined,
      sla_status: typeof req.query.sla_status === 'string' ? req.query.sla_status as any : undefined,
      custom_field_search: typeof req.query.custom_field_search === 'string' ? req.query.custom_field_search : undefined,
      kanban_limit: toPositiveInt(req.query.kanban_limit)
    };
    
    const kanbanData = await ticketsService.getKanban(filters);
    sendSuccess(res, kanbanData);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao carregar Kanban';
    sendError(res, message);
  }
});

router.patch('/bulk', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);
    
    const hasBulkPerm = await permissionsService.hasPermission(currentUser, 'tickets.acoes_em_massa');
    if (!hasBulkPerm) {
      return sendError(res, 'Acesso proibido: Sem permissão para realizar ações em massa (tickets.acoes_em_massa).', 403);
    }

    const { ticket_ids, action, value } = req.body;

    if (!Array.isArray(ticket_ids) || ticket_ids.length === 0) {
      return sendError(res, 'Nenhum chamado selecionado', 400);
    }

    if (ticket_ids.length > 100) {
      return sendError(res, 'Máximo de 100 chamados por operação', 400);
    }

    const validActions = ['status', 'prioridade', 'responsavel', 'add_tag', 'fechar'];
    if (!validActions.includes(action)) {
      return sendError(res, 'Ação inválida', 400);
    }

    const permissionError = await getBulkActionPermissionError(currentUser, action, value);
    if (permissionError) {
      return sendError(res, permissionError, 403);
    }

    const result = await ticketsService.bulkUpdate({
      ticketIds: ticket_ids,
      action,
      value,
      currentUser
    });

    await logSystemAction(
      req, 
      currentUser.id, 
      currentUser.empresa_id, 
      'TICKET_BULK_ACTION', 
      `Ação em massa (${action}) processada para ${result.updated} chamados (${result.skipped} ignorados)`
    );

    sendSuccess(res, result, 'Ação em massa concluída');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao realizar ação em massa';
    sendError(res, message);
  }
});

// VIEWS ROUTES
router.get('/views', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);
    
    let targetEmpresaId = currentUser.empresa_id || 0;
    
    if (currentUser.desenvolvedor) {
      const queryEmpresaId = toPositiveInt(req.query.empresa_id);
      if (!queryEmpresaId) return sendSuccess(res, []);
      targetEmpresaId = queryEmpresaId;
    }
    
    const views = await ticketsService.getViews(currentUser.id, targetEmpresaId);
    sendSuccess(res, views);
  } catch (error: unknown) {
    sendError(res, 'Erro ao carregar views salvas');
  }
});

router.post('/views', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);
    const { nome, filtros_json } = req.body;
    
    if (!nome) return sendError(res, 'Nome da view é obrigatório', 400);
    if (nome.length > 100) return sendError(res, 'Nome da view muito longo (máx 100 caracteres)', 400);
    if (!filtros_json || typeof filtros_json !== 'object') return sendError(res, 'Filtros inválidos', 400);

    let targetEmpresaId = currentUser.empresa_id;
    
    if (currentUser.desenvolvedor) {
      const bodyEmpresaId = toPositiveInt(req.body.empresa_id);
      if (!bodyEmpresaId) return sendError(res, 'Selecione uma empresa antes de salvar uma view.', 400);
      targetEmpresaId = bodyEmpresaId;
    } else {
      // For non-devs, always use their own company
      if (req.body.empresa_id && Number(req.body.empresa_id) !== currentUser.empresa_id) {
        return sendError(res, 'Você só pode salvar views para sua própria empresa', 403);
      }
    }

    if (!targetEmpresaId) return sendError(res, 'Empresa inválida', 400);

    const viewId = await ticketsService.createView({
      empresa_id: targetEmpresaId,
      usuario_id: currentUser.id,
      nome,
      filtros_json
    });
    sendSuccess(res, { id: viewId }, 'View salva com sucesso');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao salvar view';
    sendError(res, message);
  }
});

router.put('/views/:viewId', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);
    const viewId = parseInt(req.params.viewId);
    await ticketsService.updateView(viewId, req.body, currentUser.id);
    sendSuccess(res, null, 'View atualizada');
  } catch (error: unknown) {
    sendError(res, 'Erro ao atualizar view');
  }
});

router.delete('/views/:viewId', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);
    const viewId = parseInt(req.params.viewId);
    await ticketsService.deleteView(viewId, currentUser.id);
    sendSuccess(res, null, 'View excluída');
  } catch (error: unknown) {
    sendError(res, 'Erro ao excluir view');
  }
});

router.patch('/:id/resolve', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);

    const { status } = req.body;
    const requiredPerm = status === 'fechado' ? 'tickets.fechar' : 'tickets.finalizar';
    const hasResolvePerm = await permissionsService.hasPermission(currentUser, requiredPerm);
    if (!hasResolvePerm) {
      return sendError(res, `Acesso proibido: Você não possui permissão para ${status === 'fechado' ? 'fechar' : 'finalizar'} chamados (${requiredPerm}).`, 403);
    }

    const id = parseInt(req.params.id);
    const ticket: any = await ticketsService.getByIdForUser(id, currentUser);
    if (!ticket) return sendError(res, 'Ticket não encontrado', 404);
    if (ticket.error === 'forbidden') return sendError(res, 'Permissão negada', 403);

    await ticketsService.resolveTicket(id, req.body, currentUser);
    await logSystemAction(req, currentUser.id, ticket.empresa_id, 'TICKET_COMPLETE', `Chamado #${id} marcado como ${req.body.status} (Motivo: ${req.body.resolucao_motivo})`);
    
    sendSuccess(res, null, `Chamado ${req.body.status === 'resolvido' ? 'resolvido' : 'fechado'} com sucesso`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao finalizar ticket';
    sendError(res, message);
  }
});

router.patch('/:id/reopen', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);

    const hasReopenPerm = await permissionsService.hasPermission(currentUser, 'tickets.reabrir');
    if (!hasReopenPerm) {
      return sendError(res, 'Acesso proibido: Sem permissão para reabrir chamados (tickets.reabrir).', 403);
    }

    const id = parseInt(req.params.id);
    const ticket: any = await ticketsService.getByIdForUser(id, currentUser);
    if (!ticket) return sendError(res, 'Ticket não encontrado', 404);
    if (ticket.error === 'forbidden') return sendError(res, 'Permissão negada', 403);

    await ticketsService.reopenTicket(id, currentUser);
    await logSystemAction(req, currentUser.id, ticket.empresa_id, 'TICKET_REOPEN', `Chamado #${id} reaberto para atendimento`);
    
    sendSuccess(res, null, 'Chamado reaberto com sucesso');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao reabrir ticket';
    sendError(res, message);
  }
});

router.get('/:id', requirePermission('tickets.ver_detalhes'), async (req: AuthRequest, res) => {
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

router.post('/', requirePermission('tickets.criar'), async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);

    let { titulo, descricao, prioridade, categoria, servico } = req.body;
    
    // Validations
    if (!titulo || titulo.trim().length < 3) return sendError(res, 'Título obrigatório (min 3 caracteres)', 400);
    if (!descricao || descricao.trim().length < 5) return sendError(res, 'Descrição obrigatória (min 5 caracteres)', 400);

    const validPriorities = ['baixa', 'media', 'alta', 'urgente'];

    if (prioridade && !validPriorities.includes(prioridade)) return sendError(res, 'Prioridade inválida', 400);
    
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
      titulo, descricao, prioridade, categoria, servico
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

    if (!isValidTicketStatus(status)) return sendError(res, 'Status inválido', 400);

    const result: any = await ticketsService.getByIdForUser(id, currentUser);
    if (!result) return sendError(res, 'Ticket não encontrado', 404);
    if (result.error === 'forbidden') return sendError(res, 'Permissão negada', 403);

    const ticket = result;

    const hasStatusPerm = await permissionsService.hasPermission(currentUser, 'tickets.editar_status');
    if (!hasStatusPerm) {
        return sendError(res, 'Acesso proibido: Sem permissão para alterar status (tickets.editar_status).', 403);
    }

    const transitionDenied = await ensureStatusTransitionPermission(res, currentUser, ticket.status, status);
    if (transitionDenied) return transitionDenied;

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

    const canManage = isAgentUser(currentUser);
    if (!canManage && ticket.usuario_id !== currentUser.id) {
        return sendError(res, 'Permissão negada', 403);
    }

    const hasFieldChanged = (field: string) =>
      Object.prototype.hasOwnProperty.call(req.body, field) &&
      String(req.body[field] ?? '') !== String(ticket[field] ?? '');

    const ensureFieldPermission = async (permission: string, message: string) => {
      const allowed = await permissionsService.hasPermission(currentUser, permission);
      return allowed ? null : sendError(res, message, 403);
    };

    if (hasFieldChanged('titulo')) {
      const denied = await ensureFieldPermission(
        'tickets.editar_titulo',
        'Acesso proibido: Sem permissao para editar titulo (tickets.editar_titulo).'
      );
      if (denied) return denied;
    }

    if (hasFieldChanged('descricao')) {
      const denied = await ensureFieldPermission(
        'tickets.editar_descricao',
        'Acesso proibido: Sem permissao para editar descricao (tickets.editar_descricao).'
      );
      if (denied) return denied;
    }

    if (hasFieldChanged('status')) {
      const denied = await ensureFieldPermission(
        'tickets.editar_status',
        'Acesso proibido: Sem permissao para alterar status (tickets.editar_status).'
      );
      if (denied) return denied;

      const transitionDenied = await ensureStatusTransitionPermission(res, currentUser, ticket.status, req.body.status);
      if (transitionDenied) return transitionDenied;
    }

    if (hasFieldChanged('origem')) {
      const denied = await ensureFieldPermission(
        'tickets.editar_origem',
        'Acesso proibido: Sem permissao para editar origem (tickets.editar_origem).'
      );
      if (denied) return denied;
    }

    if (hasFieldChanged('prazo_sla')) {
      const denied = await ensureFieldPermission(
        'tickets.alterar_sla',
        'Acesso proibido: Sem permissao para alterar SLA (tickets.alterar_sla).'
      );
      if (denied) return denied;
    }

    // Validate edit permissions dynamically
    if (req.body.prioridade && req.body.prioridade !== ticket.prioridade) {
       const hasPrioPerm = await permissionsService.hasPermission(currentUser, 'tickets.editar_prioridade');
       if (!hasPrioPerm) {
          return sendError(res, 'Acesso proibido: Sem permissão para editar prioridade (tickets.editar_prioridade).', 403);
       }
    }

    if (req.body.categoria && req.body.categoria !== ticket.categoria) {
       const hasCatPerm = await permissionsService.hasPermission(currentUser, 'tickets.editar_categoria');
       if (!hasCatPerm) {
          return sendError(res, 'Acesso proibido: Sem permissão para editar categoria (tickets.editar_categoria).', 403);
       }
    }

    if (req.body.servico && req.body.servico !== ticket.servico) {
       const hasServPerm = await permissionsService.hasPermission(currentUser, 'tickets.editar_servico');
       if (!hasServPerm) {
          return sendError(res, 'Acesso proibido: Sem permissão para editar serviço (tickets.editar_servico).', 403);
       }
    }

    if (req.body.responsavel_id !== undefined && req.body.responsavel_id !== ticket.responsavel_id) {
       const wantsRemoveResponsavel = req.body.responsavel_id === null || req.body.responsavel_id === '';
       const newRespId = toPositiveInt(req.body.responsavel_id);
       if (wantsRemoveResponsavel) {
          const hasRemovePerm = await permissionsService.hasPermission(currentUser, 'tickets.remover_responsavel');
          if (!hasRemovePerm) {
             return sendError(res, 'Acesso proibido: Sem permissão para remover responsável (tickets.remover_responsavel).', 403);
          }
          req.body.responsavel_id = null;
       } else if (!newRespId) {
          return sendError(res, 'Responsavel invalido', 400);
       } else if (newRespId === currentUser.id) {
          const hasTakePerm = await permissionsService.hasPermission(currentUser, 'tickets.assumir');
          if (!hasTakePerm) {
             return sendError(res, 'Acesso proibido: Sem permissão para assumir chamados (tickets.assumir).', 403);
          }
       } else {
          const isTransfer = ticket.responsavel_id !== null;
          const requiredPerm = isTransfer ? 'tickets.transferir' : 'tickets.atribuir';
          const hasAssignPerm = await permissionsService.hasPermission(currentUser, requiredPerm);
          if (!hasAssignPerm) {
             return sendError(res, `Acesso proibido: Sem permissão para ${isTransfer ? 'transferir' : 'atribuir'} chamados (${requiredPerm}).`, 403);
          }
       }
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
    const validPriorities = ['baixa', 'media', 'alta', 'urgente'];
    
    if (req.body.status && !isValidTicketStatus(req.body.status)) return sendError(res, 'Status inválido', 400);
    if (req.body.prioridade && !validPriorities.includes(req.body.prioridade)) return sendError(res, 'Prioridade inválida', 400);
    if (req.body.responsavel_id !== undefined && req.body.responsavel_id !== null && req.body.responsavel_id !== '') {
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

    await ticketsService.update(id, req.body, currentUser);
    
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

    const canView = await permissionsService.hasPermission(currentUser, 'ticket_mensagens.visualizar');
    if (!canView) return sendError(res, 'Acesso proibido: Sem permissão para visualizar mensagens (ticket_mensagens.visualizar).', 403);

    const hasVerInternos = await permissionsService.hasPermission(currentUser, 'ticket_mensagens.ver_internos');
    const messages = await ticketsService.getMessages(id, hasVerInternos);
    
    const messageIds = (messages as any[]).map((msg: any) => msg.id);
    const attachmentsByMessage = await attachmentsService.getByMessages(messageIds, hasVerInternos, id);
    const messagesWithAttachments = (messages as any[]).map((msg: any) => ({
      ...msg,
      attachments: attachmentsByMessage[msg.id] || []
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

    const result: any = await ticketsService.getByIdForUser(id, currentUser);
    if (!result) return sendError(res, 'Ticket não encontrado', 404);
    if (result.error === 'forbidden') return sendError(res, 'Permissão negada', 403);

    const canView = await permissionsService.hasPermission(currentUser, 'ticket_mensagens.visualizar');
    if (!canView) return sendError(res, 'Acesso proibido: Sem permissão para visualizar timeline (ticket_mensagens.visualizar).', 403);

    const hasVerInternos = await permissionsService.hasPermission(currentUser, 'ticket_mensagens.ver_internos');
    
    const timeline = await ticketsService.getTimeline(id, hasVerInternos);
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
    const { mensagem, interno } = req.body;
    
    const isAgent = isAgentUser(currentUser);
    const isInternalCom = isAgent ? !!interno : false;

    const ticketResult: any = await ticketsService.getByIdForUser(id, currentUser);
    if (!ticketResult) return sendError(res, 'Ticket nÃ£o encontrado', 404);
    if (ticketResult.error === 'forbidden') return sendError(res, 'PermissÃ£o negada', 403);

    if (isInternalCom) {
       const hasComPerm = await permissionsService.hasPermission(currentUser, 'ticket_mensagens.comentar_interno');
       if (!hasComPerm) {
         return sendError(res, 'Acesso proibido: Sem permissão para enviar comentários internos (ticket_mensagens.comentar_interno).', 403);
       }
    } else {
       const hasRespPerm = await permissionsService.hasPermission(currentUser, 'ticket_mensagens.responder');
       if (!hasRespPerm) {
         return sendError(res, 'Acesso proibido: Sem permissão para responder chamados (ticket_mensagens.responder).', 403);
       }
    }
    
    // Using TicketMessagesService via ticketsService (already updated)
    const messageId = await ticketsService.addMessage({
      ticket_id: id,
      usuario_id: currentUser.id,
      mensagem,
      interno: isInternalCom
    }, currentUser);

    const empresaId = ticketResult.empresa_id || currentUser.empresa_id;

    await logSystemAction(req, currentUser.id, empresaId, 'MESSAGE_SEND', `Nova mensagem no chamado #${id}`);
    
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

    const hasVerInternos = await permissionsService.hasPermission(currentUser, 'ticket_mensagens.ver_internos');
    const attachments = await attachmentsService.listByTicket(id, hasVerInternos);
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
      if (files && files.length > 0) {
        await attachmentsService.deleteMultiple(files);
      }
      return sendError(res, 'Não autenticado', 401);
    }

    const hasAttachPerm = await permissionsService.hasPermission(currentUser, 'ticket_mensagens.anexar');
    if (!hasAttachPerm) {
      if (files && files.length > 0) {
        await attachmentsService.deleteMultiple(files);
      }
      return sendError(res, 'Acesso proibido: Você não possui a permissão ticket_mensagens.anexar.', 403);
    }

    const id = parseInt(req.params.id);
    const { mensagem_id, interno } = req.body;

    if (!files || files.length === 0) {
      return sendError(res, 'Nenhum arquivo enviado', 400);
    }

    for (const file of files) {
      const validation = await validateUploadedFile(file);
      if (!validation.ok) {
        await attachmentsService.deleteMultiple(files);
        return sendError(res, validation.error, 400);
      }
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

    const isAgent = isAgentUser(currentUser);
    const isInternal = isAgent ? (interno === 'true' || interno === true) : false;
    if (isInternal) {
      const hasInternalPerm = await permissionsService.hasPermission(currentUser, 'ticket_mensagens.comentar_interno');
      if (!hasInternalPerm) {
        await attachmentsService.deleteMultiple(files);
        return sendError(res, 'Acesso proibido: Sem permissao para enviar anexos internos.', 403);
      }
    }

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

    // Real-time update via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.to(`empresa_${ticket.empresa_id}`).emit('ticketMessagesChanged', {
        ticketId: id,
        empresaId: ticket.empresa_id
      });
    }

    sendSuccess(res, createdAttachments, 'Arquivos enviados com sucesso', 201);
  } catch (error: unknown) {
    if (files && files.length > 0) {
      await attachmentsService.deleteMultiple(files);
    }
    const message = error instanceof Error ? error.message : 'Erro ao enviar anexos';
    sendError(res, message);
  }
});

// TAGS ROUTES
router.get('/:id/tags', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);

    const id = parseInt(req.params.id);
    const result: any = await ticketsService.getByIdForUser(id, currentUser);
    
    if (!result) return sendError(res, 'Ticket não encontrado', 404);
    if (result.error === 'forbidden') return sendError(res, 'Permissão negada', 403);

    const tags = await ticketsService.getTags(id);
    sendSuccess(res, tags);
  } catch (error: unknown) {
    sendError(res, 'Erro ao buscar tags');
  }
});

router.post('/:id/tags', requirePermission('tickets.gerenciar_tags'), async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);

    const id = parseInt(req.params.id);
    const { tag } = req.body;
    if (!tag) return sendError(res, 'Tag é obrigatória', 400);

    const result: any = await ticketsService.getByIdForUser(id, currentUser);
    if (!result) return sendError(res, 'Ticket não encontrado', 404);
    if (result.error === 'forbidden') return sendError(res, 'Permissão negada', 403);

    await ticketsService.addTag(id, tag);
    await logSystemAction(req, currentUser.id, result.empresa_id, 'TICKET_TAG_ADD', `Tag "${tag}" adicionada ao chamado #${id}`);
    sendSuccess(res, null, 'Tag adicionada');
  } catch (error: unknown) {
    sendError(res, 'Erro ao adicionar tag');
  }
});

router.put('/:id/tags', requirePermission('tickets.gerenciar_tags'), async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);

    const id = parseInt(req.params.id);
    const { tags } = req.body;
    if (!Array.isArray(tags)) return sendError(res, 'Tags devem ser um array', 400);

    const result: any = await ticketsService.getByIdForUser(id, currentUser);
    if (!result) return sendError(res, 'Ticket não encontrado', 404);
    if (result.error === 'forbidden') return sendError(res, 'Permissão negada', 403);

    await ticketsService.setTags(id, tags);
    await logSystemAction(req, currentUser.id, result.empresa_id, 'TICKET_TAGS_UPDATE', `Tags do chamado #${id} atualizadas: ${tags.join(', ')}`);
    sendSuccess(res, null, 'Tags updated');
  } catch (error: unknown) {
    sendError(res, 'Erro ao atualizar tags');
  }
});

router.delete('/:id/tags/:tag', requirePermission('tickets.gerenciar_tags'), async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);

    const id = parseInt(req.params.id);
    const { tag } = req.params;

    const result: any = await ticketsService.getByIdForUser(id, currentUser);
    if (!result) return sendError(res, 'Ticket não encontrado', 404);
    if (result.error === 'forbidden') return sendError(res, 'Permissão negada', 403);

    await ticketsService.removeTag(id, tag);
    await logSystemAction(req, currentUser.id, result.empresa_id, 'TICKET_TAG_REMOVE', `Tag "${tag}" removida do chamado #${id}`);
    sendSuccess(res, null, 'Tag removida');
  } catch (error: unknown) {
    sendError(res, 'Erro ao remover tag');
  }
});

// CUSTOM FIELDS ROUTES
router.get('/:id/custom-fields', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);

    const id = parseInt(req.params.id);
    const result: any = await ticketsService.getByIdForUser(id, currentUser);
    if (!result) return sendError(res, 'Ticket não encontrado', 404);
    if (result.error === 'forbidden') return sendError(res, 'Permissão negada', 403);

    const fields = await ticketsService.getCustomFields(id);
    sendSuccess(res, fields);
  } catch (error: unknown) {
    sendError(res, 'Erro ao buscar campos personalizados');
  }
});

router.put('/:id/custom-fields', requirePermission('tickets.editar'), async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);

    const id = parseInt(req.params.id);
    const { fields } = req.body;
    if (!Array.isArray(fields)) return sendError(res, 'Campos devem ser um array', 400);

    const result: any = await ticketsService.getByIdForUser(id, currentUser);
    if (!result) return sendError(res, 'Ticket não encontrado', 404);
    if (result.error === 'forbidden') return sendError(res, 'Permissão negada', 403);

    await ticketsService.setCustomFields(id, fields);
    await logSystemAction(req, currentUser.id, result.empresa_id, 'TICKET_CUSTOM_FIELDS_UPDATE', `Campos personalizados do chamado #${id} atualizados`);
    sendSuccess(res, null, 'Campos personalizados atualizados');
  } catch (error: unknown) {
    sendError(res, 'Erro ao atualizar campos personalizados');
  }
});

export default router;
