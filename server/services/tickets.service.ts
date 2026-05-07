import  pool from  '../db/connection.js';
import notificationsService from './notifications.service.js';

class TicketsService {
  async list(filters: any) {
    const { empresa_id, usuario_id, is_dev, is_admin, status, prioridade, categoria, search, busca, page = 1, limit = 20 } = filters;
    const searchTerm = search || busca;
    
    let query = `
      SELECT t.*, u.nome as cliente_nome, r.nome as responsavel_nome, e.nome as empresa_nome
      FROM tickets t
      JOIN usuarios u ON t.usuario_id = u.id
      JOIN empresas e ON t.empresa_id = e.id
      LEFT JOIN usuarios r ON t.responsavel_id = r.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // ACL
    if (!is_dev) {
      if (is_admin) {
        query += ' AND t.empresa_id = ?';
        params.push(empresa_id);
      } else {
        query += ' AND t.usuario_id = ?';
        params.push(usuario_id);
      }
    }

    // Filters
    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }
    if (prioridade) {
      query += ' AND t.prioridade = ?';
      params.push(prioridade);
    }
    if (categoria) {
      query += ' AND t.categoria = ?';
      params.push(categoria);
    }
    if (searchTerm) {
      query += ' AND (t.titulo LIKE ? OR t.descricao LIKE ? OR CAST(t.id AS CHAR) = ?)';
      params.push(`%${searchTerm}%`, `%${searchTerm}%`, searchTerm);
    }

    query += ' ORDER BY t.created_at DESC';
    
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit.toString()), offset);

    const [rows] = await pool.query(query, params);
    return rows;
  }

  async create(data: any) {
    const { empresa_id, usuario_id, titulo, descricao, prioridade, categoria } = data;
    const [result]: any = await pool.query(
      'INSERT INTO tickets (empresa_id, usuario_id, titulo, descricao, prioridade, categoria) VALUES (?, ?, ?, ?, ?, ?)',
      [empresa_id, usuario_id, titulo, descricao, prioridade || 'media', categoria || 'suporte']
    );
    const ticketId = result.insertId;

    // Notificações: Admins e Devs
    try {
      const [admins]: any = await pool.query(
        'SELECT id FROM usuarios WHERE (empresa_id = ? AND administrador = 1) OR desenvolvedor = 1',
        [empresa_id]
      );
      
      const adminIds = admins
        .filter((a: any) => a.id !== usuario_id)
        .map((a: any) => a.id);

      const [author]: any = await pool.query('SELECT nome FROM usuarios WHERE id = ?', [usuario_id]);
      const authorName = author[0]?.nome || 'Usuário';

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
    } catch (e) {
      console.error('Erro ao notificar criação de ticket:', e);
    }

    return ticketId;
  }

  async getById(id: number) {
    const [rows]: any = await pool.query(
      `SELECT 
        t.id, t.empresa_id, t.usuario_id, t.responsavel_id, t.titulo, t.descricao, 
        t.status, t.prioridade, t.categoria, t.origem, t.prazo_sla, t.finalizado_em,
        t.created_at, t.updated_at,
        u.nome as cliente_nome, u.email as cliente_email, 
        r.nome as responsavel_nome, 
        e.nome as empresa_nome
       FROM tickets t 
       JOIN usuarios u ON t.usuario_id = u.id 
       JOIN empresas e ON t.empresa_id = e.id
       LEFT JOIN usuarios r ON t.responsavel_id = r.id 
       WHERE t.id = ?`,
      [id]
    );
    return rows[0] || null;
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
             u.nome as usuario_nome 
      FROM ticket_mensagens m
      JOIN usuarios u ON m.usuario_id = u.id
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
        }

        // 2. Notificar responsável se não for ele
        if (ticket.responsavel_id && ticket.responsavel_id !== usuario_id) {
           recipients.add(ticket.responsavel_id);
        }

        // 3. Se for interno, notificar admins/devs da empresa (que não sejam o autor)
        if (interno) {
           const [admins]: any = await pool.query(
             'SELECT id FROM usuarios WHERE (empresa_id = ? AND administrador = 1) OR desenvolvedor = 1',
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
}

export default new TicketsService();
