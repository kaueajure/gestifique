import { Router } from 'express';
import pool from '../db/connection.js';
const router = Router();
router.get('/:token', async (req, res) => {
    const { token } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM ticket_satisfacao WHERE token = ?', [token]);
        if (rows.length === 0)
            return res.status(404).json({ error: 'Pesquisa não encontrada ou inválida.' });
        res.json(rows[0]);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao buscar pesquisa.' });
    }
});
router.post('/:token', async (req, res) => {
    const { token } = req.params;
    const { nota, comentario } = req.body;
    if (typeof nota !== 'number' || nota < 1 || nota > 5) {
        return res.status(400).json({ error: 'Nota deve ser entre 1 e 5.' });
    }
    try {
        const [rows] = await pool.query('SELECT * FROM ticket_satisfacao WHERE token = ?', [token]);
        if (rows.length === 0)
            return res.status(404).json({ error: 'Pesquisa não encontrada ou inválida.' });
        const csat = rows[0];
        if (csat.respondido_em) {
            return res.status(400).json({ error: 'Pesquisa já respondida.' });
        }
        await pool.query('UPDATE ticket_satisfacao SET nota = ?, comentario = ?, respondido_em = NOW() WHERE token = ?', [nota, comentario || null, token]);
        try {
            const { recordTicketEvent } = await import('../services/ticket-events.service.js');
            await recordTicketEvent({
                ticket_id: csat.ticket_id,
                empresa_id: csat.empresa_id,
                tipo: 'satisfacao_respondida',
                descricao: `Cliente respondeu CSAT com nota ${nota}`
            });
        }
        catch (e) {
            await pool.query('INSERT INTO ticket_eventos (ticket_id, empresa_id, tipo, descricao) VALUES (?, ?, ?, ?)', [csat.ticket_id, csat.empresa_id, 'satisfacao_respondida', `Cliente respondeu CSAT com nota ${nota}`]);
        }
        res.json({ success: true, message: 'Avaliação registrada com sucesso.' });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao registrar avaliação.' });
    }
});
export default router;
