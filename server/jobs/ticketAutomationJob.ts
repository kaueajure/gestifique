import pool from '../db/connection.js';

export const runTicketAutomations = async () => {
  try {
    const conn = await pool.getConnection();

    try {
      // Find open tickets with SLAs that just missed the deadline
      const [overdueTickets]: any = await conn.query(`
        SELECT id, empresa_id, usuario_id, titulo, sla_status
        FROM tickets
        WHERE status IN ('aberto', 'em_andamento')
        AND (sla_status != 'violado' OR sla_status IS NULL)
        AND prazo_sla IS NOT NULL
        AND prazo_sla < NOW()
      `);

      for (const ticket of overdueTickets) {
        await conn.beginTransaction();

        // Update SLA status
        await conn.query(`
          UPDATE tickets 
          SET sla_status = 'violado', updated_at = NOW() 
          WHERE id = ?
        `, [ticket.id]);

        // Add internal message
        await conn.query(`
          INSERT INTO ticket_mensagens (ticket_id, usuario_id, mensagem, tipo, interno)
          VALUES (?, NULL, 'SLA de atendimento violado automaticamente pelo sistema.', 'status_change', 1)
        `, [ticket.id]);

        // Add log
        await conn.query(`
          INSERT INTO logs_sistema (empresa_id, usuario_id, acao, descricao)
          VALUES (?, NULL, 'ticket_alerta', ?)
        `, [ticket.empresa_id, `SLA Vencido para Chamado #${ticket.id}`]);

        await conn.commit();
      }

      // Check configured rules if any
      const [automations]: any = await conn.query(`
        SELECT * FROM ticket_automacoes WHERE ativo = 1 AND evento = 'tempo_sem_interacao'
      `);

      // Basic simple example: Close ticket after 7 days waiting for client
      const [abandonedTickets]: any = await conn.query(`
        SELECT id, empresa_id, titulo
        FROM tickets
        WHERE status = 'aguardando_cliente'
        AND updated_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
      `);

      for (const ticket of abandonedTickets) {
        await conn.beginTransaction();

        await conn.query(`
          UPDATE tickets
          SET status = 'fechado', updated_at = NOW(), finalizado_em = NOW(), resolucao_motivo = 'Sem resposta do cliente por 7 dias'
          WHERE id = ?
        `, [ticket.id]);

        await conn.query(`
          INSERT INTO ticket_mensagens (ticket_id, usuario_id, mensagem, tipo, interno)
          VALUES (?, NULL, 'Chamado fechado automaticamente por falta de interação do cliente.', 'status_change', 0)
        `, [ticket.id]);

        await conn.commit();
      }

    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('[Automations] Erro ao rodar rotina de automacao:', err);
  }
};
