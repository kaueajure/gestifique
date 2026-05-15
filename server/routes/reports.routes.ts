import { Router } from 'express';
import reportsService, { ReportFilters } from '../services/reports.service.js';
import { authMiddleware, AuthRequest } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permissions.middleware.js';
import { sendSuccess, sendError } from '../utils/response.js';

const router = Router();

router.use(authMiddleware);

router.get('/summary', requirePermission('relatorios.visualizar'), async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);

    const { start_date, end_date, empresa_id, responsavel_id, status, prioridade } = req.query;

    const filters: ReportFilters = {
      start_date: start_date as string | undefined,
      end_date: end_date as string | undefined,
      responsavel_id: responsavel_id ? parseInt(responsavel_id as string) : undefined,
      status: status as string | undefined,
      prioridade: prioridade as string | undefined
    };

    // Permission check for empresa_id
    if (!currentUser.desenvolvedor) {
      filters.empresa_id = currentUser.empresa_id;
    } else if (empresa_id) {
      filters.empresa_id = parseInt(empresa_id as string);
    }

    const summary = await reportsService.getSummary(filters);
    sendSuccess(res, summary);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao gerar relatório';
    sendError(res, message);
  }
});

router.post('/generate', requirePermission('relatorios.visualizar'), async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);

    const { start_date, end_date, empresa_id, status, prioridade } = req.body;

    const filters: ReportFilters = {
      start_date,
      end_date,
      status,
      prioridade
    };

    // Force empresa_id if not developer
    if (!currentUser.desenvolvedor) {
      filters.empresa_id = currentUser.empresa_id;
    } else if (empresa_id) {
      filters.empresa_id = parseInt(empresa_id as string);
    }

    const reportData = await reportsService.getReportData(filters);
    sendSuccess(res, reportData);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao gerar relatório';
    sendError(res, message);
  }
});

router.get('/export', requirePermission('relatorios.visualizar'), async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return sendError(res, 'Não autenticado', 401);

    const { type, start_date, end_date, empresa_id, responsavel_id, status, prioridade, categoria, servico } = req.query;

    const filters: ReportFilters = {
      start_date: start_date as string | undefined,
      end_date: end_date as string | undefined,
      responsavel_id: responsavel_id ? parseInt(responsavel_id as string) : undefined,
      status: status as string | undefined,
      prioridade: prioridade as string | undefined,
      categoria: categoria as string | undefined,
      servico: servico as string | undefined
    };

    if (!currentUser.desenvolvedor) {
      filters.empresa_id = currentUser.empresa_id;
    } else if (empresa_id) {
      filters.empresa_id = parseInt(empresa_id as string);
    }

    const csvData = await reportsService.exportCSV(filters, type as string || 'tickets');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio_${type || 'tickets'}_${new Date().toISOString().substring(0,10)}.csv"`);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.send('\uFEFF' + csvData); // BOM para excel
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao exportar relatório';
    sendError(res, message);
  }
});

export default router;
