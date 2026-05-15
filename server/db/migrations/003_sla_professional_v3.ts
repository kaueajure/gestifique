import { PoolConnection } from 'mysql2/promise';

export async function up(connection: PoolConnection) {
  // Add new SLA columns to tickets table
  await connection.query(`
    ALTER TABLE tickets 
    ADD COLUMN prazo_primeira_resposta DATETIME NULL AFTER prazo_sla,
    ADD COLUMN primeira_resposta_em DATETIME NULL AFTER prazo_primeira_resposta,
    ADD COLUMN sla_primeira_resposta_status VARCHAR(50) NULL AFTER primeira_resposta_em,
    ADD COLUMN sla_resolucao_status VARCHAR(50) NULL AFTER sla_primeira_resposta_status
  `);

  // Initialize resolution status for existing resolved tickets if possible
  await connection.query(`
    UPDATE tickets 
    SET sla_resolucao_status = CASE 
      WHEN finalizado_em <= prazo_sla THEN 'cumprido'
      WHEN finalizado_em > prazo_sla THEN 'violado'
      ELSE NULL
    END
    WHERE status IN ('resolvido', 'fechado') AND finalizado_em IS NOT NULL AND prazo_sla IS NOT NULL
  `);
}
