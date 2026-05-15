import pool from '../db/connection.js';

export async function runAutomations(evento: string, ticket: any, contexto: any) {
  try {
    const [regras]: any = await pool.query(
      'SELECT * FROM ticket_automacoes WHERE empresa_id = ? AND evento = ? AND ativo = 1 ORDER BY ordem ASC',
      [ticket.empresa_id, evento]
    );

    for (const regra of regras) {
      // Very basic validation - would normally evaluate conditions_json
      const condicoes = regra.condicoes_json || [];
      const acoes = regra.acoes_json || [];

      let passed = true;
      for (const cond of condicoes) {
        if (cond.campo === 'status' && ticket.status !== cond.valor) passed = false;
        if (cond.campo === 'prioridade' && ticket.prioridade !== cond.valor) passed = false;
        if (cond.campo === 'categoria' && ticket.categoria !== cond.valor) passed = false;
        if (cond.campo === 'servico' && ticket.servico !== cond.valor) passed = false;
      }

      if (passed) {
        for (const acao of acoes) {
          if (acao.tipo === 'alterar_status') {
            await pool.query('UPDATE tickets SET status = ? WHERE id = ?', [acao.valor, ticket.id]);
            ticket.status = acao.valor;
          }
          if (acao.tipo === 'alterar_prioridade') {
            await pool.query('UPDATE tickets SET prioridade = ? WHERE id = ?', [acao.valor, ticket.id]);
            ticket.prioridade = acao.valor;
          }
          if (acao.tipo === 'atribuir_responsavel') {
            await pool.query('UPDATE tickets SET responsavel_id = ? WHERE id = ?', [acao.valor, ticket.id]);
            ticket.responsavel_id = acao.valor;
          }
          if (acao.tipo === 'adicionar_tag') {
            await pool.query('INSERT IGNORE INTO ticket_tags (ticket_id, tag) VALUES (?, ?)', [ticket.id, acao.valor]);
          }
        }

        await pool.query(
          'INSERT INTO ticket_eventos (ticket_id, empresa_id, tipo, descricao) VALUES (?, ?, ?, ?)',
          [ticket.id, ticket.empresa_id, 'automacao_executada', `Automação executada: ${regra.nome}`]
        );
      }
    }
  } catch (err) {
    console.error('Falha ao executar automações:', err);
  }
}
