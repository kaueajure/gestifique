import { Router } from 'express';
import  companiesService from  '../services/companies.service.js';
import  { authMiddleware, AuthRequest } from  '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permissions.middleware.js';
import { permissionsService } from '../services/permissions.service.js';
import  { sendSuccess, sendError } from  '../utils/response.js';
import  { logSystemAction } from  '../utils/logger.js';
import { isValidEmail, isValidHexColor } from '../utils/validators.js';
import { isValidTicketStatus } from '../services/tickets.service.js';

const router = Router();

router.use(authMiddleware);

// Listar e Criar empresas
router.get('/', requirePermission('empresas.visualizar'), async (req: AuthRequest, res) => {
  try {
    const { search, status } = req.query;
    const companies = await companiesService.list({ 
      search: search as string, 
      status: status as string 
    });
    sendSuccess(res, companies);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao listar empresas';
    sendError(res, message);
  }
});

router.post('/', requirePermission('empresas.criar'), async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);

    const { nome, email, email_suporte, cor_principal } = req.body;
    if (!nome) return sendError(res, 'Nome é obrigatório', 400);

    if (email_suporte && !isValidEmail(email_suporte)) return sendError(res, 'E-mail de suporte inválido', 400);

    if (email && !isValidEmail(email)) return sendError(res, 'Email institucional inválido', 400);
    if (cor_principal && !isValidHexColor(cor_principal)) return sendError(res, 'Cor principal inválida (formato #RRGGBB)', 400);

    const id = await companiesService.create(req.body);
    await logSystemAction(req, currentUser.id, null, 'COMPANY_CREATE', `Criou empresa: ${nome}`);
    sendSuccess(res, { id }, 'Empresa criada com sucesso', 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao criar empresa';
    sendError(res, message);
  }
});

// Update company
router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);

    const id = parseInt(req.params.id);
    
    const hasEditPerm = await permissionsService.hasPermission(currentUser, 'empresas.editar');
    if (!hasEditPerm) {
      return sendError(res, 'Acesso negado', 403);
    }

    if (!currentUser.desenvolvedor && currentUser.empresa_id !== id) {
      return sendError(res, 'Acesso negado: Você só pode atualizar a sua própria empresa.', 403);
    }

    const { email, email_suporte, cor_principal } = req.body;
    
    if (email_suporte !== undefined && email_suporte !== '') {
      if (!isValidEmail(email_suporte)) return sendError(res, 'E-mail de suporte inválido', 400);
    }
    
    if (email && !isValidEmail(email)) return sendError(res, 'Email institucional inválido', 400);
    if (cor_principal && !isValidHexColor(cor_principal)) return sendError(res, 'Cor principal inválida (formato #RRGGBB)', 400);

    await companiesService.update(id, req.body);
    await logSystemAction(req, currentUser.id, id, 'COMPANY_UPDATE', `Atualizou informações da empresa ID: ${id}`);
    sendSuccess(res, null, 'Empresa atualizada com sucesso');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar empresa';
    sendError(res, message);
  }
});

import  pool from  '../db/connection.js';

router.patch('/:id/status', requirePermission('empresas.desativar'), async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);

    const id = parseInt(req.params.id);
    const { ativo } = req.body;
    await companiesService.update(id, { ativo });
    await logSystemAction(req, currentUser.id, null, 'COMPANY_STATUS', `${ativo ? 'Ativou' : 'Desativou'} empresa ID ${id}`);
    sendSuccess(res, null, `Empresa ${ativo ? 'ativada' : 'desativada'} com sucesso`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao alterar status da empresa';
    sendError(res, message);
  }
});

router.delete('/:id', requirePermission('empresas.excluir'), async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);

    const id = parseInt(req.params.id);
    if (!id || isNaN(id)) return sendError(res, 'ID inválido', 400);

    await companiesService.deleteCascade(id, currentUser);
    await logSystemAction(req, currentUser.id, null, 'COMPANY_DELETE', `Excluiu empresa ID ${id} e todos os seus dados vinculados`);
    
    sendSuccess(res, null, 'Empresa e todos os seus dados foram excluídos com sucesso');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao excluir empresa';
    sendError(res, message);
  }
});

// Settings: Ticket Categories
router.get('/:id/ticket-categories', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);
    const id = parseInt(req.params.id);
    if (!currentUser.desenvolvedor && currentUser.empresa_id !== id) return sendError(res, 'Acesso negado', 403);
    
    // Everyone in company can list categories
    const [rows]: any = await pool.query('SELECT * FROM empresa_ticket_categorias WHERE empresa_id = ? ORDER BY ordem ASC, id ASC', [id]);
    sendSuccess(res, rows);
  } catch(error: unknown) {
    sendError(res, 'Erro ao buscar categorias');
  }
});

