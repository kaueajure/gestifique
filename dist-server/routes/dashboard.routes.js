import { Router } from 'express';
import pool from '../db/connection.js';
import { authMiddleware } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permissions.middleware.js';
import { sendSuccess, sendError } from '../utils/response.js';
const router = Router();
router.use(authMiddleware);
router.get('/summary', requirePermission('dashboard.visualizar'), async (req, res) => {
    try {
        const currentUser = req.user;
        if (!currentUser)
            return sendError(res, 'Nao autenticado', 401);
        const isDev = Boolean(currentUser.desenvolvedor);
        const empresaId = currentUser.empresa_id;
        const ticketCompanyFilter = isDev ? '' : 'AND empresa_id = ?';
        const ticketAliasCompanyFilter = isDev ? '' : 'AND t.empresa_id = ?';
        const scopedParams = isDev ? [] : [empresaId];
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const [ticketMetricsRows] = await pool.query(`
        SELECT
          SUM(CASE WHEN status NOT IN ('resolvido', 'fechado') THEN 1 ELSE 0 END) as chamadosAtivos,
          SUM(CASE WHEN status = 'resolvido' AND updated_at >= ? THEN 1 ELSE 0 END) as resolvidosMes,
          SUM(CASE WHEN status NOT IN ('resolvido', 'fechado') AND prazo_sla < NOW() THEN 1 ELSE 0 END) as slaAtrasados
        FROM tickets
        WHERE 1=1 ${ticketCompanyFilter}
      `, [startOfMonth, ...scopedParams]);
        let totalEmpresas = 0;
        if (isDev) {
            const [empresasResult] = await pool.query('SELECT COUNT(*) as count FROM empresas WHERE ativo = 1');
            totalEmpresas = Number(empresasResult[0]?.count || 0);
        }
        const [usuariosResult] = await pool.query(`SELECT COUNT(*) as count FROM usuarios WHERE ativo = 1 ${ticketCompanyFilter}`, scopedParams);
        const [recentTickets] = await pool.query(`
        SELECT t.id, t.titulo, t.status, t.prioridade, t.created_at, u.nome as cliente_nome
        FROM tickets t
        LEFT JOIN usuarios u ON t.usuario_id = u.id
        WHERE 1=1 ${ticketAliasCompanyFilter}
        ORDER BY t.created_at DESC, t.id DESC
        LIMIT 5
      `, scopedParams);
        const [statusResult] = await pool.query(`SELECT status, COUNT(*) as qtd FROM tickets WHERE 1=1 ${ticketCompanyFilter} GROUP BY status`, scopedParams);
        const ticketMetrics = ticketMetricsRows[0] || {};
        sendSuccess(res, {
            chamadosAtivos: Number(ticketMetrics.chamadosAtivos || 0),
            resolvidosMes: Number(ticketMetrics.resolvidosMes || 0),
            totalEmpresas,
            totalUsuarios: Number(usuariosResult[0]?.count || 0),
            slaAtrasados: Number(ticketMetrics.slaAtrasados || 0),
            recentTickets: recentTickets || [],
            byStatus: statusResult || [],
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao carregar dashboard';
        sendError(res, message);
    }
});
export default router;
