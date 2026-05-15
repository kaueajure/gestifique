import { RowDataPacket } from 'mysql2';
import pool from '../db/connection.js';

export interface ReportFilters {
  start_date?: string;
  end_date?: string;
  empresa_id?: number;
  responsavel_id?: number;
  status?: string;
  prioridade?: string;
}

export interface SummaryData {
  totals: {
    total_tickets: number;
    open_tickets: number;
    in_progress_tickets: number;
    resolved_tickets: number;
    closed_tickets: number;
    urgent_tickets: number;
    average_resolution_hours: number;
  };
  by_status: { name: string; value: number }[];
  by_priority: { name: string; value: number }[];
  by_category: { name: string; value: number }[];
  by_service: { name: string; value: number }[];
  by_responsible: { name: string; value: number }[];
  by_day: { date: string; created: number; resolved: number }[];
}

class ReportsService {
  private buildWhere(filters: ReportFilters, alias: string = ''): { clauses: string[], params: (string | number)[] } {
    const clauses: string[] = [];
    const params: (string | number)[] = [];
    const prefix = alias ? `${alias}.` : '';

    // Default 30 days if no date filter
    const startDate = filters.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = filters.end_date || new Date().toISOString().split('T')[0];

    clauses.push(`${prefix}created_at >= ? AND ${prefix}created_at <= ?`);
    params.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);

    if (filters.empresa_id) {
      clauses.push(`${prefix}empresa_id = ?`);
      params.push(filters.empresa_id);
    }
    if (filters.responsavel_id) {
      clauses.push(`${prefix}responsavel_id = ?`);
      params.push(filters.responsavel_id);
    }
    if (filters.status) {
      clauses.push(`${prefix}status = ?`);
      params.push(filters.status);
    }
    if (filters.prioridade) {
      clauses.push(`${prefix}prioridade = ?`);
      params.push(filters.prioridade);
    }

