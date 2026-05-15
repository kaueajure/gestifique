import { Router } from 'express';
import pool from '../db/connection.js';
import { authMiddleware } from '../middlewares/auth.js';
import { sendError } from '../utils/response.js';

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

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result]: any = await conn.query(`
      INSERT INTO tickets (empresa_id, titulo, descricao, status, prioridade, origem, usuario_id, categoria, servico)
      VALUES (?, ?, ?, 'aberto', 'media', 'portal', ?, ?, ?)
    `, [req.user.empresa_id, titulo, descricao, req.user.id, categoria || null, servico || null]);

    const ticketId = result.insertId;

    // Registrar log
    await conn.query(`
      INSERT INTO logs_sistema (empresa_id, usuario_id, acao, descricao)
      VALUES (?, ?, 'ticket_criado', ?)
    `, [req.user.empresa_id, req.user.id, `Chamado #${ticketId} aberto via portal`]);

    await conn.commit();
    res.status(201).json({ message: 'Chamado criado com sucesso', ticketId });
  } catch (error) {
    await conn.rollback();
    sendError(res, 'Erro ao criar chamado', 500);
  } finally {
    conn.release();
  }
});

router.post('/tickets/:id/messages', async (req: any, res: any) => {
  const { mensagem } = req.body;
  if (!mensagem) return sendError(res, 'Mensagem vazia', 400);

  const conn = await pool.getConnection();
  try {
    const [ticketRows]: any = await conn.query('SELECT status FROM tickets WHERE id = ? AND usuario_id = ? FOR UPDATE', [req.params.id, req.user.id]);
    if (!ticketRows.length) return sendError(res, 'Chamado não encontrado', 404);

    await conn.beginTransaction();

    await conn.query(`
      INSERT INTO ticket_mensagens (ticket_id, usuario_id, mensagem, tipo, interno)
      VALUES (?, ?, ?, 'texto', 0)
    `, [req.params.id, req.user.id, mensagem]);

    // Mudar status para aberto se estiver aguardando cliente
    if (ticketRows[0].status === 'aguardando_cliente') {
      await conn.query('UPDATE tickets SET status = "aberto", updated_at = NOW() WHERE id = ?', [req.params.id]);
      
      await conn.query(`
        INSERT INTO ticket_mensagens (ticket_id, usuario_id, mensagem, tipo, interno)
        VALUES (?, ?, 'Status alterado de Aguardando Você para Aberto', 'status_change', 0)
      `, [req.params.id, req.user.id]);
    } else {
      await conn.query('UPDATE tickets SET updated_at = NOW() WHERE id = ?', [req.params.id]);
    }

    await conn.commit();
    res.status(201).json({ message: 'Mensagem enviada com sucesso' });
  } catch (error) {
    await conn.rollback();
    sendError(res, 'Erro ao enviar mensagem', 500);
  } finally {
    conn.release();
  }
});

router.get('/knowledge', async (req: any, res: any) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, titulo, conteudo, categoria
      FROM artigos_conhecimento
      WHERE ativo = 1 AND publico = 1 AND empresa_id = ?
      ORDER BY titulo ASC
    `, [req.user.empresa_id]);
    res.json(rows);
  } catch (error) {
    sendError(res, 'Erro ao buscar artigos', 500);
  }
});

router.get('/knowledge/search', async (req: any, res: any) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    
    const searchTerms = `%${q}%`;
    const [rows] = await pool.query(`
      SELECT id, titulo, categoria
      FROM artigos_conhecimento
      WHERE ativo = 1 AND publico = 1 AND empresa_id = ?
        AND (titulo LIKE ? OR conteudo LIKE ?)
      LIMIT 5
    `, [req.user.empresa_id, searchTerms, searchTerms]);
    
    res.json(rows);
  } catch (error) {
    sendError(res, 'Erro ao pesquisar artigos', 500);
  }
});

export const portalRoutes = router;
