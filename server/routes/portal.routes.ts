import { Router } from 'express';
import pool from '../db/connection.js';
import { authMiddleware } from '../middlewares/auth.js';
import { sendError } from '../utils/response.js';
import ticketsService from '../services/tickets.service.js';

const router = Router();
router.use(authMiddleware);

// Middleware apenas para clientes ou usuários da própria empresa
const requirePortalAccess = (req: any, res: any, next: any) => {
  if (!req.user.empresa_id) {
    return sendError(res, 'Conta sem empresa vinculada', 403);
  }
  next();
};

router.use(requirePortalAccess);

router.get('/tickets', async (req: any, res: any) => {
  try {
    const limit = req.query.limit ? `LIMIT ${Number(req.query.limit)}` : '';
    // Clientes só veem os próprios tickets
    const [rows] = await pool.query(`
      SELECT id, titulo, status, categoria, servico, prioridade, created_at, updated_at
      FROM tickets
      WHERE usuario_id = ?
      ORDER BY updated_at DESC
      ${limit}
    `, [req.user.id]);
    res.json(rows);
  } catch (error) {
    sendError(res, 'Erro ao buscar chamados', 500);
  }
});

router.get('/tickets/:id', async (req: any, res: any) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT id, titulo, descricao, status, categoria, servico, prioridade, created_at, updated_at
      FROM tickets
      WHERE id = ? AND usuario_id = ?
    `, [req.params.id, req.user.id]);

    if (!rows.length) return sendError(res, 'Chamado não encontrado', 404);
    res.json(rows[0]);
  } catch (error) {
    sendError(res, 'Erro ao buscar chamado', 500);
  }
});

router.get('/tickets/:id/messages', async (req: any, res: any) => {
  try {
    // Verifica se o ticket é do usuario
    const [ticketRows]: any = await pool.query('SELECT id FROM tickets WHERE id = ? AND usuario_id = ?', [req.params.id, req.user.id]);
    if (!ticketRows.length) return sendError(res, 'Chamado não encontrado', 404);

    const [rows] = await pool.query(`
      SELECT m.*, u.nome as usuario_nome 
      FROM ticket_mensagens m
      LEFT JOIN usuarios u ON m.usuario_id = u.id
      WHERE m.ticket_id = ? AND m.interno = 0
      ORDER BY m.created_at ASC
    `, [req.params.id]);
    
    res.json(rows);
  } catch (error) {
    sendError(res, 'Erro ao buscar mensagens', 500);
  }
});

router.post('/tickets', async (req: any, res: any) => {
  const { titulo, descricao, categoria, servico } = req.body;
  
  if (!titulo || !descricao) {
    return sendError(res, 'Título e descrição são obrigatórios', 400);
  }

  try {
    const ticketId = await ticketsService.create({
      empresa_id: req.user.empresa_id,
      usuario_id: req.user.id,
      titulo,
      descricao,
      categoria: categoria || 'geral',
      servico: servico || null,
      prioridade: 'media',
      origem: 'portal'
    });

    res.status(201).json({ message: 'Chamado criado com sucesso', ticketId });
  } catch (error) {
    console.error('[Portal] Erro ao criar ticket:', error);
    sendError(res, 'Erro ao criar chamado', 500);
  }
});

router.post('/tickets/:id/messages', async (req: any, res: any) => {
  const { mensagem } = req.body;
  if (!mensagem) return sendError(res, 'Mensagem vazia', 400);

  try {
    const messageId = await ticketsService.addMessage({
      ticket_id: Number(req.params.id),
      usuario_id: req.user.id,
      mensagem,
      interno: false
    }, req.user);

    res.status(201).json({ success: true, message: 'Mensagem enviada com sucesso', messageId });
  } catch (error: any) {
    console.error('[Portal] Erro ao enviar mensagem:', error);
    sendError(res, error.message || 'Erro ao enviar mensagem', 500);
  }
});

router.get('/knowledge', async (req: any, res: any) => {
  try {
    const { category } = req.query;
    let query = `
      SELECT id, titulo, conteudo, categoria, created_at
      FROM knowledge_articles
      WHERE ativo = 1 AND publico = 1 AND empresa_id = ?
    `;
    const params: any[] = [req.user.empresa_id];

    if (category) {
      query += ' AND categoria = ?';
      params.push(category);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    sendError(res, 'Erro ao buscar artigos', 500);
  }
});

router.get('/knowledge/categories', async (req: any, res: any) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT DISTINCT categoria
      FROM knowledge_articles
      WHERE ativo = 1 AND publico = 1 AND empresa_id = ? AND categoria IS NOT NULL
      ORDER BY categoria ASC
    `, [req.user.empresa_id]);
    res.json(rows.map((row: any) => row.categoria));
  } catch (error) {
    sendError(res, 'Erro ao buscar categorias', 500);
  }
});

router.get('/knowledge/article/:id', async (req: any, res: any) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT *
      FROM knowledge_articles
      WHERE id = ? AND ativo = 1 AND publico = 1 AND empresa_id = ?
    `, [req.params.id, req.user.empresa_id]);

    if (!rows.length) return sendError(res, 'Artigo não encontrado', 404);
    res.json(rows[0]);
  } catch (error) {
    sendError(res, 'Erro ao buscar artigo', 500);
  }
});

router.get('/knowledge/search', async (req: any, res: any) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    
    const searchTerms = `%${q}%`;
    const [rows] = await pool.query(`
      SELECT id, titulo, categoria, SUBSTRING(conteudo, 1, 150) as resumo
      FROM knowledge_articles
      WHERE ativo = 1 AND publico = 1 AND empresa_id = ?
        AND (titulo LIKE ? OR conteudo LIKE ? OR categoria LIKE ?)
      ORDER BY 
        CASE WHEN titulo LIKE ? THEN 1 ELSE 2 END,
        created_at DESC
      LIMIT 10
    `, [req.user.empresa_id, searchTerms, searchTerms, searchTerms, searchTerms]);
    
    res.json(rows);
  } catch (error) {
    sendError(res, 'Erro ao pesquisar artigos', 500);
  }
});

export const portalRoutes = router;
