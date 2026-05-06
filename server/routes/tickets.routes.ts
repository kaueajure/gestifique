import { Router } from 'express';
import ticketsService from '../services/tickets.service';
import { authMiddleware } from '../middlewares/auth';
import { isAdmin } from '../middlewares/permissions';
import { sendSuccess, sendError } from '../utils/response';
import { logSystemAction } from '../utils/logger';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: any, res) => {
  try {
    const filters = {
      ...req.query,
      empresa_id: req.user.empresa_id,
      usuario_id: req.user.id,
      is_dev: req.user.desenvolvedor,
      is_admin: req.user.administrador
    };
    const tickets = await ticketsService.list(filters);
    sendSuccess(res, tickets);
  } catch (error: any) {
    sendError(res, error.message);
  }
});

router.get('/:id', async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const ticket = await ticketsService.getById(id);
    
    if (!ticket) return sendError(res, 'Ticket não encontrado', 404);
    
    // ACL
    if (!req.user.desenvolvedor && ticket.empresa_id !== req.user.empresa_id) {
      if (ticket.usuario_id !== req.user.id) {
        return sendError(res, 'Permissão negada', 403);
      }
    }

    sendSuccess(res, ticket);
  } catch (error: any) {
    sendError(res, error.message);
  }
});

router.post('/', async (req: any, res) => {
  try {
    const { titulo, descricao, prioridade, categoria } = req.body;
    if (!titulo) return sendError(res, 'Título é obrigatório', 400);

    const ticketId = await ticketsService.create({
      empresa_id: req.user.empresa_id,
      usuario_id: req.user.id,
      titulo, descricao, prioridade, categoria
    });

    await logSystemAction(req, req.user.id, req.user.empresa_id, 'TICKET_CREATE', `Novo chamado criado: #${ticketId}`);
    
    sendSuccess(res, { id: ticketId }, 'Ticket aberto com sucesso', 201);
  } catch (error: any) {
    sendError(res, error.message);
  }
});

router.patch('/:id', async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const ticket = await ticketsService.getById(id);
    if (!ticket) return sendError(res, 'Ticket não encontrado', 404);

    const canManage = req.user.administrador || req.user.desenvolvedor;
    if (!canManage && ticket.usuario_id !== req.user.id) {
        return sendError(res, 'Permissão negada', 403);
    }

    // Common users can't change status/priority/technician
    if (!canManage) {
        delete req.body.status;
        delete req.body.prioridade;
        delete req.body.responsavel_id;
    }

    await ticketsService.update(id, req.body);
    await logSystemAction(req, req.user.id, req.user.empresa_id, 'TICKET_UPDATE', `Atualizou chamado: #${id}`);
    
    sendSuccess(res, null, 'Ticket atualizado com sucesso');
  } catch (error: any) {
    sendError(res, error.message);
  }
});

router.get('/:id/messages', async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const isAdminOrDev = req.user.administrador || req.user.desenvolvedor;
    const messages = await ticketsService.getMessages(id, isAdminOrDev);
    sendSuccess(res, messages);
  } catch (error: any) {
    sendError(res, error.message);
  }
});

router.post('/:id/messages', async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const { mensagem, interno } = req.body;
    
    const isAdminOrDev = req.user.administrador || req.user.desenvolvedor;
    
    await ticketsService.addMessage({
      ticket_id: id,
      usuario_id: req.user.id,
      mensagem,
      interno: isAdminOrDev ? interno : false
    });

    await logSystemAction(req, req.user.id, req.user.empresa_id, 'MESSAGE_SEND', `Nova mensagem no chamado #${id}`);
    
    sendSuccess(res, null, 'Mensagem enviada');
  } catch (error: any) {
    sendError(res, error.message);
  }
});

export default router;
