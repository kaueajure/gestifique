import { Router } from 'express';
import pool from '../db/connection.js';
import { authMiddleware, AuthRequest } from '../middlewares/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';

const router = Router();

router.use(authMiddleware);

router.get('/summary', async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);

    const isDev = Boolean(currentUser.desenvolvedor);
    const empresaId = currentUser.empresa_id;

    let companyFilter = '';
    let params: any[] = [];

    if (!isDev) {
      companyFilter = 'AND empresa_id = ?';
      params.push(empresaId);
    }

    // 1. Total chamados ativos
    const [ativosResult]: any = await pool.query(
      `SELECT COUNT(*) as count FROM tickets WHERE status NOT IN ('resolvido', 'fechado') ${companyFilter}`,
      params
    );
    const chamadosAtivos = ativosResult[0].count;

    // 2. Chamados resolvidos no mês
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [resolvidosResult]: any = await pool.query(
      `SELECT COUNT(*) as count FROM tickets WHERE status = 'resolvido' AND updated_at >= ? ${companyFilter}`,
      [startOfMonth, ...params]
    );
    const resolvidosMes = resolvidosResult[0].count;

    // 3. Total de empresas (apenas dev)
    let totalEmpresas = 0;
    if (isDev) {
      const [empresasResult]: any = await pool.query('SELECT COUNT(*) as count FROM empresas WHERE ativo = 1');
      totalEmpresas = empresasResult[0].count;
    }

    // 4. Total de usuários
    const [usuariosResult]: any = await pool.query(
      `SELECT COUNT(*) as count FROM usuarios WHERE ativo = 1 ${companyFilter}`,
      params
    );
    const totalUsuarios = usuariosResult[0].count;

    // 5. Chamados recentes
    let recentesQuery = `
      SELECT t.id, t.titulo, t.status, t.prioridade, t.created_at, u.nome as cliente_nome
      FROM tickets t
      LEFT JOIN usuarios u ON t.usuario_id = u.id
      WHERE 1=1 ${companyFilter ? 'AND t.empresa_id = ?' : ''}
      ORDER BY t.created_at DESC
      LIMIT 5
    `;
    const [recentTickets]: any = await pool.query(recentesQuery, params);

    // 6. Dados de status para gráfico
    const [statusResult]: any = await pool.query(
      `SELECT status, COUNT(*) as qtd FROM tickets WHERE 1=1 ${companyFilter} GROUP BY status`,
      params
    );

    const summary = {
      chamadosAtivos,
      resolvidosMes,
      totalEmpresas,
      totalUsuarios,
      recentTickets: recentTickets || [],
      byStatus: statusResult || []
    };

    sendSuccess(res, summary);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao carregar dashboard';
    sendError(res, message);
  }
});

export default router;
