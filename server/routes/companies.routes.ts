import { Router } from 'express';
import  companiesService from  '../services/companies.service.js';
import  { authMiddleware, AuthRequest } from  '../middlewares/auth.js';
import { isDev, isAdmin } from  '../middlewares/permissions.js';
import  { sendSuccess, sendError } from  '../utils/response.js';
import  { logSystemAction } from  '../utils/logger.js';
import { isValidEmail, isValidHexColor } from '../utils/validators.js';

const router = Router();

router.use(authMiddleware);

// Listar e Criar empresas apenas para Devs
router.get('/', isDev, async (req: AuthRequest, res) => {
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

router.post('/', isDev, async (req: AuthRequest, res) => {
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

// Update company: Devs can update any, Admins only their own
router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);

    const id = parseInt(req.params.id);
    
    if (!currentUser.desenvolvedor) {
      if (!currentUser.administrador || currentUser.empresa_id !== id) {
        return sendError(res, 'Acesso negado', 403);
      }
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

router.patch('/:id/status', isDev, async (req: AuthRequest, res) => {
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
    if (!currentUser.desenvolvedor && (!currentUser.administrador || currentUser.empresa_id !== id)) return sendError(res, 'Acesso negado', 403);
    
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
    if (!currentUser.desenvolvedor && (!currentUser.administrador || currentUser.empresa_id !== id)) return sendError(res, 'Acesso negado', 403);
    
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
    if (!currentUser.desenvolvedor && (!currentUser.administrador || currentUser.empresa_id !== id)) return sendError(res, 'Acesso negado', 403);
    
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
    if (!currentUser.desenvolvedor && (!currentUser.administrador || currentUser.empresa_id !== id)) return sendError(res, 'Acesso negado', 403);
    
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
    if (!currentUser.desenvolvedor && (!currentUser.administrador || currentUser.empresa_id !== id)) return sendError(res, 'Acesso negado', 403);
    
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
    if (!currentUser.desenvolvedor && (!currentUser.administrador || currentUser.empresa_id !== id)) return sendError(res, 'Acesso negado', 403);
    
    await pool.query('DELETE FROM empresa_ticket_servicos WHERE empresa_id = ? AND id = ?', [id, servId]);
    sendSuccess(res, null);
  } catch(error: unknown) {
    sendError(res, 'Erro ao deletar serviço');
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
    if (!currentUser.desenvolvedor && (!currentUser.administrador || currentUser.empresa_id !== id)) return sendError(res, 'Acesso negado', 403);
    
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
    if (!currentUser.desenvolvedor && (!currentUser.administrador || currentUser.empresa_id !== id)) return sendError(res, 'Acesso negado', 403);
    
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
    if (!currentUser.desenvolvedor && (!currentUser.administrador || currentUser.empresa_id !== id)) return sendError(res, 'Acesso negado', 403);
    
    await pool.query('DELETE FROM empresa_sla_politicas WHERE id = ? AND empresa_id = ?', [policyId, id]);
    sendSuccess(res, { success: true });
  } catch (error: unknown) {
    sendError(res, 'Erro ao deletar política de SLA');
  }
});

export default router;
