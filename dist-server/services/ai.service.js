import { GoogleGenAI } from '@google/genai';
export const AI_STYLE_RULES = `
Você é o Tique, assistente de IA do Gestifique, um sistema de gestão de tickets e atendimento ao cliente.

Regras gerais:
- Responda sempre em português do Brasil.
- Seja claro, útil, direto e profissional.
- Não invente informações que não estejam no contexto.
- Se faltar informação, diga isso de forma simples.
- Evite exageros comerciais.
- Evite respostas longas quando uma resposta curta resolver.
`;
export const CUSTOMER_REPLY_RULES = `
Você está escrevendo uma resposta que será enviada ao cliente final em um ticket de suporte.

Regras obrigatórias:
- Retorne apenas o texto final da resposta.
- Não use Markdown.
- Não use asteriscos.
- Não use negrito.
- Não use títulos.
- Não use listas, salvo se for realmente necessário.
- Não use emojis.
- Não escreva "segue uma sugestão", "claro", "aqui está" ou frases introdutórias.
- Não mencione que é uma IA.
- Não invente prazos, soluções, links ou procedimentos que não estejam no histórico.
- Use tom educado, humano e objetivo.
- A resposta deve estar pronta para ser enviada ao cliente.
`;
export const SUMMARY_RULES = `
Gere um resumo operacional para um atendente.

Regras:
- Não use Markdown.
- Não use asteriscos.
- Seja objetivo.
- Não invente informações.
- Se não houver dados suficientes, diga: "Ainda não há informações suficientes para gerar um resumo confiável."
`;
export function sanitizeAIText(text) {
    if (!text)
        return '';
    let output = text.trim();
    // Remove blocos markdown
    output = output.replace(/```[\s\S]*?```/g, '').trim();
    // Remove negrito/itálico markdown simples
    output = output.replace(/\*\*(.*?)\*\*/g, '$1');
    output = output.replace(/\*(.*?)\*/g, '$1');
    output = output.replace(/__(.*?)__/g, '$1');
    output = output.replace(/_(.*?)_/g, '$1');
    // Remove títulos markdown
    output = output.replace(/^#{1,6}\s+/gm, '');
    // Remove frases introdutórias comuns
    output = output.replace(/^(claro[,!.\s]*)/i, '');
    output = output.replace(/^segue (uma )?(sugest[aã]o|resposta).*?:\s*/i, '');
    output = output.replace(/^aqui est[aá].*?:\s*/i, '');
    // Normaliza espaços
    output = output.replace(/[ \t]+/g, ' ');
    output = output.replace(/\n{3,}/g, '\n\n');
    return output.trim();
}
export class AIService {
    static isAvailable() {
        return !!process.env.GEMINI_API_KEY;
    }
    static getClient() {
        return new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
            httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });
    }
    static async analyzeTicketSentiment(messageContent) {
        if (!this.isAvailable())
            return null;
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
            const parsed = JSON.parse(response.text || '{}');
            return {
                sentimento: ['positivo', 'neutro', 'negativo', 'frustrado'].includes(parsed.sentimento) ? parsed.sentimento : 'neutro',
                urgencia: ['baixa', 'media', 'alta', 'urgente'].includes(parsed.urgencia) ? parsed.urgencia : 'media',
                resumo: typeof parsed.resumo === 'string' ? sanitizeAIText(parsed.resumo).slice(0, 120) : '',
                categoria: typeof parsed.categoria === 'string' ? sanitizeAIText(parsed.categoria) : 'Suporte Técnico'
            };
        }
        catch (e) {
            console.error('Error analyzing ticket sentiment:', e);
            return null;
        }
    }
    static async summarizeTimeline(messages) {
        if (!this.isAvailable() || !messages || messages.length === 0)
            return null;
        try {
            const ai = this.getClient();
            const timelineText = messages.map(m => `${m.role === 'user' ? 'Cliente' : 'Atendente'}: ${m.content || m.text}`).join('\n\n');
            const prompt = `
${AI_STYLE_RULES}

${SUMMARY_RULES}

Histórico do chamado:
${timelineText}

Tarefa:
Resuma o chamado para um atendente em no máximo 4 frases curtas, contendo:
1. problema original;
2. informações importantes já mencionadas;
3. o que já foi feito;
4. pendência atual, se existir.

Retorne apenas o resumo, sem título e sem Markdown.
`;
            const response = await ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: prompt,
                config: {
                    temperature: 0.25
                }
            });
            return sanitizeAIText(response.text);
        }
        catch (e) {
            console.error('Error summarizing timeline:', e);
            return null;
        }
    }
    static async suggestResponse(ticketSubject, messages, agentDraft) {
        if (!this.isAvailable())
            return null;
        try {
            const ai = this.getClient();
            const timelineText = messages.map(m => `${m.role === 'user' ? 'Cliente' : 'Atendente'}: ${m.content || m.text}`).join('\n\n');
            const prompt = `
${AI_STYLE_RULES}

${CUSTOMER_REPLY_RULES}

Dados do ticket:
Assunto: ${ticketSubject || 'Não informado'}

Histórico público do atendimento:
${timelineText || 'Sem histórico disponível.'}

${agentDraft ? `Rascunho escrito pelo atendente:
${agentDraft}

Tarefa:
Melhore o rascunho do atendente, mantendo a intenção original, corrigindo clareza, tom e gramática.` : `Tarefa:
Crie uma resposta curta e adequada para o cliente com base no histórico do atendimento.`}

Critérios da resposta:
- Se o cliente fez uma pergunta objetiva, responda objetivamente.
- Se ainda faltar informação para resolver, peça a informação necessária.
- Se o atendente precisa informar que está analisando, diga isso sem prometer prazo inventado.
- Se o problema já foi resolvido no histórico, confirme de forma educada.
- Não adicione informações que não aparecem no histórico.
`;
            const response = await ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: prompt,
                config: {
                    temperature: 0.35
                }
            });
            return sanitizeAIText(response.text);
        }
        catch (e) {
            console.error('Error suggesting response:', e);
            return null;
        }
    }
}
