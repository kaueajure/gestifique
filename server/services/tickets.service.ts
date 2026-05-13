import  pool from  '../db/connection.js';
import notificationsService from './notifications.service.js';
import { sendTicketNotification } from '../utils/mailer.js';

export function toPositiveInt(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (Array.isArray(value)) value = value[0];

  const str = String(value).trim();

  if (
    str === '' ||
    str === 'undefined' ||
    str === 'null' ||
    str === 'NaN' ||
    str === 'todos' ||
    str === 'todas'
  ) {
    return undefined;
  }

  const n = Number(str);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

class TicketsService {
  async cleanupSpam() {
    // Delete tickets created in the last 12 hours that might be spam (too many from same user/subject)
    const [spamUsers]: any = await pool.query(`
      SELECT usuario_id, titulo, COUNT(*) as cnt 
      FROM tickets 
      WHERE created_at > (NOW() - INTERVAL 12 HOUR)
      GROUP BY usuario_id, titulo
      HAVING cnt > 5 
    `);

    let deletedCount = 0;
    for (const spam of spamUsers) {
      const [result]: any = await pool.query(
        'DELETE FROM tickets WHERE usuario_id = ? AND titulo = ? AND created_at > (NOW() - INTERVAL 12 HOUR)',
        [spam.usuario_id, spam.titulo]
      );
      deletedCount += result.affectedRows;
    }

    return { deletedCount };
  }

  async list(filters: any) {
    const { empresa_id, usuario_id, is_dev, is_admin, status, prioridade, categoria, search, responsavel_id, fila, page = 1, limit = 20 } = filters;
    const searchTerm = search;
    
    let baseWhere = 'WHERE 1=1';
    let summaryWhere = 'WHERE 1=1';
    const params: (string | number)[] = [];

    // Regra de Negócio: Se não for desenvolvedor, só vê chamados da própria empresa
    if (!is_dev) {
      baseWhere += ' AND t.empresa_id = ?';
      summaryWhere += ' AND t.empresa_id = ?';
      params.push(empresa_id);
    } else {
      const empresaIdFilter = toPositiveInt(filters.empresa_id_filter);
      if (empresaIdFilter) {
        baseWhere += ' AND t.empresa_id = ?';
        summaryWhere += ' AND t.empresa_id = ?';
        params.push(empresaIdFilter);
      }
    }

    // Smart Queues (Filas Inteligentes)
    if (fila && fila !== 'todos') {
      switch (fila) {
        case 'meus':
          baseWhere += ' AND t.responsavel_id = ?';
          summaryWhere += ' AND t.responsavel_id = ?';
          params.push(usuario_id);
          break;
        case 'sem_responsavel':
          baseWhere += ' AND t.responsavel_id IS NULL';
          summaryWhere += ' AND t.responsavel_id IS NULL';
          break;
        case 'urgentes':
          baseWhere += " AND t.prioridade IN ('alta', 'urgente')";
          summaryWhere += " AND t.prioridade IN ('alta', 'urgente')";
          break;
        case 'sla_vencido':
          baseWhere += " AND t.prazo_sla < NOW() AND t.status NOT IN ('resolvido', 'fechado')";
          summaryWhere += " AND t.prazo_sla < NOW() AND t.status NOT IN ('resolvido', 'fechado')";
          break;
        case 'vence_em_breve':
          baseWhere += " AND t.prazo_sla BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 2 HOUR) AND t.status NOT IN ('resolvido', 'fechado')";
          summaryWhere += " AND t.prazo_sla BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 2 HOUR) AND t.status NOT IN ('resolvido', 'fechado')";
          break;
        case 'aguardando_cliente':
          baseWhere += " AND t.status = 'aguardando_cliente'";
          summaryWhere += " AND t.status = 'aguardando_cliente'";
          break;
      }
    }

    // Common Filters (for both items and summary)
    if (prioridade && prioridade !== 'todas') {
      baseWhere += ' AND t.prioridade = ?';
      summaryWhere += ' AND t.prioridade = ?';
      params.push(prioridade);
    }
    if (categoria && categoria !== 'todas') {
      baseWhere += ' AND t.categoria = ?';
      summaryWhere += ' AND t.categoria = ?';
      params.push(categoria);
    }
    const safeResponsavelId = toPositiveInt(responsavel_id);
    if (safeResponsavelId) {
      baseWhere += ' AND t.responsavel_id = ?';
      summaryWhere += ' AND t.responsavel_id = ?';
      params.push(safeResponsavelId);
    }
    if (searchTerm) {
      const searchPattern = `%${searchTerm}%`;
      const searchParts = ' AND (t.titulo LIKE ? OR t.descricao LIKE ? OR CAST(t.id AS CHAR) = ? OR u.nome LIKE ?)';
      baseWhere += searchParts;
      summaryWhere += searchParts;
      params.push(searchPattern, searchPattern, searchTerm, searchPattern);
    }

    // Status is only for items in list view
    const summaryParams = [...params]; // copy params for summary
    
    if (status && status !== 'todos') {
      baseWhere += ' AND t.status = ?';
      params.push(status);
    }

    // Summary calculation
    const [summaryRows]: any = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN t.status = 'aberto' THEN 1 ELSE 0 END) as aberto,
        SUM(CASE WHEN t.status = 'em_andamento' THEN 1 ELSE 0 END) as em_andamento,
        SUM(CASE WHEN t.status = 'aguardando_cliente' THEN 1 ELSE 0 END) as aguardando_cliente,
        SUM(CASE WHEN t.status = 'resolvido' THEN 1 ELSE 0 END) as resolvido,
        SUM(CASE WHEN t.status = 'fechado' THEN 1 ELSE 0 END) as fechado
      FROM tickets t
      LEFT JOIN usuarios u ON t.usuario_id = u.id
      ${summaryWhere}
    `, summaryParams);

    const summary = summaryRows[0] || { total: 0, aberto: 0, em_andamento: 0, aguardando_cliente: 0, resolvido: 0, fechado: 0 };
    const total = Number(summary.total || 0);

    // Fetch items
    const safePage = toPositiveInt(page) ?? 1;
    const safeLimit = toPositiveInt(limit) ?? 20;
    const offset = (safePage - 1) * safeLimit;
    const [items]: any = await pool.query(`
      SELECT t.*, 
             COALESCE(t.solicitante_nome, u.nome, 'Usuário Removido') as cliente_nome, 
             COALESCE(t.solicitante_email, u.email, 'Usuário Removido') as cliente_email, 
             COALESCE(r.nome, 'Não Atribuído') as responsavel_nome, 
             e.nome as empresa_nome
      FROM tickets t
      LEFT JOIN usuarios u ON t.usuario_id = u.id
      LEFT JOIN empresas e ON t.empresa_id = e.id
      LEFT JOIN usuarios r ON t.responsavel_id = r.id
      ${baseWhere}
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, safeLimit, offset]);

    return {
      data: items,
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit)
      },
      summary: {
        total: Number(summary.total || 0),
        aberto: Number(summary.aberto || 0),
        em_andamento: Number(summary.em_andamento || 0),
        aguardando_cliente: Number(summary.aguardando_cliente || 0),
        resolvido: Number(summary.resolvido || 0),
        fechado: Number(summary.fechado || 0)
      },
      queues: await this.getQueuesCounts(filters)
    };
  }

  async getQueuesCounts(filters: any) {
    const { empresa_id, usuario_id, is_dev } = filters;
    
    let baseWhere = 'WHERE 1=1';
    const params: (string | number)[] = [];

    if (!is_dev) {
      baseWhere += ' AND empresa_id = ?';
      params.push(empresa_id);
    } else {
      const empresaIdFilter = toPositiveInt(filters.empresa_id_filter);
      if (empresaIdFilter) {
        baseWhere += ' AND empresa_id = ?';
        params.push(empresaIdFilter);
      } else {
        // If dev hasn't selected a company, we might want to return 0s or total across all companies
        // But usually dev selects a company. If not, this might be called without empresa_id.
        // Let's assume dev needs a company filter for these queues to be meaningful.
        return {
          todos: 0, meus: 0, sem_responsavel: 0, urgentes: 0, sla_vencido: 0, vence_em_breve: 0, aguardando_cliente: 0
        };
      }
    }

    const [rows]: any = await pool.query(`
      SELECT 
        COUNT(*) as todos,
        SUM(CASE WHEN responsavel_id = ? THEN 1 ELSE 0 END) as meus,
        SUM(CASE WHEN responsavel_id IS NULL THEN 1 ELSE 0 END) as sem_responsavel,
        SUM(CASE WHEN prioridade IN ('alta', 'urgente') THEN 1 ELSE 0 END) as urgentes,
        SUM(CASE WHEN prazo_sla < NOW() AND status NOT IN ('resolvido', 'fechado') THEN 1 ELSE 0 END) as sla_vencido,
        SUM(CASE WHEN prazo_sla BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 2 HOUR) AND status NOT IN ('resolvido', 'fechado') THEN 1 ELSE 0 END) as vence_em_breve,
        SUM(CASE WHEN status = 'aguardando_cliente' THEN 1 ELSE 0 END) as aguardando_cliente
      FROM tickets
      ${baseWhere}
    `, [usuario_id, ...params]);

    const res = rows[0] || {};
    return {
      todos: Number(res.todos || 0),
      meus: Number(res.meus || 0),
      sem_responsavel: Number(res.sem_responsavel || 0),
      urgentes: Number(res.urgentes || 0),
      sla_vencido: Number(res.sla_vencido || 0),
      vence_em_breve: Number(res.vence_em_breve || 0),
      aguardando_cliente: Number(res.aguardando_cliente || 0)
    };
  }

  async getKanban(filters: any) {
    const { empresa_id, usuario_id, is_dev, is_admin, responsavel_id, search, prioridade, categoria, status, fila } = filters;
    const searchTerm = search;
    
    let baseWhere = 'WHERE 1=1';
    let summaryWhere = 'WHERE 1=1';
    const params: (string | number)[] = [];

    // Regra de Negócio: Se não for desenvolvedor, só vê chamados da própria empresa
    if (!is_dev) {
      baseWhere += ' AND t.empresa_id = ?';
      summaryWhere += ' AND t.empresa_id = ?';
      params.push(empresa_id);
    } else {
      const empresaIdFilter = toPositiveInt(filters.empresa_id_filter);
      if (empresaIdFilter) {
        baseWhere += ' AND t.empresa_id = ?';
        summaryWhere += ' AND t.empresa_id = ?';
        params.push(empresaIdFilter);
      }
    }

    // Smart Queues (Filas Inteligentes)
    if (fila && fila !== 'todos') {
      switch (fila) {
        case 'meus':
          baseWhere += ' AND t.responsavel_id = ?';
          summaryWhere += ' AND t.responsavel_id = ?';
          params.push(usuario_id);
          break;
        case 'sem_responsavel':
          baseWhere += ' AND t.responsavel_id IS NULL';
          summaryWhere += ' AND t.responsavel_id IS NULL';
          break;
        case 'urgentes':
          baseWhere += " AND t.prioridade IN ('alta', 'urgente')";
          summaryWhere += " AND t.prioridade IN ('alta', 'urgente')";
          break;
        case 'sla_vencido':
          baseWhere += " AND t.prazo_sla < NOW() AND t.status NOT IN ('resolvido', 'fechado')";
          summaryWhere += " AND t.prazo_sla < NOW() AND t.status NOT IN ('resolvido', 'fechado')";
          break;
        case 'vence_em_breve':
          baseWhere += " AND t.prazo_sla BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 2 HOUR) AND t.status NOT IN ('resolvido', 'fechado')";
          summaryWhere += " AND t.prazo_sla BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 2 HOUR) AND t.status NOT IN ('resolvido', 'fechado')";
          break;
        case 'aguardando_cliente':
          baseWhere += " AND t.status = 'aguardando_cliente'";
          summaryWhere += " AND t.status = 'aguardando_cliente'";
          break;
      }
    }
    
    // Common Filters
    const safeResponsavelId = toPositiveInt(responsavel_id);
    if (safeResponsavelId) {
       baseWhere += ' AND t.responsavel_id = ?';
       summaryWhere += ' AND t.responsavel_id = ?';
       params.push(safeResponsavelId);
    }
    if (prioridade && prioridade !== 'todas') {
       baseWhere += ' AND t.prioridade = ?';
       summaryWhere += ' AND t.prioridade = ?';
       params.push(prioridade);
    }
    if (categoria && categoria !== 'todas') {
       baseWhere += ' AND t.categoria = ?';
       summaryWhere += ' AND t.categoria = ?';
       params.push(categoria);
    }
    if (searchTerm) {
       const searchPattern = `%${searchTerm}%`;
       baseWhere += ' AND (t.titulo LIKE ? OR t.descricao LIKE ? OR CAST(t.id AS CHAR) = ? OR u.nome LIKE ?)';
       summaryWhere += ' AND (t.titulo LIKE ? OR t.descricao LIKE ? OR CAST(t.id AS CHAR) = ? OR u.nome LIKE ?)';
       params.push(searchPattern, searchPattern, searchTerm, searchPattern);
    }

    if (status && status !== 'todos') {
       baseWhere += ' AND t.status = ?';
       summaryWhere += ' AND t.status = ?';
       params.push(status);
    }

    const summaryParams = [...params];

    const [tickets]: any = await pool.query(`
      SELECT t.id, t.titulo, t.status, t.prioridade, t.categoria, t.created_at, t.empresa_id,
             COALESCE(t.solicitante_nome, u.nome, 'Usuário Removido') as cliente_nome, 
             COALESCE(t.solicitante_email, u.email, 'Usuário Removido') as cliente_email, 
             COALESCE(r.nome, 'Não Atribuído') as responsavel_nome, 
             e.nome as empresa_nome
      FROM tickets t
      LEFT JOIN usuarios u ON t.usuario_id = u.id
      LEFT JOIN empresas e ON t.empresa_id = e.id
      LEFT JOIN usuarios r ON t.responsavel_id = r.id
      ${baseWhere}
      ORDER BY t.created_at DESC
    `, params);

    const [summaryRows]: any = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN t.status = 'aberto' THEN 1 ELSE 0 END) as aberto,
        SUM(CASE WHEN t.status = 'em_andamento' THEN 1 ELSE 0 END) as em_andamento,
        SUM(CASE WHEN t.status = 'aguardando_cliente' THEN 1 ELSE 0 END) as aguardando_cliente,
        SUM(CASE WHEN t.status = 'resolvido' THEN 1 ELSE 0 END) as resolvido,
        SUM(CASE WHEN t.status = 'fechado' THEN 1 ELSE 0 END) as fechado
      FROM tickets t
      LEFT JOIN usuarios u ON t.usuario_id = u.id
      ${summaryWhere}
    `, summaryParams);
    const summary = summaryRows[0] || { total: 0, aberto: 0, em_andamento: 0, aguardando_cliente: 0, resolvido: 0, fechado: 0 };

    const columnsConfig = [
      { id: 'aberto', title: 'Aberto' },
      { id: 'em_andamento', title: 'Em andamento' },
      { id: 'aguardando_cliente', title: 'Aguardando resposta' },
      { id: 'resolvido', title: 'Finalizado' }
    ];

    const columns = columnsConfig.map(c => {
      const colTickets = tickets.filter((t: any) => t.status === c.id);
      return {
        id: c.id,
        title: c.title,
        count: Number(summary[c.id] || 0),
        tickets: colTickets
      };
    });

    const totals = {
      total: Number(summary.total || 0),
      aberto: Number(summary.aberto || 0),
      em_andamento: Number(summary.em_andamento || 0),
      aguardando_cliente: Number(summary.aguardando_cliente || 0),
      resolvido: Number(summary.resolvido || 0),
      fechado: Number(summary.fechado || 0)
    };

    return { columns, totals, queues: await this.getQueuesCounts(filters) };
  }

  async create(data: any) {
    const { empresa_id, usuario_id, solicitante_nome, solicitante_email, titulo, descricao, prioridade, categoria } = data;

    let horasSla = 24; // media padrão
    if (prioridade === 'urgente') horasSla = 4;
    else if (prioridade === 'alta') horasSla = 12;
    else if (prioridade === 'baixa') horasSla = 48;

    const prazoSla = new Date();
    prazoSla.setHours(prazoSla.getHours() + horasSla);
    const prazoSlaFormatado = prazoSla.toISOString().slice(0, 19).replace('T', ' ');

    const [result]: any = await pool.query(
      'INSERT INTO tickets (empresa_id, usuario_id, solicitante_nome, solicitante_email, titulo, descricao, prioridade, categoria, prazo_sla) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [empresa_id, usuario_id || null, solicitante_nome || null, solicitante_email || null, titulo, descricao, prioridade || 'media', categoria || 'suporte', prazoSlaFormatado]
    );
    const ticketId = result.insertId;

    // Notificações: Admins
    try {
      const [admins]: any = await pool.query(
        'SELECT id FROM usuarios WHERE empresa_id = ? AND administrador = 1',
        [empresa_id]
      );
      
      const adminIds = admins
        .filter((a: any) => a.id !== usuario_id)
        .map((a: any) => a.id);

      let authorName = solicitante_nome || 'Cliente Externo';
      let authorEmail = solicitante_email || '';
      if (usuario_id) {
         const [author]: any = await pool.query('SELECT nome, email FROM usuarios WHERE id = ?', [usuario_id]);
         if (author[0]) {
            authorName = author[0].nome;
            authorEmail = author[0].email;
         }
      }

      if (adminIds.length > 0) {
        await notificationsService.createMany(adminIds, {
          empresa_id,
          tipo: 'TICKET_CREATED',
          titulo: 'Novo atendimento criado',
          mensagem: `${authorName} abriu o chamado #${ticketId}: ${titulo}`,
          link: `ticket:${ticketId}`,
          metadata: { ticketId }
        });
      }

      if (authorEmail) {
        sendTicketNotification(
          authorEmail,
          ticketId,
          titulo,
          `Olá ${authorName}, seu chamado foi registrado com sucesso e em breve nossa equipe fará o atendimento. Detalhes: ${descricao}`
        ).catch(err => console.error('Email error:', err));
      }
    } catch (e) {
      console.error('Erro ao notificar criação de ticket:', e);
    }

    return ticketId;
  }

  async getByIdForUser(id: number, currentUser: any) {
    const ticket = await this.getById(id);
    if (!ticket) return null;

    if (!currentUser.desenvolvedor) {
      if (ticket.empresa_id !== currentUser.empresa_id) return { error: 'forbidden' };
    }
    return ticket;
  }

  async getById(id: number) {
    const [rows]: any = await pool.query(
      `SELECT 
        t.id, t.empresa_id, t.usuario_id, t.responsavel_id, t.titulo, t.descricao, 
        t.status, t.prioridade, t.categoria, t.origem, t.prazo_sla, t.finalizado_em,
        t.created_at, t.updated_at,
        COALESCE(t.solicitante_nome, u.nome, 'Usuário Removido') as cliente_nome, 
        COALESCE(t.solicitante_email, u.email, 'removido@sistema.com') as cliente_email, 
        COALESCE(r.nome, 'Não Atribuído') as responsavel_nome, 
        e.nome as empresa_nome
       FROM tickets t 
       LEFT JOIN usuarios u ON t.usuario_id = u.id 
       JOIN empresas e ON t.empresa_id = e.id
       LEFT JOIN usuarios r ON t.responsavel_id = r.id 
       WHERE t.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async updateStatus(id: number, status: string, changedByUserId: number, req?: any) {
    const validStatuses = ['aberto', 'em_andamento', 'aguardando_cliente', 'resolvido', 'fechado'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Status inválido: ${status}`);
    }

    const oldTicket = await this.getById(id);
    if (!oldTicket) {
      throw new Error('Chamado não encontrado');
    }

    if (oldTicket.status === status) return;

    let finalizado_em = null;
    if (['resolvido', 'fechado'].includes(status)) {
       finalizado_em = new Date().toISOString().slice(0, 19).replace('T', ' ');
    }

    await pool.query(
      `UPDATE tickets SET status = ?, finalizado_em = ${finalizado_em ? '?' : 'NULL'}, updated_at = NOW() WHERE id = ?`,
      finalizado_em ? [status, finalizado_em, id] : [status, id]
    );

    // Logging se req for passado (seria ideal importar o logger, mas vou deixar pro routes)
    // Para simplificar, vou confiar no retorno e deixar o route logar. Mas vou retornar oldTicket para comparar.

    // Notificações de Status
    try {
      const translateStatus: any = { aberto: 'Aberto', em_andamento: 'Em Andamento', aguardando_cliente: 'Aguardando Cliente', resolvido: 'Resolvido', fechado: 'Fechado' };
      const newStatusText = translateStatus[status] || status;

      // Notificar cliente
      if (oldTicket.usuario_id && oldTicket.usuario_id !== changedByUserId) {
        await notificationsService.create({
          usuario_id: oldTicket.usuario_id,
          empresa_id: oldTicket.empresa_id,
          tipo: 'TICKET_STATUS_CHANGED',
          titulo: 'Status atualizado',
          mensagem: `O status do seu chamado #${id} mudou para: ${newStatusText}`,
          link: `ticket:${id}`
        });
      }

      // Notificar responsável (se existir e for diferente do cliente e de quem mudou)
      const currentRespId = oldTicket.responsavel_id;
      if (currentRespId && currentRespId !== oldTicket.usuario_id && currentRespId !== changedByUserId) {
        await notificationsService.create({
          usuario_id: Number(currentRespId),
          empresa_id: oldTicket.empresa_id,
          tipo: 'TICKET_STATUS_CHANGED',
          titulo: 'Status atualizado',
          mensagem: `O chamado #${id} sob sua responsabilidade mudou para: ${newStatusText}`,
          link: `ticket:${id}`
        });
      }
    } catch (e) {
      console.error('Erro ao notificar atualização de status do ticket:', e);
    }

    return { oldStatus: oldTicket.status, newStatus: status, empresa_id: oldTicket.empresa_id };
  }

  async update(id: number, data: any) {
    const oldTicket = await this.getById(id);
    if (!oldTicket) return;

    const fields: string[] = [];
    const paramsList: any[] = [];

    // Finalizado_em logic
    if (data.status) {
      if (['resolvido', 'fechado'].includes(data.status)) {
        fields.push('finalizado_em = NOW()');
      } else {
        fields.push('finalizado_em = NULL');
      }
    }

    Object.keys(data).forEach(key => {
      if (['titulo', 'descricao', 'status', 'prioridade', 'responsavel_id', 'categoria', 'origem', 'prazo_sla'].includes(key)) {
        fields.push(`${key} = ?`);
        paramsList.push(data[key]);
      }
    });

    if (fields.length === 0) return;

    paramsList.push(id);
    await pool.query(`UPDATE tickets SET ${fields.join(', ')} WHERE id = ?`, paramsList);

    // Notificações de Status ou Responsável
    try {
      if (data.responsavel_id && data.responsavel_id !== oldTicket.responsavel_id) {
        await notificationsService.create({
          usuario_id: Number(data.responsavel_id),
          empresa_id: oldTicket.empresa_id,
          tipo: 'TICKET_ASSIGNED',
          titulo: 'Chamado atribuído a você',
          mensagem: `Você é o novo responsável pelo chamado #${id}: ${oldTicket.titulo}`,
          link: `ticket:${id}`
        });
      }

      if (data.status && data.status !== oldTicket.status) {
        const translateStatus: any = { aberto: 'Aberto', em_andamento: 'Em Andamento', aguardando_cliente: 'Aguardando Cliente', resolvido: 'Resolvido', fechado: 'Fechado' };
        const newStatusText = translateStatus[data.status] || data.status;

        // Notificar cliente
        if (oldTicket.usuario_id) {
          await notificationsService.create({
            usuario_id: oldTicket.usuario_id,
            empresa_id: oldTicket.empresa_id,
            tipo: 'TICKET_STATUS_CHANGED',
            titulo: 'Status atualizado',
            mensagem: `O status do seu chamado #${id} mudou para: ${newStatusText}`,
            link: `ticket:${id}`
          });
        }

        // Notificar responsável (se existir e for diferente do cliente)
        const currentRespId = data.responsavel_id || oldTicket.responsavel_id;
        if (currentRespId && currentRespId !== oldTicket.usuario_id) {
          await notificationsService.create({
            usuario_id: Number(currentRespId),
            empresa_id: oldTicket.empresa_id,
            tipo: 'TICKET_STATUS_CHANGED',
            titulo: 'Status atualizado',
            mensagem: `O chamado #${id} sob sua responsabilidade mudou para: ${newStatusText}`,
            link: `ticket:${id}`
          });
        }
      }
    } catch (e) {
      console.error('Erro ao notificar atualização de ticket:', e);
    }
  }

  async getMessages(ticketId: number, includeInternal: boolean) {
    let query = `
      SELECT m.id, m.ticket_id, m.usuario_id, m.mensagem, m.interno, m.anexo, m.created_at,
             COALESCE(u.nome, 'Usuário Removido') as usuario_nome 
      FROM ticket_mensagens m
      LEFT JOIN usuarios u ON m.usuario_id = u.id
      WHERE m.ticket_id = ?
    `;
    if (!includeInternal) query += ' AND m.interno = 0';
    query += ' ORDER BY m.created_at ASC';
    
    const [rows] = await pool.query(query, [ticketId]);
    return rows;
  }

  async addMessage(data: any) {
    const { ticket_id, usuario_id, mensagem, interno } = data;
    const [result]: any = await pool.query(
      'INSERT INTO ticket_mensagens (ticket_id, usuario_id, mensagem, interno) VALUES (?, ?, ?, ?)',
      [ticket_id, usuario_id, mensagem, interno ? 1 : 0]
    );
    const messageId = result.insertId;
    await pool.query('UPDATE tickets SET updated_at = NOW() WHERE id = ?', [ticket_id]);

    // Notificações
    try {
      const ticket = await this.getById(ticket_id);
      if (ticket) {
        const [author]: any = await pool.query('SELECT nome FROM usuarios WHERE id = ?', [usuario_id]);
        const authorName = author[0]?.nome || 'Alguém';

        const recipients = new Set<number>();
        
        // 1. Notificar solicitante se não for ele e não for interno
        if (!interno && ticket.usuario_id && ticket.usuario_id !== usuario_id) {
          recipients.add(ticket.usuario_id);
          if (ticket.cliente_email && ticket.cliente_email !== 'removido@sistema.com') {
             sendTicketNotification(
               ticket.cliente_email,
               ticket_id,
               ticket.titulo,
               `Olá ${ticket.cliente_nome}, você tem uma nova resposta de ${authorName}:<br><br><i>"${mensagem}"</i>`
             ).catch(err => console.error('Email error:', err));
          }
        }

        // 2. Notificar responsável se não for ele
        if (ticket.responsavel_id && ticket.responsavel_id !== usuario_id) {
           recipients.add(ticket.responsavel_id);
        }

        // 3. Se for interno, notificar admins/devs da empresa (que não sejam o autor)
        if (interno) {
           const [admins]: any = await pool.query(
             'SELECT id FROM usuarios WHERE empresa_id = ? AND administrador = 1',
             [ticket.empresa_id]
           );
           admins.forEach((a: any) => {
             if (a.id !== usuario_id) recipients.add(a.id);
           });
        }

        const recipientIds = Array.from(recipients);
        if (recipientIds.length > 0) {
          await notificationsService.createMany(recipientIds, {
            empresa_id: ticket.empresa_id,
            tipo: 'TICKET_MESSAGE',
            titulo: interno ? 'Nota interna no chamado' : 'Nova resposta no chamado',
            mensagem: `${authorName}: ${mensagem.substring(0, 100)}${mensagem.length > 100 ? '...' : ''}`,
            link: `ticket:${ticket_id}`,
            metadata: { ticketId: ticket_id, messageId }
          });
        }
      }
    } catch (e) {
      console.error('Erro ao notificar nova mensagem:', e);
    }

    return messageId;
  }

  async getTimeline(ticketId: number, includeInternal: boolean) {
    const ticket = await this.getById(ticketId);
    if (!ticket) return null;

    const timeline: any[] = [];
    
    // 1. Initial Creation
    timeline.push({
      type: 'creation',
      date: ticket.created_at,
      author: ticket.cliente_nome || 'Cliente',
      description: 'Chamado aberto no sistema',
      icon: 'plus-circle'
    });

    // 2. Messages
    let msgQuery = `
      SELECT m.*, u.nome as usuario_nome 
      FROM ticket_mensagens m
      LEFT JOIN usuarios u ON m.usuario_id = u.id
      WHERE m.ticket_id = ?
    `;
    if (!includeInternal) msgQuery += ' AND m.interno = 0';
    
    const [messages]: any = await pool.query(msgQuery, [ticketId]);

    messages.forEach((m: any) => {
      timeline.push({
        type: m.interno ? 'internal_note' : 'response',
        date: m.created_at,
        author: m.usuario_nome || 'Usuário',
        description: m.mensagem.length > 200 ? m.mensagem.substring(0, 197) + '...' : m.mensagem,
        id: m.id,
        is_internal: !!m.interno,
        icon: m.interno ? 'lock' : 'message-circle'
      });
    });

    // 3. System Logs (Tracking status, assignment, etc)
    const [logs]: any = await pool.query(`
      SELECT l.*, u.nome as usuario_nome 
      FROM logs_sistema l
      LEFT JOIN usuarios u ON l.usuario_id = u.id
      WHERE l.descricao LIKE ?
    `, [`%#${ticketId}[^0-9]%`, `%#${ticketId}`]); 
    // The regex-like search in SQL depends on the DB, MySQL LIKE is simple.
    // Let's just use LIKE '%#ID %' or LIKE '%#ID' or similar to be safer.
    // Actually, searching for exactly "#ID" inside the string.

    const [logsSafe]: any = await pool.query(`
      SELECT l.*, u.nome as usuario_nome 
      FROM logs_sistema l
      LEFT JOIN usuarios u ON l.usuario_id = u.id
      WHERE (l.descricao LIKE ? OR l.descricao LIKE ?)
    `, [`%#${ticketId} %`, `%#${ticketId}`]);

    logsSafe.forEach((l: any) => {
      let icon = 'activity';
      if (l.acao === 'TICKET_STATUS_CHANGE') icon = 'refresh-cw';
      if (l.acao === 'TICKET_UPDATE' && l.descricao.includes('responsável')) icon = 'user-check';
      if (l.acao === 'ATTACHMENT_UPLOAD') icon = 'paperclip';

      timeline.push({
        type: 'system',
        date: l.created_at,
        author: l.usuario_nome || 'Sistema',
        action: l.acao,
        description: l.descricao,
        icon
      });
    });

    // 4. Finalization (if any)
    if (ticket.finalizado_em) {
       timeline.push({
         type: 'completion',
         date: ticket.finalizado_em,
         author: 'Sistema',
         description: `Chamado marcado como ${ticket.status === 'resolvido' ? 'Resolvido' : 'Fechado'}`,
         icon: 'check-circle'
       });
    }

    // Sort by date
    timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return timeline;
  }
}

export default new TicketsService();
