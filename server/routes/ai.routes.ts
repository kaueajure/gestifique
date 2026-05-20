import { Router } from 'express';
import { AIService, sanitizeAIText } from '../services/ai.service.js';
import ticketsService from '../services/tickets.service.js';
import { authMiddleware } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permissions.middleware.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = Router();

router.get('/status', authMiddleware, requirePermission('ia.visualizar'), (req, res) => {
  return sendSuccess(res, { available: AIService.isAvailable() });
});

router.get('/tickets/:id/summary', authMiddleware, requirePermission('ia.usar_resumo'), async (req: any, res) => {
  const ticketId = Number(req.params.id);
  const user = req.user;
  
  if (!AIService.isAvailable()) {
    return sendError(res, 'Serviço de IA indisponível', 503);
  }

  try {
    const ticket = await ticketsService.getByIdForUser(ticketId, user);
    if (!ticket || ticket.error === 'forbidden') {
      return sendError(res, 'Ticket não encontrado', 404);
    }
    
    // As per requirement: public messages only
    const mensagensResult = await ticketsService.getMessages(ticketId, false) as any[];
    const timeline = mensagensResult.map((m: any) => ({
      role: m.usuario_id === ticket.usuario_id ? 'user' : 'model',
      text: m.mensagem
    }));

    if (timeline.length === 0) {
      timeline.push({
         role: 'user',
         text: ticket.descricao || ticket.titulo
      });
    }

    const summary = await AIService.summarizeTimeline(timeline);
    
    return sendSuccess(res, { summary });
  } catch (error: any) {
    console.error('Error generating summary:', error);
    return sendError(res, 'Erro ao gerar resumo da conversa', 500);
  }
});

router.post('/tickets/:id/suggest-reply', authMiddleware, requirePermission('ia.sugerir_resposta'), async (req: any, res) => {
  const ticketId = Number(req.params.id);
  const { agentDraft } = req.body;
  const user = req.user;
  
  if (!AIService.isAvailable()) {
    return sendError(res, 'Serviço de IA indisponível', 503);
  }

  try {
    const ticket = await ticketsService.getByIdForUser(ticketId, user);
    if (!ticket || ticket.error === 'forbidden') {
      return sendError(res, 'Ticket não encontrado', 404);
    }

    const mensagensResult = await ticketsService.getMessages(ticketId, false) as any[];
    const timeline = mensagensResult.map((m: any) => ({
      role: m.usuario_id === ticket.usuario_id ? 'user' : 'model',
      text: m.mensagem
    }));

    if (timeline.length === 0) {
      timeline.push({
         role: 'user',
         text: ticket.descricao || ticket.titulo
      });
    }

    const suggestion = await AIService.suggestResponse(ticket.titulo, timeline, agentDraft);
    
    return sendSuccess(res, { suggestion });
  } catch (error: any) {
    console.error('Error suggesting reply:', error);
    return sendError(res, 'Erro ao sugerir resposta', 500);
  }
});

router.post('/chat', authMiddleware, requirePermission('ia.chat'), async (req: any, res) => {
  const { prompt, history } = req.body;

  if (!prompt) {
    return sendError(res, 'Prompt is required', 400);
  }

  if (!AIService.isAvailable()) {
    return sendError(res, 'Chave da API do Gemini não configurada no servidor.', 500);
  }

  try {
    const ai = AIService.getClient();

    const systemInstruction = `Você é o Tique, assistente de IA do Gestifique.
Ajude o usuário com dúvidas sobre atendimento, tickets, SLA, organização de suporte, produtividade e uso do sistema.

Regras:
- Responda em português do Brasil.
- Seja direto e útil.
- Pode usar tópicos simples quando ajudar.
- Evite Markdown pesado.
- Não use negrito com asteriscos.
- Não use blocos de código, a menos que o usuário peça código.
- Não invente funcionalidades do sistema.
- Quando não souber se algo existe no Gestifique, diga que precisa verificar a implementação.`;

    if (history && Array.isArray(history) && history.length > 0) {
      const contents = history.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));
      contents.push({ role: 'user', parts: [{ text: prompt }] });
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.6
        }
      });
      return sendSuccess(res, { response: sanitizeAIText(response.text) });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.6
      }
    });
    
    return sendSuccess(res, { response: sanitizeAIText(response.text) });
  } catch (error: any) {
    console.error('Error calling Gemini chat:', error);
    return sendError(res, error.message || 'Erro ao comunicar com a IA', 500);
  }
});

export default router;
