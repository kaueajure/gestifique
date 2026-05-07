import pool from '../db/connection.js';
class LogsService {
    async list(filters) {
        const { empresa_id, usuario_id, acao, de, ate, is_dev } = filters;
        let query = `
      SELECT l.*, u.nome as usuario_nome, e.nome as empresa_nome
      FROM logs_sistema l
      LEFT JOIN usuarios u ON l.usuario_id = u.id
      LEFT JOIN empresas e ON l.empresa_id = e.id
      WHERE 1=1
    `;
        const params = [];
        if (!is_dev) {
            query += ' AND l.empresa_id = ?';
            params.push(empresa_id);
        }
        if (usuario_id) {
            query += ' AND l.usuario_id = ?';
            params.push(usuario_id);
        }
        if (acao) {
            query += ' AND l.acao = ?';
            params.push(acao);
        }
        if (de) {
            query += ' AND l.created_at >= ?';
            params.push(de);
        }
        if (ate) {
            query += ' AND l.created_at <= ?';
            params.push(ate);
        }
        query += ' ORDER BY l.created_at DESC LIMIT 100';
        const [rows] = await pool.query(query, params);
        return rows;
    }
}
export default new LogsService();
