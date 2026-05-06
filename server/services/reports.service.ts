import pool from '../db/connection';

class ReportsService {
  async getDashboardStats(empresaId?: number) {
    const params = empresaId ? [empresaId] : [];
    const where = empresaId ? 'WHERE empresa_id = ?' : '';

    const stats: any = {};
    
    const [counts]: any = await pool.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'aberto' THEN 1 ELSE 0 END) as aberto,
        SUM(CASE WHEN status = 'em_andamento' THEN 1 ELSE 0 END) as em_andamento,
        SUM(CASE WHEN status = 'aguardando_cliente' THEN 1 ELSE 0 END) as aguardando_cliente,
        SUM(CASE WHEN status = 'resolvido' THEN 1 ELSE 0 END) as resolvido,
        SUM(CASE WHEN status = 'fechado' THEN 1 ELSE 0 END) as fechado,
        SUM(CASE WHEN prioridade = 'urgente' THEN 1 ELSE 0 END) as urgente
       FROM tickets ${where}`,
      params
    );
    
    stats.counts = counts[0];

    const [byDay]: any = await pool.query(
      `SELECT DATE(created_at) as data, COUNT(*) as qtd 
       FROM tickets 
       ${where}
       ${where ? 'AND' : 'WHERE'} created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(created_at) ORDER BY data ASC`,
      params
    );
    stats.byDay = byDay;

    return stats;
  }

  async getPerformance(empresaId?: number) {
    const where = empresaId ? 'WHERE empresa_id = ?' : '';
    const [topUsers]: any = await pool.query(
      `SELECT u.nome, COUNT(t.id) as resolvidos
       FROM usuarios u
       JOIN tickets t ON u.id = t.responsavel_id
       WHERE t.status IN ('resolvido', 'fechado')
       ${empresaId ? 'AND u.empresa_id = ?' : ''}
       GROUP BY u.id ORDER BY resolvidos DESC LIMIT 5`,
      empresaId ? [empresaId] : []
    );
    return { topUsers };
  }
}

export default new ReportsService();