router.post('/:id/ticket-categories', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);
    const id = parseInt(req.params.id);
    const hasConfigPerm = await permissionsService.hasPermission(currentUser, 'empresas.gerenciar_configuracoes');
    if (!hasConfigPerm) return sendError(res, 'Acesso negado', 403);
    if (!currentUser.desenvolvedor && currentUser.empresa_id !== id) return sendError(res, 'Acesso negado', 403);
    
    const { nome, valor, ativo, ordem } = req.body;
    if (!nome || !valor) return sendError(res, 'Nome e valor são obrigatórios', 400);

    const [result]: any = await pool.query(
      'INSERT INTO empresa_ticket_categorias (empresa_id, nome, valor, ativo, ordem) VALUES (?, ?, ?, ?, ?)',
      [id, nome, valor, ativo !== undefined ? ativo : 1, ordem || 0]
    );
    sendSuccess(res, { id: result.insertId });
  } catch(error: unknown) {
    sendError(res, 'Erro ao criar categoria. Tente usar um valor único.');
  }
});

router.patch('/:id/ticket-categories/:catId', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);
    const id = parseInt(req.params.id);
    const catId = parseInt(req.params.catId);
    const hasConfigPerm = await permissionsService.hasPermission(currentUser, 'empresas.gerenciar_configuracoes');
    if (!hasConfigPerm) return sendError(res, 'Acesso negado', 403);
    if (!currentUser.desenvolvedor && currentUser.empresa_id !== id) return sendError(res, 'Acesso negado', 403);
    
    const { nome, valor, ativo, ordem } = req.body;
    let updates = [];
    let params = [];
    if (nome !== undefined) { updates.push('nome = ?'); params.push(nome); }
    if (valor !== undefined) { updates.push('valor = ?'); params.push(valor); }
    if (ativo !== undefined) { updates.push('ativo = ?'); params.push(ativo); }
    if (ordem !== undefined) { updates.push('ordem = ?'); params.push(ordem); }

    if (updates.length > 0) {
      params.push(id, catId);
      await pool.query(`UPDATE empresa_ticket_categorias SET ${updates.join(', ')} WHERE empresa_id = ? AND id = ?`, params);
    }
    sendSuccess(res, null);
  } catch(error: unknown) {
    sendError(res, 'Erro ao atualizar categoria');
  }
});

router.delete('/:id/ticket-categories/:catId', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);
    const id = parseInt(req.params.id);
    const catId = parseInt(req.params.catId);
    const hasConfigPerm = await permissionsService.hasPermission(currentUser, 'empresas.gerenciar_configuracoes');
    if (!hasConfigPerm) return sendError(res, 'Acesso negado', 403);
    if (!currentUser.desenvolvedor && currentUser.empresa_id !== id) return sendError(res, 'Acesso negado', 403);
    
    await pool.query('DELETE FROM empresa_ticket_categorias WHERE empresa_id = ? AND id = ?', [id, catId]);
    sendSuccess(res, null);
  } catch(error: unknown) {
    sendError(res, 'Erro ao deletar categoria');
  }
});

// Settings: Ticket Services
router.get('/:id/ticket-services', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);
    const id = parseInt(req.params.id);
    if (!currentUser.desenvolvedor && currentUser.empresa_id !== id) return sendError(res, 'Acesso negado', 403);
    
    // Everyone in company can list services
    const [rows]: any = await pool.query('SELECT * FROM empresa_ticket_servicos WHERE empresa_id = ? ORDER BY ordem ASC, id ASC', [id]);
    sendSuccess(res, rows);
  } catch(error: unknown) {
    sendError(res, 'Erro ao buscar servicos');
  }
});

router.post('/:id/ticket-services', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);
    const id = parseInt(req.params.id);
    const hasConfigPerm = await permissionsService.hasPermission(currentUser, 'empresas.gerenciar_configuracoes');
    if (!hasConfigPerm) return sendError(res, 'Acesso negado', 403);
    if (!currentUser.desenvolvedor && currentUser.empresa_id !== id) return sendError(res, 'Acesso negado', 403);
    
    const { nome, valor, ativo, ordem } = req.body;
    if (!nome || !valor) return sendError(res, 'Nome e valor são obrigatórios', 400);

    const [result]: any = await pool.query(
      'INSERT INTO empresa_ticket_servicos (empresa_id, nome, valor, ativo, ordem) VALUES (?, ?, ?, ?, ?)',
      [id, nome, valor, ativo !== undefined ? ativo : 1, ordem || 0]
    );
    sendSuccess(res, { id: result.insertId });
  } catch(error: unknown) {
    sendError(res, 'Erro ao criar serviço. Tente usar um valor único.');
  }
});

