import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import { Ticket, Message, User } from '../../types';
import { 
  ArrowLeft, 
  Send, 
  Paperclip, 
  MoreVertical, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  User as UserIcon,
  Calendar,
  Building2,
  Lock,
  Loader2,
  Trash2,
  Tag
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface TicketDetailsPageProps {
  ticketId: number;
  onBack: () => void;
  currentUser: User;
}

export const TicketDetailsPage = ({ ticketId, onBack, currentUser }: TicketDetailsPageProps) => {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [loadingSend, setLoadingSend] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ticketData, messagesData] = await Promise.all([
        api.get<Ticket>(`/tickets/${ticketId}`),
        api.get<Message[]>(`/tickets/${ticketId}/messages`)
      ]);
      setTicket(ticketData);
      setMessages(messagesData);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar detalhes do chamado.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [ticketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || loadingSend) return;

    setLoadingSend(true);
    try {
      await api.post(`/tickets/${ticketId}/messages`, {
        mensagem: newMessage,
        interno: isInternal
      });
      setNewMessage('');
      // Refresh messages
      const updatedMessages = await api.get<Message[]>(`/tickets/${ticketId}/messages`);
      setMessages(updatedMessages);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingSend(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      await api.patch(`/tickets/${ticketId}`, { status: newStatus });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Carregando Histórico...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="bg-red-50 p-20 rounded-[40px] border border-red-100 flex flex-col items-center justify-center text-center">
         <AlertCircle className="w-20 h-20 text-red-600 mb-6" />
         <h2 className="text-2xl font-black text-red-900 mb-2">Chamado não encontrado</h2>
         <p className="text-red-600 font-medium mb-8 max-w-xs">{error || 'O ticket solicitado pode ter sido removido ou você não tem acesso.'}</p>
         <button onClick={onBack} className="h-14 px-10 bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-100 transition-all">Voltar para a Lista</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-160px)] min-h-[600px]">
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <button 
                onClick={onBack}
                className="w-12 h-12 flex items-center justify-center bg-white text-slate-400 hover:text-blue-600 rounded-2xl shadow-sm border border-slate-100 transition-all"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                 <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Ticket #{ticket.id}</span>
                    <Badge variant={ticket.status === 'resolvido' ? 'emerald' : 'blue'}>{ticket.status.replace('_', ' ')}</Badge>
                 </div>
                 <h3 className="text-xl font-black text-slate-900 truncate max-w-md">{ticket.titulo}</h3>
              </div>
           </div>
           
           {(currentUser.administrador || currentUser.desenvolvedor) && (
             <div className="flex items-center gap-3">
                <select 
                  value={ticket.status}
                  onChange={(e) => handleUpdateStatus(e.target.value)}
                  className="h-10 px-4 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                >
                   <option value="aberto">Aberto</option>
                   <option value="em_andamento">Em Andamento</option>
                   <option value="aguardando_cliente">Aguardando Cliente</option>
                   <option value="resolvido">Resolvido</option>
                   <option value="fechado">Fechado</option>
                </select>
             </div>
           )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100">
             <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                   <UserIcon size={24} />
                </div>
                <div>
                   <div className="text-sm font-black text-slate-900">{ticket.cliente_nome}</div>
                   <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(ticket.created_at).toLocaleString()} (Abertura)</div>
                </div>
             </div>
             <div className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap pl-16">
               {ticket.descricao}
             </div>
          </div>

          <div className="relative">
             <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-slate-100"></div>
             <div className="relative flex justify-center">
                <span className="bg-white px-4 text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Início da Conversa</span>
             </div>
          </div>

          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={cn(
                "flex gap-4 group",
                msg.interno && "bg-amber-50/50 p-6 rounded-[32px] border border-dashed border-amber-200"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-sm uppercase flex-shrink-0 animate-in zoom-in-50 duration-300 shadow-md",
                msg.autor_id === ticket.cliente_id ? "bg-slate-800" : (msg.interno ? "bg-amber-500" : "bg-blue-600")
              )}>
                {msg.autor_nome.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1.5">
                   <span className="text-sm font-black text-slate-900">{msg.autor_nome}</span>
                   <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(msg.created_at).toLocaleString()}</span>
                   {msg.interno && (
                     <Badge variant="amber" className="text-[8px] font-black tracking-widest"><Lock size={10} className="mr-1" /> Nota Interna</Badge>
                   )}
                </div>
                <div className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {msg.mensagem}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-8 border-t border-slate-50 bg-slate-50/30">
          <form onSubmit={handleSendMessage} className="space-y-4">
             <div className="flex items-center gap-4 mb-2">
                <div className="flex bg-slate-100 p-1 rounded-xl">
                   <button 
                     type="button"
                     onClick={() => setIsInternal(false)}
                     className={cn(
                       "h-8 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                       !isInternal ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                     )}
                   >
                     Público
                   </button>
                   {(currentUser.administrador || currentUser.desenvolvedor) && (
                     <button 
                       type="button"
                       onClick={() => setIsInternal(true)}
                       className={cn(
                         "h-8 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                         isInternal ? "bg-amber-100 text-amber-700 shadow-sm" : "text-slate-400 hover:text-slate-600"
                       )}
                     >
                       Interno
                     </button>
                   )}
                </div>
             </div>
             <div className="relative group">
                <textarea 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={isInternal ? "Escrever nota interna (visível apenas para o time)..." : "Escreva sua resposta para o cliente..."}
                  rows={2}
                  className={cn(
                    "w-full bg-white border border-slate-200 rounded-[28px] pl-6 pr-24 py-4 text-sm font-bold focus:ring-4 transition-all outline-none resize-none",
                    isInternal ? "focus:ring-amber-50 border-amber-200" : "focus:ring-blue-50 focus:border-blue-200"
                  )}
                />
                <div className="absolute right-3 bottom-3 flex items-center gap-2">
                   <button 
                    type="submit" 
                    disabled={!newMessage.trim() || loadingSend}
                    className={cn(
                      "h-10 w-10 flex items-center justify-center rounded-2xl transition-all shadow-lg active:scale-95 disabled:opacity-50",
                      isInternal ? "bg-amber-500 text-white shadow-amber-100" : "bg-blue-600 text-white shadow-blue-100"
                    )}
                   >
                      {loadingSend ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                   </button>
                </div>
             </div>
          </form>
        </div>
      </div>

      {/* Sidebar Info */}
      <div className="w-full lg:w-96 space-y-6">
         <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
            <div>
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-2">Informações do Cliente</h4>
               <div className="space-y-6">
                  <div className="flex items-center gap-4">
                     <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-white font-black text-xl">
                        {ticket.cliente_nome.charAt(0)}
                     </div>
                     <div>
                        <div className="text-base font-black text-slate-900 leading-tight">{ticket.cliente_nome}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">{ticket.cliente_email}</div>
                     </div>
                  </div>
                  <div className="space-y-4">
                     <div className="flex items-center gap-3">
                        <Building2 size={16} className="text-slate-300" />
                        <span className="text-xs font-bold text-slate-600">{ticket.empresa_nome || 'Gestifique Master'}</span>
                     </div>
                     <div className="flex items-center gap-3">
                        <Tag size={16} className="text-slate-300" />
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">{ticket.categoria}</span>
                     </div>
                     <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <Calendar size={16} className="text-slate-300" /> Aberto em: {new Date(ticket.created_at).toLocaleDateString()}
                     </div>
                  </div>
               </div>
            </div>

            <div>
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-2">Propriedades</h4>
               <div className="space-y-4">
                  <div className="flex items-center justify-between py-1">
                     <span className="text-xs font-bold text-slate-400">Prioridade</span>
                     <Badge variant={ticket.prioridade === 'urgente' ? 'red' : 'blue'} className="px-4 uppercase text-[10px]">{ticket.prioridade}</Badge>
                  </div>
                  <div className="flex items-center justify-between py-1">
                     <span className="text-xs font-bold text-slate-400">Tipo de Chamado</span>
                     <span className="text-xs font-black text-slate-900 uppercase">Suporte</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                     <span className="text-xs font-bold text-slate-400">Tempo Decorrido</span>
                     <span className="text-xs font-black text-blue-600">-- h -- min</span>
                  </div>
               </div>
            </div>

            <div className="pt-4">
               <button className="w-full h-12 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 font-black text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2">
                  <Trash2 size={16} /> Excluir Atendimento
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};
