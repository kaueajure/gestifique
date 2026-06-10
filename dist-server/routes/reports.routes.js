import { Router } from 'express';
import reportsService from '../services/reports.service.js';
import { authMiddleware } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permissions.middleware.js';
import { permissionsService } from '../services/permissions.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
const router = Router();
router.use(authMiddleware);
router.get('/summary', requirePermission('relatorios.visualizar'), async (req, res) => {
    try {
        const currentUser = req.user;
        if (!currentUser)
            return sendError(res, 'Não autenticado', 401);
        const { start_date, end_date, empresa_id, responsavel_id, status, prioridade } = req.query;
        const filters = {
            start_date: start_date,
            end_date: end_date,
            responsavel_id: responsavel_id ? parseInt(responsavel_id) : undefined,
            status: status,
            prioridade: prioridade
        };
        // Permission check for empresa_id
        if (!currentUser.desenvolvedor) {
            filters.empresa_id = currentUser.empresa_id;
        }
        else if (empresa_id) {
            filters.empresa_id = parseInt(empresa_id);
        }
        // Resolve reports scoping
        const isSuperUser = !!(currentUser.desenvolvedor || currentUser.administrador);
        if (!isSuperUser) {
            const hasVerTodos = await permissionsService.hasPermission(currentUser, 'relatorios.ver_todos_usuarios');
            if (!hasVerTodos) {
                // Force scoping to own indicators
                filters.responsavel_id = currentUser.id;
            }
        }
        const summary = await reportsService.getSummary(filters);
        sendSuccess(res, summary);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao gerar relatório';
        sendError(res, message);
    }
});
router.post('/generate', requirePermission('relatorios.visualizar'), async (req, res) => {
    try {
        const currentUser = req.user;
        if (!currentUser)
            return sendError(res, 'Não autenticado', 401);
        const { start_date, end_date, empresa_id, responsavel_id, status, prioridade } = req.body;
        const filters = {
            start_date,
            end_date,
            responsavel_id: responsavel_id ? parseInt(responsavel_id) : undefined,
            status,
            prioridade
        };
        // Force empresa_id if not developer
        if (!currentUser.desenvolvedor) {
            filters.empresa_id = currentUser.empresa_id;
        }
        else if (empresa_id) {
            filters.empresa_id = parseInt(empresa_id);
        }
        // Resolve reports scoping
        const isSuperUser = !!(currentUser.desenvolvedor || currentUser.administrador);
        if (!isSuperUser) {
            const hasVerTodos = await permissionsService.hasPermission(currentUser, 'relatorios.ver_todos_usuarios');
            if (!hasVerTodos) {
                // Force scoping to own indicators
                filters.responsavel_id = currentUser.id;
            }
        }
        const reportData = await reportsService.getReportData(filters);
        sendSuccess(res, reportData);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao gerar relatório';
        sendError(res, message);
    }
});
router.get('/export', requirePermission('relatorios.exportar'), async (req, res) => {
    try {
        const currentUser = req.user;
        if (!currentUser)
            return sendError(res, 'Não autenticado', 401);
        const { type, start_date, end_date, empresa_id, responsavel_id, status, prioridade, categoria, servico } = req.query;
        const filters = {
            start_date: start_date,
            end_date: end_date,
            responsavel_id: responsavel_id ? parseInt(responsavel_id) : undefined,
            status: status,
            prioridade: prioridade,
            categoria: categoria,
            servico: servico
        };
        if (!currentUser.desenvolvedor) {
            filters.empresa_id = currentUser.empresa_id;
        }
        else if (empresa_id) {
            filters.empresa_id = parseInt(empresa_id);
        }
        // Resolve reports scoping
        const isSuperUser = !!(currentUser.desenvolvedor || currentUser.administrador);
        if (!isSuperUser) {
            const hasVerTodos = await permissionsService.hasPermission(currentUser, 'relatorios.ver_todos_usuarios');
            if (!hasVerTodos) {
                // Force scoping to own indicators
                filters.responsavel_id = currentUser.id;
            }
        }
        const csvData = await reportsService.exportCSV(filters, type || 'tickets');
        res.setHeader('Content-Disposition', `attachment; filename="relatorio_${type || 'tickets'}_${new Date().toISOString().substring(0, 10)}.csv"`);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.send('\uFEFF' + csvData); // BOM para excel
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao exportar relatório';
        sendError(res, message);
    }
});
export default router;