router.patch('/:id/ticket-services/:servId', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);
    const id = parseInt(req.params.id);
    const servId = parseInt(req.params.servId);
    const hasConfigPerm = await permissionsService.hasPermission(currentUser, 'empresas.gerenciar_configuracoes');
    if (!hasConfigPerm) return sendError(res, 'Acesso negado', 403);
    if (!currentUser.desenvolvedor && currentUser.empresa_id !== id) return sendError(res, 'Acesso negado', 403);
    
    const { nome, valor, ativo, ordem } = req.body;
    let updates = [];
    let params = [];
    if (nome !== undefined) { updates.push('nome = ?'); params.push(nome); }
    if (valor !== undefined) { updates.push('valor = ?'); params.push(valor); }
    if (ativo !== undefined) { updates.push('ativo = ?'); params.push(ativo); }
    if (ordem !== undefined) { updates.push('ordem = ?'); params.push(ordem); }

    if (updates.length > 0) {
      params.push(id, servId);
      await pool.query(`UPDATE empresa_ticket_servicos SET ${updates.join(', ')} WHERE empresa_id = ? AND id = ?`, params);
    }
    sendSuccess(res, null);
  } catch(error: unknown) {
    sendError(res, 'Erro ao atualizar serviço');
  }
});

router.delete('/:id/ticket-services/:servId', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);
    const id = parseInt(req.params.id);
    const servId = parseInt(req.params.servId);
    const hasConfigPerm = await permissionsService.hasPermission(currentUser, 'empresas.gerenciar_configuracoes');
    if (!hasConfigPerm) return sendError(res, 'Acesso negado', 403);
    if (!currentUser.desenvolvedor && currentUser.empresa_id !== id) return sendError(res, 'Acesso negado', 403);
    
    await pool.query('DELETE FROM empresa_ticket_servicos WHERE empresa_id = ? AND id = ?', [id, servId]);
    sendSuccess(res, null);
  } catch(error: unknown) {
    sendError(res, 'Erro ao deletar serviço');
  }
});

// Settings: Ticket Status Workflow
router.get('/:id/ticket-statuses', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);
    const id = parseInt(req.params.id);
    if (!currentUser.desenvolvedor && currentUser.empresa_id !== id) return sendError(res, 'Acesso negado', 403);

    const [rows]: any = await pool.query(
      'SELECT id, nome, valor, ativo, ordem FROM empresa_ticket_status WHERE empresa_id = ? ORDER BY ordem ASC, id ASC',
      [id]
    );
    sendSuccess(res, rows);
  } catch(error: unknown) {
    sendError(res, 'Erro ao buscar tipos de atendimento');
  }
});

router.put('/:id/ticket-statuses', async (req: AuthRequest, res) => {
  const connection = await pool.getConnection();
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);
    const id = parseInt(req.params.id);
    const hasConfigPerm = await permissionsService.hasPermission(currentUser, 'empresas.gerenciar_configuracoes');
    if (!hasConfigPerm) return sendError(res, 'Acesso negado', 403);
    if (!currentUser.desenvolvedor && currentUser.empresa_id !== id) return sendError(res, 'Acesso negado', 403);

    const statuses = Array.isArray(req.body?.statuses) ? req.body.statuses : null;
    if (!statuses) return sendError(res, 'Lista de tipos inválida', 400);
    if (statuses.length > 40) return sendError(res, 'Máximo de 40 tipos de atendimento', 400);

    const seen = new Set<string>();
    const sanitized = statuses.map((status: any, index: number) => {
      const nome = typeof status.label === 'string'
        ? status.label.trim()
        : typeof status.nome === 'string'
          ? status.nome.trim()
          : '';
      const valor = typeof status.id === 'string'
        ? status.id.trim()
        : typeof status.valor === 'string'
          ? status.valor.trim()
          : '';
      const ativo = status.visible === undefined ? Number(status.ativo ?? 1) : status.visible ? 1 : 0;

      if (!nome || nome.length > 100) throw new Error('Nome de tipo inválido');
      if (!isValidTicketStatus(valor)) throw new Error(`Identificador de tipo inválido: ${valor}`);
      if (seen.has(valor)) throw new Error(`Tipo duplicado: ${valor}`);
      seen.add(valor);

      return { nome, valor, ativo, ordem: index };
    });

    await connection.beginTransaction();
    await connection.query('DELETE FROM empresa_ticket_status WHERE empresa_id = ?', [id]);

	    for (const status of sanitized) {
	      await connection.query(
	        'INSERT INTO empresa_ticket_status (empresa_id, nome, valor, ativo, ordem) VALUES (?, ?, ?, ?, ?)',
	        [id, status.nome, status.valor, status.ativo, status.ordem]
	      );
	    }

	    if (sanitized.length > 0) {
	      const configuredStatusValues = sanitized.map((status) => status.valor);
	      const fallbackStatus = configuredStatusValues[0];
	      const placeholders = configuredStatusValues.map(() => '?').join(', ');

	      await connection.query(
	        `UPDATE tickets
	         SET status = ?, updated_at = NOW()
	         WHERE empresa_id = ?
	         AND status NOT IN (${placeholders})`,
	        [fallbackStatus, id, ...configuredStatusValues]
	      );
	    }
	
	    await connection.commit();

    const [rows]: any = await pool.query(
      'SELECT id, nome, valor, ativo, ordem FROM empresa_ticket_status WHERE empresa_id = ? ORDER BY ordem ASC, id ASC',
      [id]
    );
    sendSuccess(res, rows);
  } catch(error: unknown) {
    await connection.rollback();
    const message = error instanceof Error ? error.message : 'Erro ao salvar tipos de atendimento';
    sendError(res, message, 400);
  } finally {
    connection.release();
  }
});

