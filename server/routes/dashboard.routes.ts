import { Router } from 'express';
import pool from '../db/connection.js';
import { authMiddleware, AuthRequest } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permissions.middleware.js';
import { sendSuccess, sendError } from '../utils/response.js';

const router = Router();

router.use(authMiddleware);

router.get('/summary', requirePermission('dashboard.visualizar'), async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Nao autenticado', 401);

    const isDev = Boolean(currentUser.desenvolvedor);
    const empresaId = currentUser.empresa_id;

    const ticketCompanyFilter = isDev ? '' : 'AND empresa_id = ?';
    const ticketAliasCompanyFilter = isDev ? '' : 'AND t.empresa_id = ?';
    const scopedParams = isDev ? [] : [empresaId];

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [ticketMetricsRows]: any = await pool.query(
      `
        SELECT
          SUM(CASE WHEN status NOT IN ('resolvido', 'fechado') THEN 1 ELSE 0 END) as chamadosAtivos,
          SUM(CASE WHEN status = 'resolvido' AND updated_at >= ? THEN 1 ELSE 0 END) as resolvidosMes,
          SUM(CASE WHEN status NOT IN ('resolvido', 'fechado') AND prazo_sla < NOW() THEN 1 ELSE 0 END) as slaAtrasados,
          SUM(CASE WHEN status NOT IN ('resolvido', 'fechado') AND prazo_sla IS NOT NULL AND DATE(prazo_sla) = CURDATE() THEN 1 ELSE 0 END) as vencendoHoje,
          AVG(CASE WHEN primeira_resposta_em IS NOT NULL AND created_at >= ? THEN TIMESTAMPDIFF(MINUTE, created_at, primeira_resposta_em) ELSE NULL END) as tempoMedioPrimeiraRespostaMinutos,
          AVG(CASE WHEN finalizado_em IS NOT NULL AND finalizado_em >= ? THEN TIMESTAMPDIFF(MINUTE, created_at, finalizado_em) ELSE NULL END) as tempoMedioResolucaoMinutos,
          SUM(CASE WHEN COALESCE(sla_resolucao_status, '') IN ('cumprido', 'dentro_do_prazo') THEN 1 ELSE 0 END) as slaCumprido,
          SUM(CASE WHEN sla_resolucao_status = 'violado' OR (status NOT IN ('resolvido', 'fechado') AND prazo_sla < NOW()) THEN 1 ELSE 0 END) as slaViolado
        FROM tickets
        WHERE 1=1 ${ticketCompanyFilter}
      `,
      [startOfMonth, startOfMonth, startOfMonth, ...scopedParams]
    );

    let totalEmpresas = 0;
    if (isDev) {
      const [empresasResult]: any = await pool.query('SELECT COUNT(*) as count FROM empresas WHERE ativo = 1');
      totalEmpresas = Number(empresasResult[0]?.count || 0);
    }

    const [usuariosResult]: any = await pool.query(
      `SELECT COUNT(*) as count FROM usuarios WHERE ativo = 1 ${ticketCompanyFilter}`,
      scopedParams
    );

    const [recentTickets]: any = await pool.query(
      `
        SELECT
          t.id,
          t.titulo,
          t.status,
          t.prioridade,
          t.created_at,
          t.updated_at,
          t.prazo_sla,
          t.prazo_primeira_resposta,
          t.primeira_resposta_em,
          t.finalizado_em,
          t.sla_resolucao_status,
          t.sla_primeira_resposta_status,
          t.responsavel_id,
          u.nome as cliente_nome,
          r.nome as responsavel_nome,
          e.nome as empresa_nome
        FROM tickets t
        LEFT JOIN usuarios u ON t.usuario_id = u.id
        LEFT JOIN usuarios r ON t.responsavel_id = r.id
        LEFT JOIN empresas e ON t.empresa_id = e.id
        WHERE 1=1 ${ticketAliasCompanyFilter}
        ORDER BY t.created_at DESC, t.id DESC
        LIMIT 5
      `,
      scopedParams
    );

    const [statusResult]: any = await pool.query(
      `SELECT status, COUNT(*) as qtd FROM tickets WHERE 1=1 ${ticketCompanyFilter} GROUP BY status`,
      scopedParams
    );

    const [priorityResult]: any = await pool.query(
      `SELECT COALESCE(prioridade, 'sem_prioridade') as prioridade, COUNT(*) as qtd FROM tickets WHERE 1=1 ${ticketCompanyFilter} GROUP BY prioridade`,
      scopedParams
    );

    const [responsavelResult]: any = await pool.query(
      `
        SELECT COALESCE(u.nome, 'Sem responsavel') as responsavel, COUNT(*) as qtd
        FROM tickets t
        LEFT JOIN usuarios u ON t.responsavel_id = u.id
        WHERE t.status NOT IN ('resolvido', 'fechado') ${ticketAliasCompanyFilter}
        GROUP BY COALESCE(u.nome, 'Sem responsavel')
        ORDER BY qtd DESC
        LIMIT 8
      `,
      scopedParams
    );

    const [backlogResult]: any = await pool.query(
      `
        SELECT faixa, COUNT(*) as qtd
        FROM (
          SELECT
            CASE
              WHEN DATEDIFF(NOW(), created_at) <= 1 THEN '0-1 dia'
              WHEN DATEDIFF(NOW(), created_at) <= 3 THEN '2-3 dias'
              WHEN DATEDIFF(NOW(), created_at) <= 7 THEN '4-7 dias'
              WHEN DATEDIFF(NOW(), created_at) <= 14 THEN '8-14 dias'
              ELSE '15+ dias'
            END as faixa
          FROM tickets
          WHERE status NOT IN ('resolvido', 'fechado') ${ticketCompanyFilter}
        ) backlog
        GROUP BY faixa
      `,
      scopedParams
    );

    const ticketMetrics = ticketMetricsRows[0] || {};
    const firstResponseMinutes = ticketMetrics.tempoMedioPrimeiraRespostaMinutos;
    const resolutionMinutes = ticketMetrics.tempoMedioResolucaoMinutos;
    sendSuccess(res, {
      chamadosAtivos: Number(ticketMetrics.chamadosAtivos || 0),
      resolvidosMes: Number(ticketMetrics.resolvidosMes || 0),
      totalEmpresas,
      totalUsuarios: Number(usuariosResult[0]?.count || 0),
      slaAtrasados: Number(ticketMetrics.slaAtrasados || 0),
      vencendoHoje: Number(ticketMetrics.vencendoHoje || 0),
      tempoMedioPrimeiraRespostaHoras:
        firstResponseMinutes === null || firstResponseMinutes === undefined ? null : Number(firstResponseMinutes) / 60,
      tempoMedioResolucaoHoras:
        resolutionMinutes === null || resolutionMinutes === undefined ? null : Number(resolutionMinutes) / 60,
      slaCumprido: Number(ticketMetrics.slaCumprido || 0),
      slaViolado: Number(ticketMetrics.slaViolado || 0),
      recentTickets: recentTickets || [],
      byStatus: statusResult || [],
      byPriority: priorityResult || [],
      byResponsavel: responsavelResult || [],
      backlogPorIdade: backlogResult || [],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao carregar dashboard';
    sendError(res, message);
  }
});

export default router;