    return { clauses, params };
  }

  async getSummary(filters: ReportFilters): Promise<SummaryData> {
    const { clauses, params } = this.buildWhere(filters);
    const whereString = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';

    interface TotalRow extends RowDataPacket {
      total: number;
      open: number;
      in_progress: number;
      resolved: number;
      closed: number;
      urgent: number;
      avg_res_hours: number | null;
    };

    // 1. Totals
    const [totalsRows] = await pool.query<TotalRow[]>(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'aberto' THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN status = 'em_andamento' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'resolvido' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN status = 'fechado' THEN 1 ELSE 0 END) as closed,
        SUM(CASE WHEN prioridade = 'urgente' THEN 1 ELSE 0 END) as urgent,
        AVG(CASE WHEN status IN ('resolvido', 'fechado') AND finalizado_em IS NOT NULL 
            THEN TIMESTAMPDIFF(HOUR, created_at, finalizado_em) 
            ELSE NULL END) as avg_res_hours
      FROM tickets
      ${whereString}
    `, params);

    const totals = totalsRows[0] || { total: 0, open: 0, in_progress: 0, resolved: 0, closed: 0, urgent: 0, avg_res_hours: 0 };

    interface GroupedRow extends RowDataPacket { name: string | null; value: number };

    // 2. By Status
    const [statusRows] = await pool.query<GroupedRow[]>(`
      SELECT status as name, COUNT(*) as value
      FROM tickets
      ${whereString}
      GROUP BY status
    `, params);

    // 3. By Priority
    const [priorityRows] = await pool.query<GroupedRow[]>(`
      SELECT prioridade as name, COUNT(*) as value
      FROM tickets
      ${whereString}
      GROUP BY prioridade
    `, params);

    // 4. By Category
    const [categoryRows] = await pool.query<GroupedRow[]>(`
      SELECT categoria as name, COUNT(*) as value
      FROM tickets
      ${whereString}
      GROUP BY categoria
    `, params);

    // 4.5 By Service
    const [serviceRows] = await pool.query<GroupedRow[]>(`
      SELECT servico as name, COUNT(*) as value
      FROM tickets
      ${whereString}
      GROUP BY servico
    `, params);

    // 5. By Responsible
    const { clauses: resClauses, params: resParams } = this.buildWhere(filters, 't');
    const resWhereString = resClauses.length > 0 ? `WHERE ${resClauses.join(' AND ')}` : '';

    const [responsibleRows] = await pool.query<GroupedRow[]>(`
      SELECT u.nome as name, COUNT(t.id) as value
      FROM tickets t
      LEFT JOIN usuarios u ON t.responsavel_id = u.id
      ${resWhereString}
      GROUP BY u.nome
    `, resParams);

    // 6. By Day
    interface DayRow extends RowDataPacket { date: Date | string; created: number };
    const [dayRows] = await pool.query<DayRow[]>(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as created
      FROM tickets
      ${whereString}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, params);

    // Resolutions by day
    const startDate = filters.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = filters.end_date || new Date().toISOString().split('T')[0];
    
    let resClausesList = ['finalizado_em >= ?', 'finalizado_em <= ?'];
    let resParamsList: (string | number)[] = [`${startDate} 00:00:00`, `${endDate} 23:59:59`];
    
    if (filters.empresa_id) { resClausesList.push('empresa_id = ?'); resParamsList.push(filters.empresa_id); }
    if (filters.responsavel_id) { resClausesList.push('responsavel_id = ?'); resParamsList.push(filters.responsavel_id); }
    if (filters.status) { resClausesList.push('status = ?'); resParamsList.push(filters.status); }
    if (filters.prioridade) { resClausesList.push('prioridade = ?'); resParamsList.push(filters.prioridade); }

    interface ResDayRow extends RowDataPacket { date: Date | string; resolved: number };
    const [resDayRows] = await pool.query<ResDayRow[]>(`
      SELECT 
        DATE(finalizado_em) as date,
        COUNT(*) as resolved
      FROM tickets
      WHERE ${resClausesList.join(' AND ')}
      AND finalizado_em IS NOT NULL
      GROUP BY DATE(finalizado_em)
      ORDER BY date ASC
    `, resParamsList);

    // Merge day data
    const dayMap = new Map<string, { date: string; created: number; resolved: number }>();
    
    dayRows.forEach((r) => {
      const d = r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date);
      dayMap.set(d, { date: d, created: Number(r.created), resolved: 0 });
    });

    resDayRows.forEach((r) => {
      const d = r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date);
      if (dayMap.has(d)) {
        dayMap.get(d)!.resolved = Number(r.resolved);
      } else {
        dayMap.set(d, { date: d, created: 0, resolved: Number(r.resolved) });
      }
    });

    const by_day = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    return {
      totals: {
        total_tickets: Number(totals.total || 0),
        open_tickets: Number(totals.open || 0),
        in_progress_tickets: Number(totals.in_progress || 0),
        resolved_tickets: Number(totals.resolved || 0),
        closed_tickets: Number(totals.closed || 0),
        urgent_tickets: Number(totals.urgent || 0),
        average_resolution_hours: Math.round(Number(totals.avg_res_hours || 0) * 10) / 10
      },
      by_status: statusRows.map((r) => ({ 
        name: this.translateStatus(r.name || 'Indefinido'), 
        value: Number(r.value) 
      })),
      by_priority: priorityRows.map((r) => ({ 
        name: this.translatePriority(r.name || 'baixa'), 
        value: Number(r.value) 
      })),
      by_category: categoryRows.map((r) => ({ 
        name: r.name || 'Sem Categoria', 
        value: Number(r.value) 
      })),
      by_service: serviceRows.map((r) => ({
        name: r.name || 'Sem Servico',
        value: Number(r.value)
      })),
      by_responsible: responsibleRows.map((r) => ({ 
        name: r.name || 'Sem Responsável', 
        value: Number(r.value) 
      })),
      by_day
    };
  }

  private translateStatus(status: string) {
    const map: Record<string, string> = {
      'aberto': 'Aberto',
      'em_andamento': 'Em Andamento',
      'aguardando_cliente': 'Aguardando Cliente',
      'resolvido': 'Resolvido',
      'fechado': 'Fechado'
    };
    return map[status] || status;
  }

  private translatePriority(priority: string) {
    const map: Record<string, string> = {
      'baixa': 'Baixa',
      'media': 'Média',
      'alta': 'Alta',
      'urgente': 'Urgente'
    };
    return map[priority] || priority;
  }

  async getReportData(filters: ReportFilters) {
    const { clauses, params } = this.buildWhere(filters, 't');
    const whereString = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';

    // 1. Get Metrics
    const [stats]: any = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN t.status = 'resolvido' OR t.status = 'fechado' THEN 1 ELSE 0 END) as resolvidos
      FROM tickets t
      ${whereString}
    `, params);

    const metrics = {
      total: stats[0].total || 0,
      resolvidos: stats[0].resolvidos || 0,
      taxaResolucao: stats[0].total > 0 ? Math.round((stats[0].resolvidos / stats[0].total) * 100) : 0
    };

    // 2. Get Detailed List
    const [tickets]: any = await pool.query(`
      SELECT 
        t.id, t.titulo, t.status, t.prioridade, t.categoria, t.created_at,
        e.nome as empresa_nome, u.nome as cliente_nome, r.nome as responsavel_nome
      FROM tickets t
      LEFT JOIN empresas e ON t.empresa_id = e.id
      LEFT JOIN usuarios u ON t.usuario_id = u.id
      LEFT JOIN usuarios r ON t.responsavel_id = r.id
      ${whereString}
      ORDER BY t.created_at DESC
    `, params);

    return { metrics, tickets };
  }

  async getDashboardStats(user: any) {
    const isDev = !!user.desenvolvedor;
    const userId = user.id;
    const empresaId = user.empresa_id;

    let whereClause = '';
    let params: any[] = [];

    if (!isDev) {
      if (user.administrador && empresaId) {
        whereClause = 'WHERE empresa_id = ?';
        params.push(empresaId);
      } else {
        whereClause = 'WHERE usuario_id = ?';
        params.push(userId);
      }
    }

    // 1. Counts
    const [countsRows]: any = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'aberto' THEN 1 ELSE 0 END) as aberto,
        SUM(CASE WHEN status = 'em_andamento' THEN 1 ELSE 0 END) as em_andamento,
        SUM(CASE WHEN status = 'aguardando_cliente' THEN 1 ELSE 0 END) as aguardando_cliente,
        SUM(CASE WHEN status = 'resolvido' THEN 1 ELSE 0 END) as resolvido,
        SUM(CASE WHEN status = 'fechado' THEN 1 ELSE 0 END) as fechado,
        SUM(CASE WHEN prioridade = 'urgente' THEN 1 ELSE 0 END) as urgente,
        AVG(CASE WHEN status IN ('resolvido', 'fechado') AND finalizado_em IS NOT NULL THEN TIMESTAMPDIFF(HOUR, created_at, finalizado_em) ELSE NULL END) as avg_res
      FROM tickets
      ${whereClause}
    `, params);

    const counts = countsRows[0] || {};
    
    // 2. By Status Chart
    const [byStatus]: any = await pool.query(`
      SELECT status, COUNT(*) as qtd
      FROM tickets
      ${whereClause}
      GROUP BY status
    `, params);

    // 3. By Priority Chart
    const [byPriority]: any = await pool.query(`
      SELECT prioridade, COUNT(*) as qtd
      FROM tickets
      ${whereClause}
      GROUP BY prioridade
      ORDER BY qtd DESC
    `, params);

    // 4. Recent Tickets
    const [recentTickets]: any = await pool.query(`
      SELECT t.id, t.titulo, t.status, t.prioridade, t.created_at, u.nome as cliente_nome
      FROM tickets t
      LEFT JOIN usuarios u ON t.usuario_id = u.id
      ${whereClause.replace(/empresa_id/g, 't.empresa_id').replace(/usuario_id/g, 't.usuario_id')}
      ORDER BY t.created_at DESC
      LIMIT 5
    `, params);

    // 5. Recent Activities (logs_sistema) - Consistent logic with logs.service
    let logWhere = 'WHERE 1=1';
    let logParams = [];
    if (!isDev) {
      if (user.administrador && empresaId) {
        logWhere += ' AND l.empresa_id = ?';
        logParams.push(empresaId);
      } else {
        logWhere += ' AND l.usuario_id = ?';
        logParams.push(userId);
      }
    }

    const [recentActivities]: any = await pool.query(`
      SELECT l.id, l.acao, l.created_at, u.nome as usuario_nome
      FROM logs_sistema l
      LEFT JOIN usuarios u ON l.usuario_id = u.id
      ${logWhere}
      ORDER BY l.created_at DESC
      LIMIT 5
    `, logParams);

    return {
      counts: {
        ...counts,
        total: Number(counts.total || 0),
        aberto: Number(counts.aberto || 0),
        em_andamento: Number(counts.em_andamento || 0),
        aguardando_cliente: Number(counts.aguardando_cliente || 0),
        resolvido: Number(counts.resolvido || 0),
        fechado: Number(counts.fechado || 0),
        urgente: Number(counts.urgente || 0),
        tempo_medio_resolucao: counts.avg_res ? `${Math.round(counts.avg_res)}h` : '0h'
      },
      byStatus,
      byPriority,
      recentTickets,
      recentActivities
    };
  }
}

export default new ReportsService();
