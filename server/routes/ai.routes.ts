import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { authMiddleware } from '../middlewares/auth.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = Router();

router.post('/chat', authMiddleware, async (req: any, res) => {
  const { prompt, history } = req.body;

  if (!prompt) {
    return sendError(res, 'Prompt is required', 400);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return sendError(res, 'Chave da API do Gemini não configurada no servidor. Configure a variável de ambiente GEMINI_API_KEY no painel Secrets.', 500);
  }

  try {
    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: "Você é um assistente útil focado em ajudar o usuário do sistema Gestifique, pode responder dúvidas gerais, auxiliar na escrita de tickets ou base de conhecimento e ser um chatbot amigável para testes. Fale português.",
        temperature: 0.7,
      },
    });

    // Se history foi passado, poderíamos restaurar o contexto, 
    // mas o SDK 1.29 da API Node lida com histórico diferentemente,
    // o construtor do chat create aceita `history` mas vamos tentar um loop de envio se necessário
    // ou apenas enviar o prompt de uma vez se for stateless
    
    // Simplificação: apenas usa o histórico recebido para passar as trocas caso seja possível.
    if (history && Array.isArray(history) && history.length > 0) {
      // O SDK permite repassar history no create, embora não documentem ativamente as vezes o chat object se encarrega disso...
      // Vamos tentar um push simples pro chat só com a nova mensagem se não for complexo.
      // O modo mais seguro e stateless é usar ai.models.generateContent com arranjo de mensagens.
      
      const contents = history.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));
      contents.push({ role: 'user', parts: [{ text: prompt }] });
      
       const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction: "Você é um assistente criativo e útil do sistema Gestifique.",
          temperature: 0.7
        }
      });
      return sendSuccess(res, { response: response.text });
    }

    // Se não tem hisórico, só manda o chat simles 
    const response = await chat.sendMessage({ message: prompt });
    
    return sendSuccess(res, { response: response.text });
  } catch (error: any) {
    console.error('Error calling Gemini:', error);
    return sendError(res, error.message || 'Erro ao comunicar com a IA', 500);
  }
});

export default router;
