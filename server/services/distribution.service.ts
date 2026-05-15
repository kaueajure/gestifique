import pool from '../db/connection.js';
import { recordTicketEvent } from './ticket-events.service.js';

export async function distributeTicket(ticket: any) {
  try {
    const { id: ticket_id, empresa_id, categoria, servico } = ticket;
    
    // Find matching rule
    const [regras]: any = await pool.query(
      "SELECT * FROM empresa_distribuicao_regras WHERE empresa_id = ? AND ativo = 1 ORDER BY id ASC", [empresa_id]
    );

    let matchedRule = null;
    for (const rule of regras) {
       let matches = true;
       if (rule.categoria && rule.categoria !== categoria) matches = false;
       if (rule.servico && rule.servico !== servico) matches = false;
       if (matches) {
          matchedRule = rule;
          break;
       }
    }

    if (!matchedRule) return null;

    // Get eligible agents
    let agents: any[] = [];
    const config = matchedRule.config_json || {};
    
    if (config.agents && config.agents.length > 0) {
       const agentIds = config.agents.join(',');
       const [rows]: any = await pool.query(`SELECT id FROM usuarios WHERE empresa_id = ? AND id IN (${agentIds}) AND ativo = 1`, [empresa_id]);
       agents = rows;
    } else {
       const [rows]: any = await pool.query(`SELECT id FROM usuarios WHERE empresa_id = ? AND ativo = 1 AND perfil IN ('atendente', 'gestor', 'administrador', 'desenvolvedor')`, [empresa_id]);
       agents = rows;
    }

    if (agents.length === 0) return null;

    let assignedAgentId = null;

    if (matchedRule.metodo === 'menor_carga') {
       let lowestLoad = Infinity;
       for (const agent of agents) {
          const [res]: any = await pool.query("SELECT COUNT(*) as cnt FROM tickets WHERE responsavel_id = ? AND status IN ('aberto', 'em_andamento')", [agent.id]);
          const load = res[0].cnt;
          if (load < lowestLoad) {
             lowestLoad = load;
             assignedAgentId = agent.id;
          }
       }
    } else {
       // round_robin
       // Pick a random for now since state preserving is complex without schema change, 
       // but wait, we can store state in config_json or another table.
       // For a simple robust way, we can check who got the last ticket.
       const [lastTicketRes]: any = await pool.query("SELECT responsavel_id FROM tickets WHERE responsavel_id IS NOT NULL AND empresa_id = ? ORDER BY id DESC LIMIT 1", [empresa_id]);
       
       let lastAgentId = lastTicketRes.length > 0 ? lastTicketRes[0].responsavel_id : null;
       
       let nextIndex = 0;
       if (lastAgentId) {
          const idx = agents.findIndex(a => a.id === lastAgentId);
          if (idx !== -1) {
             nextIndex = (idx + 1) % agents.length;
          }
       }
       assignedAgentId = agents[nextIndex].id;
    }

    if (assignedAgentId) {
       await pool.query('UPDATE tickets SET responsavel_id = ? WHERE id = ?', [assignedAgentId, ticket_id]);
       await recordTicketEvent({
         ticket_id,
         empresa_id,
         tipo: 'distribuicao_automatica',
         descricao: `Atribuído para usuário ID ${assignedAgentId} via regra ${matchedRule.nome}`
       });
       return assignedAgentId;
    }

    return null;
  } catch (err) {
    console.error('Error in distribution', err);
    return null;
  }
}
