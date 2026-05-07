import pool from '../db/connection';

class ReportsService {
  async getDashboardStats(user: any) {
    const isDev = user.desenvolvedor;
    const isAdmin = user.administrador;
    const empresaId = user.empresa_id;
    const userId = user.id;

    let where = '';
    let params: any[] = [];

    if (!isDev) {
      if (isAdmin) {
        where = 'WHERE empresa_id = ?';
        params = [empresaId];
      } else {
        where = 'WHERE usuario_id = ? OR responsavel_id = ?';
        params = [userId, userId];
      }
    }

    const stats: any = {};
    
    const [counts]: any = await pool.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'aberto' THEN 1 ELSE 0 END) as aberto,
        SUM(CASE WHEN status = 'em_andamento' THEN 1 ELSE 0 END) as em_andamento,
        SUM(CASE WHEN status = 'aguardando_cliente' THEN 1 ELSE 0 END) as aguardando_cliente,
        SUM(CASE WHEN status = 'resolvido' THEN 1 ELSE 0 END) as resolvido,
        SUM(CASE WHEN status = 'fechado' THEN 1 ELSE 0 END) as fechado,
        SUM(CASE WHEN prioridade = 'urgente' THEN 1 ELSE 0 END) as urgente,
        AVG(CASE WHEN finalizado_em IS NOT NULL THEN TIMESTAMPDIFF(HOUR, created_at, finalizado_em) END) as tempo_medio
       FROM tickets ${where}`,
      params
    );
    
    stats.counts = {
      ...counts[0],
      tempo_medio_resolucao: counts[0].tempo_medio ? `${Math.round(counts[0].tempo_medio)}h` : '0h'
    };

    const [byStatus]: any = await pool.query(
      `SELECT status, COUNT(*) as qtd FROM tickets ${where} GROUP BY status`,
      params
    );
    stats.byStatus = byStatus;

    const [byPriority]: any = await pool.query(
      `SELECT prioridade, COUNT(*) as qtd FROM tickets ${where} GROUP BY prioridade`,
      params
    );
    stats.byPriority = byPriority;

    const [recentTickets]: any = await pool.query(
      `SELECT t.*, u.nome as cliente_nome 
       FROM tickets t
       LEFT JOIN usuarios u ON t.usuario_id = u.id
       ${where} 
       ORDER BY t.created_at DESC LIMIT 5`,
      params
    );
    stats.recentTickets = recentTickets;

    const [atividades]: any = await pool.query(
      `SELECT l.*, u.nome as usuario_nome 
       FROM logs_sistema l
       JOIN usuarios u ON l.usuario_id = u.id
       ${!isDev ? (isAdmin ? 'WHERE u.empresa_id = ?' : 'WHERE l.usuario_id = ?') : ''}
       ORDER BY l.created_at DESC LIMIT 10`,
      !isDev ? (isAdmin ? [empresaId] : [userId]) : []
    );
    stats.recentActivities = atividades;

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
