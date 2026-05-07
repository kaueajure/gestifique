import pool from '../db/connection.js';
class CompaniesService {
    async list(filters = {}) {
        let query = `
      SELECT e.*, 
             (SELECT COUNT(*) FROM usuarios u WHERE u.empresa_id = e.id) as total_usuarios,
             (SELECT COUNT(*) FROM tickets t WHERE t.empresa_id = e.id) as total_tickets
      FROM empresas e
      WHERE 1=1
    `;
        const params = [];
        if (filters.search) {
            query += ' AND (e.nome LIKE ? OR e.cnpj LIKE ? OR e.email LIKE ?)';
            params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
        }
        if (filters.status === 'ativo') {
            query += ' AND e.ativo = 1';
        }
        else if (filters.status === 'inativo') {
            query += ' AND e.ativo = 0';
        }
        query += ' ORDER BY e.nome ASC';
        const [rows] = await pool.query(query, params);
        return rows;
    }
    async getById(id) {
        const [rows] = await pool.query('SELECT * FROM empresas WHERE id = ?', [id]);
        return rows[0] || null;
    }
    async create(data) {
        const { nome, cnpj, email, telefone, cor_principal = '#2563eb', logo } = data;
        // Duplication Check
        if (cnpj) {
            const [existing] = await pool.query('SELECT id FROM empresas WHERE cnpj = ?', [cnpj]);
            if (existing.length > 0)
                throw new Error('Este CNPJ já está cadastrado.');
        }
        if (email) {
            const [existing] = await pool.query('SELECT id FROM empresas WHERE email = ?', [email]);
            if (existing.length > 0)
                throw new Error('Este E-mail já está cadastrado.');
        }
        const [result] = await pool.query('INSERT INTO empresas (nome, cnpj, email, telefone, cor_principal, logo) VALUES (?, ?, ?, ?, ?, ?)', [nome, cnpj, email, telefone, cor_principal, logo]);
        return result.insertId;
    }
    async update(id, data) {
        const { cnpj, email } = data;
        // Duplication Check (Excluding self)
        if (cnpj) {
            const [existing] = await pool.query('SELECT id FROM empresas WHERE cnpj = ? AND id != ?', [cnpj, id]);
            if (existing.length > 0)
                throw new Error('Este CNPJ já está sendo usado por outra empresa.');
        }
        if (email) {
            const [existing] = await pool.query('SELECT id FROM empresas WHERE email = ? AND id != ?', [email, id]);
            if (existing.length > 0)
                throw new Error('Este E-mail já está sendo usado por outra empresa.');
        }
        const fields = [];
        const params = [];
        Object.keys(data).forEach(key => {
            if (['nome', 'cnpj', 'email', 'telefone', 'ativo', 'cor_principal', 'logo'].includes(key)) {
                fields.push(`${key} = ?`);
                params.push(data[key]);
            }
        });
        if (fields.length === 0)
            return;
        params.push(id);
        await pool.query(`UPDATE empresas SET ${fields.join(', ')} WHERE id = ?`, params);
    }
}
export default new CompaniesService();
