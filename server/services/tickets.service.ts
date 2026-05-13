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
  private isValidDateOnly(value: unknown): value is string {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
  }

  private applyAdvancedFilters(
    baseWhere: string,
    summaryWhere: string,
    params: (string | number)[],
    filters: any
  ): { baseWhere: string; summaryWhere: string; params: (string | number)[] } {
    const { 
      tag, origem, created_from, created_to, 
      updated_from, updated_to, sla_status, custom_field_search 
    } = filters;

    if (tag) {
      const normalizedTag = this.normalizeTag(tag);
      if (normalizedTag) {
        const tagParts = ' AND EXISTS (SELECT 1 FROM ticket_tags tt WHERE tt.ticket_id = t.id AND tt.tag = ?)';
        baseWhere += tagParts;
        summaryWhere += tagParts;
        params.push(normalizedTag);
      }
    }

    if (origem) {
      baseWhere += ' AND t.origem = ?';
      summaryWhere += ' AND t.origem = ?';
      params.push(origem);
    }

    if (this.isValidDateOnly(created_from)) {
      baseWhere += ' AND t.created_at >= ?';
      summaryWhere += ' AND t.created_at >= ?';
      params.push(`${created_from} 00:00:00`);
    }

    if (this.isValidDateOnly(created_to)) {
      baseWhere += ' AND t.created_at <= ?';
      summaryWhere += ' AND t.created_at <= ?';
      params.push(`${created_to} 23:59:59`);
    }

    if (this.isValidDateOnly(updated_from)) {
      baseWhere += ' AND t.updated_at >= ?';
      summaryWhere += ' AND t.updated_at >= ?';
      params.push(`${updated_from} 00:00:00`);
    }

    if (this.isValidDateOnly(updated_to)) {
      baseWhere += ' AND t.updated_at <= ?';
      summaryWhere += ' AND t.updated_at <= ?';
      params.push(`${updated_to} 23:59:59`);
    }

    if (sla_status && sla_status !== 'todos') {
      let slaPart = '';
      switch (sla_status) {
        case 'dentro_sla':
          slaPart = " AND t.prazo_sla > DATE_ADD(NOW(), INTERVAL 2 HOUR) AND t.status NOT IN ('resolvido', 'fechado')";
          break;
        case 'vencendo':
          slaPart = " AND t.prazo_sla BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 2 HOUR) AND t.status NOT IN ('resolvido', 'fechado')";
          break;
        case 'vencido':
          slaPart = " AND t.prazo_sla < NOW() AND t.status NOT IN ('resolvido', 'fechado')";
          break;
        case 'sem_sla':
          slaPart = " AND t.prazo_sla IS NULL";
          break;
      }
      if (slaPart) {
        baseWhere += slaPart;
        summaryWhere += slaPart;
      }
    }

    if (custom_field_search) {
      const cfSearchPattern = `%${custom_field_search}%`;
      const cfPart = ' AND EXISTS (SELECT 1 FROM ticket_custom_fields tcf WHERE tcf.ticket_id = t.id AND (tcf.field_value LIKE ? OR tcf.field_label LIKE ?))';
      baseWhere += cfPart;
      summaryWhere += cfPart;
      params.push(cfSearchPattern, cfSearchPattern);
    }

    return { baseWhere, summaryWhere, params };
  }

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
    const { 
      empresa_id, usuario_id, is_dev, is_admin, 
      status, prioridade, categoria, search, 
      responsavel_id, fila, page = 1, limit = 20,
      // Advanced Filters
      tag, origem, created_from, created_to, 
      updated_from, updated_to, sla_status, custom_field_search
    } = filters;
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

    // Apply Advanced Filters
    const advanced = this.applyAdvancedFilters(baseWhere, summaryWhere, params, filters);
    baseWhere = advanced.baseWhere;
    summaryWhere = advanced.summaryWhere;
    const finalParams = advanced.params;

    // Status is only for items in list view
    const summaryParams = [...finalParams]; // copy params for summary
    
    if (status && status !== 'todos') {
      baseWhere += ' AND t.status = ?';
      finalParams.push(status);
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

    // Enriquecer com tags
    if (items.length > 0) {
      const ticketIds = items.map((t: any) => t.id);
      const tagsMap = await this.getTagsForTickets(ticketIds);
      items.forEach((t: any) => {
        t.tags = tagsMap[t.id] || [];
      });
    }

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
    const { 
      empresa_id, usuario_id, is_dev, is_admin, 
      responsavel_id, search, prioridade, categoria, status, fila,
      // Advanced Filters
      tag, origem, created_from, created_to, 
      updated_from, updated_to, sla_status, custom_field_search
    } = filters;
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

    // Apply Advanced Filters
    const advanced = this.applyAdvancedFilters(baseWhere, summaryWhere, params, filters);
    baseWhere = advanced.baseWhere;
    summaryWhere = advanced.summaryWhere;
    const finalParams = advanced.params;

    if (status && status !== 'todos') {
       baseWhere += ' AND t.status = ?';
       summaryWhere += ' AND t.status = ?';
       finalParams.push(status);
    }

    const summaryParams = [...finalParams];

    const [tickets]: any = await pool.query(`
      SELECT t.id, t.titulo, t.status, t.prioridade, t.categoria, t.created_at, t.updated_at, t.prazo_sla, t.responsavel_id, t.empresa_id,
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

    // Enriquecer com tags
    if (tickets.length > 0) {
      const ticketIds = tickets.map((t: any) => t.id);
      const tagsMap = await this.getTagsForTickets(ticketIds);
      tickets.forEach((t: any) => {
        t.tags = tagsMap[t.id] || [];
      });
    }

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
        t.resolucao_motivo, t.resolucao_observacao, t.reaberto_em, t.reaberto_por,
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
    
    if (!rows[0]) return null;
    
    const ticket = rows[0];
    ticket.tags = await this.getTags(id);
    ticket.custom_fields = await this.getCustomFields(id);
    
    return ticket;
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

  async resolveTicket(id: number, data: any, currentUser: any) {
    const { status, resolucao_motivo, resolucao_observacao } = data;
    if (!['resolvido', 'fechado'].includes(status)) throw new Error('Status inválido para resolução');
    if (!resolucao_motivo) throw new Error('Motivo de resolução é obrigatório');

    const validMotivos = [
      'duvida_sanada', 'problema_corrigido', 'solicitacao_atendida', 
      'cancelamento_realizado', 'duplicado', 'sem_retorno_cliente', 
      'improcedente', 'encaminhado', 'outros',
      'resolvido', 'cancelado', 'outro' // Compatibilidade
    ];

    if (!validMotivos.includes(resolucao_motivo)) {
      throw new Error('Motivo de resolução inválido');
    }

    const observacao = resolucao_observacao ? String(resolucao_observacao).substring(0, 2000) : null;

    await pool.query(
      'UPDATE tickets SET status = ?, resolucao_motivo = ?, resolucao_observacao = ?, finalizado_em = NOW(), updated_at = NOW() WHERE id = ?',
      [status, resolucao_motivo, observacao, id]
    );

    return { success: true };
  }

  async reopenTicket(id: number, currentUser: any) {
    const ticket = await this.getById(id);
    if (!ticket) throw new Error('Ticket não encontrado');
    if (!['resolvido', 'fechado'].includes(ticket.status)) throw new Error('Apenas tickets resolvidos ou fechados podem ser reabertos');

    await pool.query(
      'UPDATE tickets SET status = "aberto", finalizado_em = NULL, reaberto_em = NOW(), reaberto_por = ?, updated_at = NOW() WHERE id = ?',
      [currentUser.id, id]
    );

    return { success: true };
  }

  // VIEWS
  async getViews(usuarioId: number, empresaId: number) {
    const [rows]: any = await pool.query(
      'SELECT * FROM ticket_views WHERE usuario_id = ? AND empresa_id = ? ORDER BY nome ASC',
      [usuarioId, empresaId]
    );
    return rows.map((r: any) => ({
      ...r,
      filtros_json: typeof r.filtros_json === 'string' ? JSON.parse(r.filtros_json) : r.filtros_json
    }));
  }

  async createView(data: any) {
    const { empresa_id, usuario_id, nome, filtros_json } = data;
    const [result]: any = await pool.query(
      'INSERT INTO ticket_views (empresa_id, usuario_id, nome, filtros_json) VALUES (?, ?, ?, ?)',
      [empresa_id, usuario_id, nome, JSON.stringify(filtros_json)]
    );
    return result.insertId;
  }

  async updateView(id: number, data: any, usuarioId: number) {
    const { nome, filtros_json } = data;
    await pool.query(
      'UPDATE ticket_views SET nome = ?, filtros_json = ? WHERE id = ? AND usuario_id = ?',
      [nome, JSON.stringify(filtros_json), id, usuarioId]
    );
  }

  async deleteView(id: number, usuarioId: number) {
    await pool.query('DELETE FROM ticket_views WHERE id = ? AND usuario_id = ?', [id, usuarioId]);
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
      WHERE (l.descricao LIKE ? OR l.descricao LIKE ?)
      ORDER BY l.created_at ASC
    `, [`%#${ticketId} %`, `%#${ticketId}`]);

    logs.forEach((l: any) => {
      // Basic filtering: common users don't see internal logs (if we had a way to tag them)
      if (!includeInternal && (l.acao === 'INTERNAL_NOTE' || l.descricao.toLowerCase().includes('interno') || l.acao === 'TICKET_BULK_ACTION')) {
        return;
      }

      let type: any = 'system';
      let icon = 'activity';

      if (l.acao === 'TICKET_STATUS_CHANGE' || l.acao === 'TICKET_STATUS_CHANGED') icon = 'refresh-cw';
      if (l.acao === 'TICKET_UPDATE' && l.descricao.includes('responsável')) icon = 'user-check';
      if (l.acao === 'ATTACHMENT_UPLOAD') icon = 'paperclip';

      if (l.acao.includes('TAG')) {
        icon = 'tag';
        type = 'tag_change';
      }
      if (l.acao.includes('CUSTOM_FIELD')) {
        icon = 'edit-3';
        type = 'custom_field';
      }

      timeline.push({
        type,
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
         description: `Chamado ${ticket.status === 'resolvido' ? 'Resolvido' : 'Fechado'}${ticket.resolucao_motivo ? ` (Motivo: ${ticket.resolucao_motivo})` : ''}`,
         icon: 'check-circle'
       });
    }

    // 5. Reopening (if any)
    if (ticket.reaberto_em) {
       timeline.push({
         type: 'reopen',
         date: ticket.reaberto_em,
         author: 'Sistema',
         description: 'Chamado reaberto para atendimento',
         icon: 'rotate-ccw'
       });
    }

    // Sort by date ascending (oldest first)
    timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return timeline;
  }

  // TAGS
  async getTags(ticketId: number) {
    const [rows]: any = await pool.query(
      'SELECT tag FROM ticket_tags WHERE ticket_id = ? ORDER BY tag ASC',
      [ticketId]
    );
    return rows.map((r: any) => r.tag);
  }

  async getTagsForTickets(ticketIds: number[]): Promise<Record<number, string[]>> {
    if (!ticketIds || ticketIds.length === 0) return {};
    
    const placeholders = ticketIds.map(() => '?').join(',');
    const [rows]: any = await pool.query(
      `SELECT ticket_id, tag FROM ticket_tags WHERE ticket_id IN (${placeholders}) ORDER BY tag ASC`,
      ticketIds
    );

    const map: Record<number, string[]> = {};
    rows.forEach((r: any) => {
      if (!map[r.ticket_id]) map[r.ticket_id] = [];
      map[r.ticket_id].push(r.tag);
    });
    return map;
  }

  normalizeTag(tag: string): string {
    return String(tag || '')
      .trim()
      .toLowerCase()
      .replace(/^#+/, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-_]/g, '')
      .slice(0, 50);
  }

  async addTag(ticketId: number, tag: string) {
    const normalized = this.normalizeTag(tag);
    if (!normalized) return;

    try {
      await pool.query(
        'INSERT IGNORE INTO ticket_tags (ticket_id, tag) VALUES (?, ?)',
        [ticketId, normalized]
      );
    } catch (e) {
      console.error('Error adding tag:', e);
    }
  }

  async removeTag(ticketId: number, tag: string) {
    await pool.query(
      'DELETE FROM ticket_tags WHERE ticket_id = ? AND tag = ?',
      [ticketId, tag]
    );
  }

  async setTags(ticketId: number, tags: string[]) {
    await pool.query('DELETE FROM ticket_tags WHERE ticket_id = ?', [ticketId]);
    for (const tag of tags) {
      await this.addTag(ticketId, tag);
    }
  }

  // CUSTOM FIELDS
  async getCustomFields(ticketId: number) {
    const [rows]: any = await pool.query(
      'SELECT * FROM ticket_custom_fields WHERE ticket_id = ? ORDER BY field_label ASC',
      [ticketId]
    );
    return rows;
  }

  normalizeFieldKey(labelOrKey: string): string {
    return String(labelOrKey || '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .substring(0, 80);
  }

  async updateCustomField(ticketId: number, field: any) {
    const key = this.normalizeFieldKey(field.field_key || field.field_label);
    if (!key) return;

    const label = String(field.field_label || key).substring(0, 120);
    const value = String(field.field_value || '').substring(0, 1000);

    await pool.query(
      `INSERT INTO ticket_custom_fields (ticket_id, field_key, field_label, field_value) 
       VALUES (?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE field_label = VALUES(field_label), field_value = VALUES(field_value)`,
      [ticketId, key, label, value]
    );
  }

  async setCustomFields(ticketId: number, fields: any[]) {
    if (!Array.isArray(fields)) return;
    
    // Se fields vier vazio, limpa tudo (ou podemos manter e só atualizar os que vierem)
    // O requisito diz: se fields vier vazio, remover todos campos do ticket.
    if (fields.length === 0) {
      await pool.query('DELETE FROM ticket_custom_fields WHERE ticket_id = ?', [ticketId]);
      return;
    }

    // Para um 'set' completo, poderíamos deletar e inserir, mas ON DUPLICATE KEY funciona se quisermos apenas sincronizar.
    // Mas para remover quem não está no array, precisamos de uma lógica extra ou deletar antes.
    await pool.query('DELETE FROM ticket_custom_fields WHERE ticket_id = ?', [ticketId]);
    
    const processedKeys = new Set<string>();
    for (const field of fields) {
      const key = this.normalizeFieldKey(field.field_key || field.field_label);
      if (key && !processedKeys.has(key)) {
        await this.updateCustomField(ticketId, field);
        processedKeys.add(key);
      }
    }
  }

  async removeCustomField(ticketId: number, fieldKey: string) {
    await pool.query(
      'DELETE FROM ticket_custom_fields WHERE ticket_id = ? AND field_key = ?',
      [ticketId, fieldKey]
    );
  }

  // BULK ACTIONS
  async bulkUpdate(params: {
    ticketIds: number[];
    action: string;
    value?: any;
    currentUser: any;
  }) {
    const { ticketIds, action, value, currentUser } = params;
    
    if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
      return { updated: 0, skipped: 0, errors: ['Nenhum ticket informado'] };
    }

    // Limitar a 100 e remover duplicados
    const uniqueIds = Array.from(new Set(ticketIds.slice(0, 100))).map(id => Number(id)).filter(id => id > 0);
    
    if (uniqueIds.length === 0) {
      return { updated: 0, skipped: 0, errors: ['IDs inválidos'] };
    }

    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const id of uniqueIds) {
      try {
        const ticket = await this.getByIdForUser(id, currentUser);
        if (!ticket || ticket.error) {
          skipped++;
          errors.push(`Ticket #${id}: Acesso negado ou não encontrado.`);
          continue;
        }

        switch (action) {
          case 'status':
            const validStatus = ['aberto', 'em_andamento', 'aguardando_cliente', 'resolvido', 'fechado'];
            if (validStatus.includes(value)) {
              await this.updateStatus(id, value, currentUser.id);
              updated++;
            } else {
              skipped++;
            }
            break;
          case 'prioridade':
            const validPriorities = ['baixa', 'media', 'alta', 'urgente'];
            if (validPriorities.includes(value)) {
              await this.update(id, { prioridade: value });
              updated++;
            } else {
              skipped++;
            }
            break;
          case 'responsavel':
            // Se value for informado, verificar se o usuário existe e pertence à mesma empresa
            if (value !== null) {
              const [agent]: any = await pool.query('SELECT id, empresa_id FROM usuarios WHERE id = ? AND ativo = 1', [value]);
              if (!agent[0] || (!currentUser.desenvolvedor && agent[0].empresa_id !== ticket.empresa_id)) {
                skipped++;
                errors.push(`Ticket #${id}: Responsável inválido para esta empresa.`);
                continue;
              }
              // Verificar se o ticket pertence à empresa do agente (no caso de dev alterando múltiplos)
              if (agent[0].empresa_id !== ticket.empresa_id) {
                skipped++;
                errors.push(`Ticket #${id}: Responsável não pertence à empresa do ticket.`);
                continue;
              }
            }
            await this.update(id, { responsavel_id: value });
            updated++;
            break;
          case 'add_tag':
            if (value) {
              await this.addTag(id, String(value));
              updated++;
            } else {
              skipped++;
            }
            break;
          case 'fechar':
            await this.updateStatus(id, 'fechado', currentUser.id);
            updated++;
            break;
          default:
            skipped++;
        }
      } catch (err: any) {
        skipped++;
        errors.push(`Erro no ticket #${id}: ${err.message || 'Erro desconhecido'}`);
      }
    }

    return { updated, skipped, errors };
  }
}

export default new TicketsService();
