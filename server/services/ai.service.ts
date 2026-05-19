import { GoogleGenAI } from '@google/genai';

export class AIService {
  static isAvailable(): boolean {
    return !!process.env.GEMINI_API_KEY;
  }

  static getClient() {
    return new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });
  }

  static async analyzeTicketSentiment(messageContent: string) {
    if (!this.isAvailable()) return null;
    try {
      const ai = this.getClient();
      const prompt = `Analise o seguinte chamado e retorne APENAS um JSON válido com a seguinte estrutura estrita, sem marcação markdown e sem blocos de código:
{
  "sentimento": "positivo" ou "neutro" ou "negativo" ou "frustrado",
  "urgencia": "baixa" ou "media" ou "alta" ou "urgente",
  "resumo": "um resumo de até 80 caracteres do problema",
  "categoria": "Financeiro" ou "Suporte Técnico" ou "Comercial"
}

Chamado:
${messageContent}
`;
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (e) {
      console.error('Error analyzing ticket sentiment:', e);
      return null;
    }
  }

  static async summarizeTimeline(messages: any[]) {
    if (!this.isAvailable() || !messages || messages.length === 0) return null;
    try {
      const ai = this.getClient();
      const timeline = messages.map(m => `${m.role === 'user' ? 'Cliente' : 'Atendente'}: ${m.text}`).join('\n\n');
      const prompt = `Resuma o histórico de mensagens deste chamado em até 4 linhas descrevendo:
1. O problema original
2. As tentativas de solução realizadas
3. A pendência atual

Histórico do Chamado:
${timeline}
`;
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: { temperature: 0.4 }
      });
      return response.text;
    } catch (e) {
      console.error('Error summarizing timeline:', e);
      return null;
    }
  }

  static async suggestResponse(ticketSubject: string, messages: any[], agentDraft?: string) {
    if (!this.isAvailable()) return null;
    try {
      const ai = this.getClient();
      const timeline = messages.map(m => `${m.role === 'user' ? 'Cliente' : 'Atendente'}: ${m.text}`).join('\n\n');
      
      const prompt = `Você é um excelente atendente de suporte do sistema Gestifique. Crie uma resposta sugerida impecável, polida, empática e prestativa em português brasileiro para o atendente usar.

Assunto do Ticket: ${ticketSubject}

Histórico Público:
${timeline}

${agentDraft ? `Rascunho do Atendente (por favor refine, corrija e complete este rascunho de forma profissional): ${agentDraft}` : 'Por favor, gere a melhor resposta possível para resolver a pendência atual ou orientar o cliente adequadamente baseado no histórico.'}
`;
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: { temperature: 0.7 }
      });
      return response.text;
    } catch (e) {
      console.error('Error suggesting response:', e);
      return null;
    }
  }
}
