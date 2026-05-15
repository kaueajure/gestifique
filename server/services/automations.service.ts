import pool from '../db/connection.js';
import { recordTicketEvent } from './ticket-events.service.js';

const parseJsonArray = (value: any) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

function getTicketField(ticket: any, campo: string) {
  switch (campo) {
    case 'status': return ticket.status;
    case 'prioridade': return ticket.prioridade;
    case 'categoria': return ticket.categoria;
    case 'servico': return ticket.servico;
    case 'origem': return ticket.origem;
    case 'responsavel':
    case 'responsavel_id': return ticket.responsavel_id;
    case 'sem_responsavel': return ticket.responsavel_id ? 'false' : 'true';
    default: return undefined;
  }
}

function evaluateCondition(ticket: any, cond: any) {
  const fieldValue = getTicketField(ticket, cond.campo);
  const expected = cond.valor;

  if (cond.campo === 'sem_responsavel') {
    return !ticket.responsavel_id;
  }

  switch (cond.operador) {
    case 'igual':
      return String(fieldValue ?? '') === String(expected ?? '');
    case 'diferente':
      return String(fieldValue ?? '') !== String(expected ?? '');
    case 'contem':
      return String(fieldValue ?? '').toLowerCase().includes(String(expected ?? '').toLowerCase());
    default:
      return String(fieldValue ?? '') === String(expected ?? '');
  }
}

export async function runAutomations(evento: string, ticket: any, contexto: any) {
  // Prevent recursive automation loops
  if (contexto?.isInternalAutomation) return;

  try {
    const [regras]: any = await pool.query(
      'SELECT * FROM ticket_automacoes WHERE empresa_id = ? AND evento = ? AND ativo = 1 ORDER BY ordem ASC',
      [ticket.empresa_id, evento]
    );

    for (const regra of regras) {
      const condicoes = parseJsonArray(regra.condicoes_json);
      const acoes = parseJsonArray(regra.acoes_json);

      if (acoes.length === 0) continue;

      let passed = true;
      for (const cond of condicoes) {
        if (!evaluateCondition(ticket, cond)) {
          passed = false;
          break;
        }
      }

      if (passed) {
        let acted = false;
        for (const acao of acoes) {
          if (acao.tipo === 'alterar_status' && acao.valor) {
            await pool.query('UPDATE tickets SET status = ? WHERE id = ?', [acao.valor, ticket.id]);
            ticket.status = acao.valor;
            acted = true;
          }
          if (acao.tipo === 'alterar_prioridade' && acao.valor) {
            await pool.query('UPDATE tickets SET prioridade = ? WHERE id = ?', [acao.valor, ticket.id]);
            ticket.prioridade = acao.valor;
            acted = true;
          }
          if (acao.tipo === 'atribuir_responsavel' && acao.valor) {
            await pool.query('UPDATE tickets SET responsavel_id = ? WHERE id = ?', [acao.valor, ticket.id]);
            ticket.responsavel_id = acao.valor;
            acted = true;
          }
          if (acao.tipo === 'adicionar_tag' && acao.valor) {
            await pool.query('INSERT IGNORE INTO ticket_tags (ticket_id, tag) VALUES (?, ?)', [ticket.id, acao.valor]);
            acted = true;
          }
        }

        if (acted) {
          await recordTicketEvent({
            ticket_id: ticket.id,
            empresa_id: ticket.empresa_id,
            usuario_id: contexto?.usuario_id || null,
            tipo: 'automacao_executada',
            descricao: `Automação executada: ${regra.nome}`
          });
        }
      }
    }
  } catch (err) {
    console.error('Falha ao executar automações:', err);
  }
}
