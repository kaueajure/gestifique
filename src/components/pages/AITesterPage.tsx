import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User as UserIcon, Loader2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../../types';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface AITesterPageProps {
  currentUser: User;
}

export const AITesterPage: React.FC<AITesterPageProps> = ({ currentUser }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: `Olá, ${currentUser.nome}! Sou o Assistente IA do Gestifique. Como posso te ajudar hoje?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', text: input.trim() };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post<{ response: string }>('/ai/chat', { 
        prompt: userMessage.text,
        history: currentMessages.slice(1, -1) // Envia tudo exceto a primeira de saudação e a atual
      });

      setMessages([...currentMessages, { role: 'model', text: response.response }]);
    } catch (error: any) {
      setMessages([...currentMessages, { 
        role: 'model', 
        text: `**Erro ao processar:** ${error.message || 'Ocorreu um erro ao comunicar com a IA'}` 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col pt-4">
      <div className="flex items-center gap-3 mb-6 shrink-0">
        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
          <Bot size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Assistente IA</h2>
          <p className="text-sm font-medium text-slate-500">Desenvolvido com Google Gemini</p>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden shadow-sm border-slate-200">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-4 max-w-[85%]",
                  msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                  msg.role === 'user' ? "bg-blue-600 text-white" : "bg-indigo-600 text-white"
                )}>
                  {msg.role === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
                </div>
                
                <div className={cn(
                  "px-4 py-3 rounded-2xl shadow-sm text-sm whitespace-pre-wrap",
                  msg.role === 'user' 
                    ? "bg-blue-600 text-white rounded-tr-sm" 
                    : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm leading-relaxed"
                )}>
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="flex gap-4 max-w-[85%]"
             >
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Bot size={16} />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-white border border-slate-200 rounded-tl-sm text-sm flex items-center gap-2 text-slate-500">
                   <Loader2 size={16} className="animate-spin" />
                   Pensando...
                </div>
             </motion.div>
          )}
          <div ref={bottomRef} />
        </div>
        
        <div className="p-4 bg-white border-t border-slate-200 shrink-0">
          <form onSubmit={handleSend} className="flex items-center gap-3">
             <input
               type="text"
               value={input}
               onChange={(e) => setInput(e.target.value)}
               placeholder="Pergunte ao Assistente IA..."
               className="flex-1 h-12 bg-slate-100 border-none rounded-xl px-4 text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
               autoFocus
               disabled={loading}
             />
             <Button
                type="submit"
                disabled={!input.trim() || loading}
                className={cn(
                  "h-12 w-12 rounded-xl flex items-center justify-center p-0",
                  !input.trim() || loading ? "bg-slate-200 text-slate-400" : "bg-indigo-600 hover:bg-indigo-700"
                )}
             >
               {loading ? <Loader2 size={18} className="animate-spin text-white" /> : <Send size={18} className="ml-1 text-white" />}
             </Button>
          </form>
          <div className="text-center mt-2">
             <span className="text-[10px] font-medium text-slate-400">O Assistente IA pode cometer erros. Considere verificar informações importantes.</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