router.get('/:id/sla-policies', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);
    const id = parseInt(req.params.id);
    if (!currentUser.desenvolvedor && currentUser.empresa_id !== id) return sendError(res, 'Acesso negado', 403);
    
    const [rows] = await pool.query('SELECT * FROM empresa_sla_politicas WHERE empresa_id = ? ORDER BY ordem ASC', [id]);
    sendSuccess(res, rows);
  } catch (error: unknown) {
    sendError(res, 'Erro ao buscar políticas de SLA');
  }
});

router.post('/:id/sla-policies', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);
    const id = parseInt(req.params.id);
    const hasConfigPerm = await permissionsService.hasPermission(currentUser, 'empresas.gerenciar_configuracoes');
    if (!hasConfigPerm) return sendError(res, 'Acesso negado', 403);
    if (!currentUser.desenvolvedor && currentUser.empresa_id !== id) return sendError(res, 'Acesso negado', 403);
    
    const { nome, prioridade, categoria, servico, tempo_primeira_resposta_minutos, tempo_resolucao_minutos, ativo, ordem } = req.body;
    
    const [result]: any = await pool.query(
      'INSERT INTO empresa_sla_politicas (empresa_id, nome, prioridade, categoria, servico, tempo_primeira_resposta_minutos, tempo_resolucao_minutos, ativo, ordem) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, nome, prioridade || null, categoria || null, servico || null, tempo_primeira_resposta_minutos || null, tempo_resolucao_minutos || 24 * 60, ativo !== undefined ? ativo : 1, ordem || 0]
    );
    sendSuccess(res, { id: result.insertId });
  } catch (error: unknown) {
    sendError(res, 'Erro ao criar política de SLA');
  }
});

router.patch('/:id/sla-policies/:policyId', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);
    const id = parseInt(req.params.id);
    const policyId = parseInt(req.params.policyId);
    const hasConfigPerm = await permissionsService.hasPermission(currentUser, 'empresas.gerenciar_configuracoes');
    if (!hasConfigPerm) return sendError(res, 'Acesso negado', 403);
    if (!currentUser.desenvolvedor && currentUser.empresa_id !== id) return sendError(res, 'Acesso negado', 403);
    
    const { nome, prioridade, categoria, servico, tempo_primeira_resposta_minutos, tempo_resolucao_minutos, ativo, ordem } = req.body;
    
    await pool.query(
      'UPDATE empresa_sla_politicas SET nome = ?, prioridade = ?, categoria = ?, servico = ?, tempo_primeira_resposta_minutos = ?, tempo_resolucao_minutos = ?, ativo = ?, ordem = ? WHERE id = ? AND empresa_id = ?',
      [nome, prioridade || null, categoria || null, servico || null, tempo_primeira_resposta_minutos || null, tempo_resolucao_minutos || 24 * 60, ativo !== undefined ? ativo : 1, ordem || 0, policyId, id]
    );
    sendSuccess(res, { success: true });
  } catch (error: unknown) {
    sendError(res, 'Erro ao atualizar política de SLA');
  }
});

router.delete('/:id/sla-policies/:policyId', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);
    const id = parseInt(req.params.id);
    const policyId = parseInt(req.params.policyId);
    const hasConfigPerm = await permissionsService.hasPermission(currentUser, 'empresas.gerenciar_configuracoes');
    if (!hasConfigPerm) return sendError(res, 'Acesso negado', 403);
    if (!currentUser.desenvolvedor && currentUser.empresa_id !== id) return sendError(res, 'Acesso negado', 403);
    
    await pool.query('DELETE FROM empresa_sla_politicas WHERE id = ? AND empresa_id = ?', [policyId, id]);
    sendSuccess(res, { success: true });
  } catch (error: unknown) {
    sendError(res, 'Erro ao deletar política de SLA');
  }
});

export default router;
