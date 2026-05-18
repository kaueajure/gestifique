import pool from '../db/connection.js';
import { runAutomations } from '../services/automations.service.js';

export const runTicketAutomations = async () => {
  try {
    const [regras]: any = await pool.query(
      "SELECT * FROM ticket_automacoes WHERE ativo = 1 AND evento IN ('tempo_sem_interacao', 'aguardando_cliente_por_tempo', 'sla_primeira_resposta_vencido', 'sla_resolucao_vencido')"
    );

    for (const regra of regras) {
       let query = "";
       let params: any[] = [];

       if (regra.evento === 'sla_resolucao_vencido') {
         query = `
           SELECT * FROM tickets 
           WHERE status NOT IN ('resolvido', 'fechado', 'aguardando_cliente')
           AND sla_pausado_em IS NULL
           AND sla_status_operacional != 'pausado'
           AND (sla_resolucao_status != 'violado' OR sla_resolucao_status IS NULL)
           AND prazo_sla < NOW()
           AND empresa_id = ?
         `;
         params = [regra.empresa_id];
       } 
       else if (regra.evento === 'sla_primeira_resposta_vencido') {
         query = `
           SELECT * FROM tickets 
           WHERE status IN ('aberto', 'em_andamento')
           AND primeira_resposta_em IS NULL
           AND (sla_primeira_resposta_status = 'aguardando' OR sla_primeira_resposta_status IS NULL)
           AND prazo_primeira_resposta < NOW()
           AND empresa_id = ?
         `;
         params = [regra.empresa_id];
       }
       else if (regra.evento === 'aguardando_cliente_por_tempo') {
         // This typically requires at least one condition of "hours_since_update" in the Rule
         // But for simplicity in the job, we'll just fetch tickets in that status
         query = `
           SELECT * FROM tickets 
           WHERE status = 'aguardando_cliente'
           AND empresa_id = ?
         `;
         params = [regra.empresa_id];
       }
       else if (regra.evento === 'tempo_sem_interacao') {
         query = `
           SELECT * FROM tickets 
           WHERE status NOT IN ('resolvido', 'fechado')
           AND empresa_id = ?
         `;
         params = [regra.empresa_id];
       }

       if (query) {
         const [tickets]: any = await pool.query(query, params);
         for (const ticket of tickets) {
            // runAutomations internally evaluates conditions (like hours_since_update)
            await runAutomations(regra.evento, ticket, { isInternalAutomation: false, usuario_id: null });
         }
       }
    }

    // Baseline SLA violation update for tickets without specific rules.
    // Sprint 2: Respect paused tickets
    await pool.query(`
      UPDATE tickets 
      SET sla_resolucao_status = 'violado', 
          sla_status_operacional = 'violado',
          updated_at = NOW() 
      WHERE status NOT IN ('resolvido', 'fechado', 'aguardando_cliente') 
      AND (sla_resolucao_status != 'violado' OR sla_resolucao_status IS NULL)
      AND sla_pausado_em IS NULL
      AND prazo_sla < NOW()
    `);

    await pool.query(`
      UPDATE tickets 
      SET sla_primeira_resposta_status = 'violado', 
          updated_at = NOW() 
      WHERE status IN ('aberto', 'em_andamento')
      AND primeira_resposta_em IS NULL
      AND (sla_primeira_resposta_status = 'aguardando' OR sla_primeira_resposta_status IS NULL)
      AND prazo_primeira_resposta < NOW()
    `);

    // Sync other operacional statuses for non-paused, non-resolved tickets
    await pool.query(`
      UPDATE tickets
      SET sla_status_operacional = CASE
        WHEN prazo_sla < NOW() THEN 'vencido'
        WHEN prazo_sla BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 2 HOUR) THEN 'vencendo'
        ELSE 'dentro_sla'
      END
      WHERE status NOT IN ('resolvido', 'fechado', 'aguardando_cliente')
      AND sla_pausado_em IS NULL
      AND prazo_sla IS NOT NULL
    `);

  } catch (err) {
    console.error('[Automations] Erro ao rodar rotina de automacao:', err);
  }
};

