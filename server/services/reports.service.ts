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
  by_responsible: { name: string; value: number }[];
  by_day: { date: string; created: number; resolved: number }[];
}

class ReportsService {
  async getSummary(filters: ReportFilters): Promise<SummaryData> {
    let whereParams: any[] = [];
    let whereClauses: string[] = [];

    // Default 30 days if no date filter
    const startDate = filters.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = filters.end_date || new Date().toISOString().split('T')[0];

    whereClauses.push('created_at >= ? AND created_at <= ?');
    whereParams.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);

    if (filters.empresa_id) {
      whereClauses.push('empresa_id = ?');
      whereParams.push(filters.empresa_id);
    }
    if (filters.responsavel_id) {
      whereClauses.push('responsavel_id = ?');
      whereParams.push(filters.responsavel_id);
    }
    if (filters.status) {
      whereClauses.push('status = ?');
      whereParams.push(filters.status);
    }
    if (filters.prioridade) {
      whereClauses.push('prioridade = ?');
      whereParams.push(filters.prioridade);
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // 1. Totals
    const [totalsRows]: any = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'aberto' THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN status = 'em_andamento' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'resolvido' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN status = 'arquivado' THEN 1 ELSE 0 END) as closed,
        SUM(CASE WHEN prioridade = 'urgente' THEN 1 ELSE 0 END) as urgent,
        AVG(CASE WHEN status IN ('resolvido', 'arquivado') AND finalizado_em IS NOT NULL 
            THEN TIMESTAMPDIFF(HOUR, created_at, finalizado_em) 
            ELSE NULL END) as avg_res_hours
      FROM tickets
      ${whereString}
    `, whereParams);

    const totals = totalsRows[0];

    // 2. By Status
    const [statusRows]: any = await pool.query(`
      SELECT status as name, COUNT(*) as value
      FROM tickets
      ${whereString}
      GROUP BY status
    `, whereParams);

    // 3. By Priority
    const [priorityRows]: any = await pool.query(`
      SELECT prioridade as name, COUNT(*) as value
      FROM tickets
      ${whereString}
      GROUP BY prioridade
    `, whereParams);

    // 4. By Category
    const [categoryRows]: any = await pool.query(`
      SELECT categoria as name, COUNT(*) as value
      FROM tickets
      ${whereString}
      GROUP BY categoria
    `, whereParams);

    // 5. By Responsible
    const [responsibleRows]: any = await pool.query(`
      SELECT u.nome as name, COUNT(t.id) as value
      FROM tickets t
      LEFT JOIN usuarios u ON t.responsavel_id = u.id
      ${whereString.replace('WHERE ', 'WHERE t.')}
      GROUP BY u.nome
    `, whereParams);

    // 6. By Day (Last N days based on filter)
    const [dayRows]: any = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as created,
        SUM(CASE WHEN status IN ('resolvido', 'arquivado') AND DATE(finalizado_em) = DATE(created_at) THEN 1 ELSE 0 END) as resolved_same_day
      FROM tickets
      ${whereString}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, whereParams);

    // Additional query for resolutions by day (might not be same day as creation)
    const [resDayRows]: any = await pool.query(`
      SELECT 
        DATE(finalizado_em) as date,
        COUNT(*) as resolved
      FROM tickets
      ${whereString.replace('created_at', 'finalizado_em')}
      AND finalizado_em IS NOT NULL
      GROUP BY DATE(finalizado_em)
      ORDER BY date ASC
    `, whereParams);

    // Merge day data
    const dayMap = new Map<string, { date: string; created: number; resolved: number }>();
    
    dayRows.forEach((r: any) => {
      const d = r.date.toISOString().split('T')[0];
      dayMap.set(d, { date: d, created: r.created, resolved: 0 });
    });

    resDayRows.forEach((r: any) => {
      const d = r.date.toISOString().split('T')[0];
      if (dayMap.has(d)) {
        dayMap.get(d)!.resolved = r.resolved;
      } else {
        dayMap.set(d, { date: d, created: 0, resolved: r.resolved });
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
      by_status: statusRows.map((r: any) => ({ 
        name: this.translateStatus(r.name), 
        value: Number(r.value) 
      })),
      by_priority: priorityRows.map((r: any) => ({ 
        name: this.translatePriority(r.name), 
        value: Number(r.value) 
      })),
      by_category: categoryRows.map((r: any) => ({ 
        name: r.name || 'Sem Categoria', 
        value: Number(r.value) 
      })),
      by_responsible: responsibleRows.map((r: any) => ({ 
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
      'resolvido': 'Resolvido',
      'arquivado': 'Arquivado'
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

  async getDashboardStats(user: any) {
    const isDev = user.desenvolvedor;
    const empresaId = user.empresa_id;

    let whereClause = '';
    let params: any[] = [];

    if (!isDev) {
      whereClause = 'WHERE empresa_id = ?';
      params.push(empresaId);
    }

    // 1. Counts
    const [countsRows]: any = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'aberto' THEN 1 ELSE 0 END) as aberto,
        SUM(CASE WHEN status = 'em_andamento' THEN 1 ELSE 0 END) as em_andamento,
        SUM(CASE WHEN status = 'aguardando_cliente' THEN 1 ELSE 0 END) as aguardando_cliente,
        SUM(CASE WHEN status = 'resolvido' THEN 1 ELSE 0 END) as resolvido,
        SUM(CASE WHEN status = 'arquivado' THEN 1 ELSE 0 END) as fechado,
        SUM(CASE WHEN prioridade = 'urgente' THEN 1 ELSE 0 END) as urgente,
        AVG(CASE WHEN status IN ('resolvido', 'arquivado') AND finalizado_em IS NOT NULL THEN TIMESTAMPDIFF(HOUR, created_at, finalizado_em) ELSE NULL END) as avg_res
      FROM tickets
      ${whereClause}
    `, params);

    const counts = countsRows[0];
    
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
      SELECT id, titulo, status, prioridade, created_at, (SELECT nome FROM usuarios WHERE id = tickets.usuario_id) as cliente_nome
      FROM tickets
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT 5
    `, params);

    // 5. Recent Activities
    const actParams = isDev ? [] : [empresaId];
    const [recentActivities]: any = await pool.query(`
      SELECT id, acao, created_at, (SELECT nome FROM usuarios WHERE id = logs.usuario_id) as usuario_nome
      FROM logs
      ${isDev ? '' : 'WHERE empresa_id = ?'}
      ORDER BY created_at DESC
      LIMIT 5
    `, actParams);

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
