import pool from '../db/connection.js';
import { recordTicketEvent } from './ticket-events.service.js';
import notificationsService from './notifications.service.js';
import { emailOutboundService, trackTicketEmailMessageIds } from './email-outbound.service.js';
import { io } from '../server.js';
import slaService from './sla.service.js';
import { recomputeTicketMessageState } from '../utils/ticket-state.js';

export interface AddMessageData {
  ticket_id: number;
  usuario_id: number | null;
  mensagem: string;
  interno: boolean;
  message_id?: string | null;
  tipo?: string;
}

class TicketMessagesService {
  /**
   * Centralized method to add a message to a ticket.
   * Handles status updates, SLA, notifications, events and real-time updates.
   */
  async addMessage(data: AddMessageData, currentUser?: any) {
    const { ticket_id, usuario_id, mensagem, interno, message_id, tipo = 'texto' } = data;

    if (!mensagem || mensagem.trim() === '') {
      throw new Error('A mensagem não pode estar vazia');
    }

    // 1. Validate Ticket and Access - Using direct query to avoid circular dependency with ticketsService
    const [ticketRows]: any = await pool.query(
      `SELECT t.*, 
              COALESCE(t.solicitante_nome, u.nome, 'Cliente') as cliente_nome,
              COALESCE(t.solicitante_email, u.email, 'removido@sistema.com') as cliente_email
       FROM tickets t
       LEFT JOIN usuarios u ON t.usuario_id = u.id
       WHERE t.id = ?`,
      [ticket_id]
    );

    const ticket = ticketRows[0];
    if (!ticket) {
      throw new Error('Chamado não encontrado');
    }

    const isDev = !!currentUser?.desenvolvedor;
    const isAdmin = !!currentUser?.administrador;
    const isManager = currentUser?.perfil === 'gestor';
    const isStaff = currentUser?.perfil === 'atendente';
    const isAgent = isDev || isAdmin || isManager || isStaff;

    if (currentUser) {
      // Data isolation check
      if (!isDev && Number(currentUser.empresa_id) !== Number(ticket.empresa_id)) {
        throw new Error('Acesso negado: este chamado pertence a outra empresa');
      }

      // Customer specific check
      if (!isAgent && Number(ticket.usuario_id) !== Number(currentUser?.id)) {
        throw new Error('Acesso negado: este chamado pertence a outro usuário');
      }
    }

    // Security: Only agents can create internal messages
    const finalInterno = isAgent ? interno : false;

    if (message_id) {
      const [existingMessage]: any = await pool.query(
        'SELECT id FROM ticket_mensagens WHERE message_id = ? LIMIT 1',
        [message_id]
      );

      if (existingMessage.length > 0) {
        console.warn(`[TicketMessagesService] Duplicate message_id ignored: ${message_id}`);
        return existingMessage[0].id;
      }
    }

    if (!currentUser && !finalInterno) {
      const [recentSameMessage]: any = await pool.query(
        `SELECT id
         FROM ticket_mensagens
         WHERE ticket_id = ?
           AND usuario_id <=> ?
           AND interno = 0
           AND mensagem = ?
           AND created_at >= (NOW() - INTERVAL 5 MINUTE)
         ORDER BY id DESC
         LIMIT 1`,
        [ticket_id, usuario_id || null, mensagem]
      );

      if (recentSameMessage.length > 0) {
        console.warn(`[TicketMessagesService] Recent duplicate inbound message ignored for ticket #${ticket_id}.`);
        return recentSameMessage[0].id;
      }
    }

    // 2. Create the message
    console.log(`[TicketMessagesService] Adding message: ticket_id=${ticket_id}, usuario_id=${usuario_id}, interno=${finalInterno}, message_id=${message_id}, tipo=${tipo}`);
    const [result]: any = await pool.query(
      'INSERT INTO ticket_mensagens (ticket_id, usuario_id, mensagem, interno, message_id, tipo) VALUES (?, ?, ?, ?, ?, ?)',
      [ticket_id, usuario_id || null, mensagem, finalInterno ? 1 : 0, message_id || null, tipo]
    );
    const messageId = result.insertId;

    // 3. Track processed email to avoid duplicates
    if (message_id) {
      await pool.query(
        'INSERT IGNORE INTO processed_emails (message_id, empresa_id, ticket_id) VALUES (?, ?, ?)',
        [message_id, ticket.empresa_id, ticket_id]
      );
    }

    // 4. Update ticket: updated_at
    await pool.query('UPDATE tickets SET updated_at = NOW() WHERE id = ?', [ticket_id]);

    // 5. Business Logic: Status, SLA and Notifications
    try {
      const isExternalEmail = !!message_id;
      // A message is from client if it came from the ticket owner OR from external email with null usuario_id
      const isClient = (usuario_id !== null && Number(usuario_id) === Number(ticket.usuario_id)) || (isExternalEmail && usuario_id === null);
      
      // A response from agent is when it's NOT an internal note AND NOT from the client
      // We also ensure it's actually an agent user if it's not an external email
      const isAgentResponse = !finalInterno && !isClient && (isAgent || !isExternalEmail);
      
      if (!['resolvido', 'fechado'].includes(ticket.status)) {
        
        // A) SLA Primera Resposta (only if from agent and public)
        if (isAgentResponse && !ticket.primeira_resposta_em) {
          const agora = new Date();
          const agoraFormatado = agora.toISOString().slice(0, 19).replace('T', ' ');
          let prStatus = 'cumprido';
          
          if (ticket.prazo_primeira_resposta) {
            const prazoPR = new Date(ticket.prazo_primeira_resposta);
            if (agora > prazoPR) prStatus = 'violado';
          }

          await pool.query(
            'UPDATE tickets SET primeira_resposta_em = ?, sla_primeira_resposta_status = ? WHERE id = ?',
            [agoraFormatado, prStatus, ticket_id]
          );

          await recordTicketEvent({
            ticket_id,
            empresa_id: ticket.empresa_id,
            usuario_id,
            tipo: 'primeira_resposta_registrada',
            descricao: `Primeira resposta registrada em ${agoraFormatado} (${prStatus === 'cumprido' ? 'Dentro do prazo' : 'Fora do prazo'})`
          });
        }

        // B) Status Transitions
        if (isAgentResponse) {
          // If agent replies publicly and it was 'aberto', move to 'em_andamento'
          if (ticket.status === 'aberto') {
            await pool.query('UPDATE tickets SET status = "em_andamento" WHERE id = ?', [ticket_id]);
            await slaService.updateOperationalStatus(ticket_id);
            await recordTicketEvent({
              ticket_id,
              empresa_id: ticket.empresa_id,
              usuario_id,
              tipo: 'status_alterado',
              descricao: 'Status alterado de "Aberto" para "Em Andamento" pela resposta do atendente'
            });
          }
        } else if (isClient) {
          // If client replies and it was 'aguardando_cliente', move back to 'em_andamento'
          if (ticket.status === 'aguardando_cliente') {
            await pool.query('UPDATE tickets SET status = "em_andamento" WHERE id = ?', [ticket_id]);
            await slaService.resumeSla(ticket_id, usuario_id);
            await recordTicketEvent({
              ticket_id,
              empresa_id: ticket.empresa_id,
              usuario_id,
              tipo: 'status_alterado',
              descricao: 'Status alterado de "Aguardando Cliente" para "Em Andamento" pela resposta do cliente'
            });
          } else {
            await slaService.updateOperationalStatus(ticket_id);
          }
        }
      }

      // C) Notifications
      const [author]: any = await pool.query('SELECT nome FROM usuarios WHERE id = ?', [usuario_id]);
      const authorName = author[0]?.nome || (isExternalEmail ? (ticket.cliente_nome || 'Cliente Externo') : 'Sistema');

      const recipients = new Set<number>();
      
      // 1. Notify Client (if agent responds publicly)
      if (!finalInterno && isAgentResponse) {
        // If there's a registered user, add to in-app notifications
        if (ticket.usuario_id) {
          recipients.add(ticket.usuario_id);
        }

        // Send email to the external contact or registered user email
        if (ticket.cliente_email && ticket.cliente_email !== 'removido@sistema.com') {
          // Get the original messageId from the ticket or the latest message for threading
          const replyToId = ticket.message_id;
          
          const outboundMessageId = `<ticket-${ticket_id}-msg-${messageId}-${Date.now()}@gestifique.com.br>`;
          console.log(`[TicketMessagesService] Generated outboundMessageId: ${outboundMessageId}`);
          
          try {
            const sendResult = await emailOutboundService.sendTicketEmail({
              to: ticket.cliente_email,
              ticketId: ticket_id,
              empresaId: ticket.empresa_id,
              emailChannelId: ticket.email_channel_id,
              type: 'agent_reply',
              title: ticket.titulo,
              customerName: ticket.cliente_nome,
              agentName: authorName,
              message: mensagem,
              status: ticket.status || 'Aberto',
              messageId: outboundMessageId,
              inReplyTo: replyToId,
              references: replyToId ? [replyToId] : undefined,
            });

            if (sendResult.success) {
              console.log(
                `[TicketMessagesService] External notification email sent to ${ticket.cliente_email} for ticket #${ticket_id} via ${sendResult.provider} (Message-ID: ${sendResult.messageId})`
              );
              await trackTicketEmailMessageIds(
                ticket.empresa_id,
                ticket_id,
                outboundMessageId,
                sendResult
              );
            } else {
              console.error('[TicketMessagesService] Mail failed:', sendResult.error);
            }
          } catch (err) {
            console.error('[Notification Error] Mail failed:', err);
          }
        }
      }

      // 2. Notify Responsible (if client responds or if it's an internal note they didn't write)
      if (ticket.responsavel_id && Number(ticket.responsavel_id) !== Number(usuario_id)) {
         recipients.add(ticket.responsavel_id);
      }

      // 3. Notify Admins if it's an internal note or a new client message
      if (finalInterno || isClient) {
         const [admins]: any = await pool.query(
           'SELECT id FROM usuarios WHERE empresa_id = ? AND administrador = 1',
           [ticket.empresa_id]
         );
         admins.forEach((a: any) => {
           if (Number(a.id) !== Number(usuario_id)) recipients.add(Number(a.id));
         });
      }

      const recipientIds = Array.from(recipients);
      if (recipientIds.length > 0) {
        await notificationsService.createMany(recipientIds, {
          empresa_id: ticket.empresa_id,
          tipo: 'TICKET_MESSAGE',
          titulo: finalInterno ? 'Nota interna no chamado' : 'Nova resposta no chamado',
          mensagem: `${authorName}: ${mensagem.substring(0, 100)}${mensagem.length > 100 ? '...' : ''}`,
          link: `ticket:${ticket_id}`,
          metadata: { ticketId: ticket_id, messageId }
        });
      }

    } catch (error) {
      console.error('[TicketMessagesService] Error in business logic:', error);
    }

    // 5b. Sincroniza campos materializados de estado de mensagens.
    // Roda DEPOIS das transições de status acima e ANTES do emit de socket,
    // para que o ticket emitido em tempo real já carregue os valores atualizados.
    // Vale para mensagens públicas e internas (notas internas não alteram a
    // "última mensagem pública", então a recomputação as ignora corretamente).
    try {
      await recomputeTicketMessageState(ticket_id);
    } catch (stateErr) {
      console.error('[TicketMessagesService] Falha ao recomputar estado materializado:', stateErr);
    }

    // 6. WebSocket Emit
    try {
      // TODO: Consider using a singleton Realtime Service to decouple from server.js
      if (io) {
        // Fetch updated ticket using direct query to avoid circular dependency
        const [updatedRows]: any = await pool.query(
          `SELECT t.*, 
                  COALESCE(t.solicitante_nome, u.nome, 'Cliente') as cliente_nome, 
                  COALESCE(t.solicitante_email, u.email, 'Usuário Removido') as cliente_email, 
                  COALESCE(r.nome, 'Não Atribuído') as responsavel_nome, 
                  e.nome as empresa_nome
           FROM tickets t
           LEFT JOIN usuarios u ON t.usuario_id = u.id
           LEFT JOIN empresas e ON t.empresa_id = e.id
           LEFT JOIN usuarios r ON t.responsavel_id = r.id
           WHERE t.id = ?`,
          [ticket_id]
        );
        
        if (updatedRows[0]) {
          io.to(`empresa_${ticket.empresa_id}`).emit('ticketUpdated', updatedRows[0]);
          io.to(`empresa_${ticket.empresa_id}`).emit('ticketMessagesChanged', { 
            ticketId: ticket_id, 
            empresaId: ticket.empresa_id, 
            messageId 
          });
        }
      }
    } catch (wsError) {
      console.error('[TicketMessagesService] WebSocket emission failed:', wsError);
    }

    return messageId;
  }
}

export default new TicketMessagesService();
