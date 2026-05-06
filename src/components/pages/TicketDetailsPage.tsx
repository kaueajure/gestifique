import React, { useState, useEffect, useRef } from 'react';
import { Ticket, Message, User } from '../../types';
import { api } from '../../lib/api';
import { 
  ArrowLeft, Send, Clock, AlertCircle, User as UserIcon, ShieldCheck, 
  Ticket as TicketIcon, Tag, Paperclip, Eye, CheckCircle2, Trash2,
  RefreshCw, MoreVertical, MessageSquare
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

interface TicketDetailsPageProps {
  ticketId: number;
  onBack: () => void;
  currentUser: User;
}

export const TicketDetailsPage = ({ ticketId, onBack, currentUser }: TicketDetailsPageProps) => {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchDetails = async () => {
    try {
      const [tData, mData] = await Promise.all([
        api.get<Ticket>(`/tickets/${ticketId}`),
        api.get<Message[]>(`/tickets/${ticketId}/messages`)
      ]);
      setTicket(tData);
      setMessages(mData);
    } catch (error) {
       console.error(error);
       onBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDetails(); }, [ticketId]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      await api.post(`/tickets/${ticketId}/messages`, { mensagem: newMessage, interno: isInternal });
      setNewMessage('');
      fetchDetails();
    } catch (error) { console.error(error); }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await api.patch(`/tickets/${ticketId}`, { status });
      fetchDetails();
    } catch (error) { console.error(error); }
  };

  if (loading || !ticket) return <div className="p-20 flex justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  const canManage = currentUser.administrador || currentUser.desenvolvedor;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all hover:bg-blue-50 shadow-sm">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{ticket.titulo}</h2>
              <Badge variant={ticket.status === 'resolvido' || ticket.status === 'fechado' ? 'emerald' : 'blue'}>{ticket.status.replace('_', ' ')}</Badge>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <span className="text-blue-600">#{ticket.id}</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
              <span>{new Date(ticket.created_at).toLocaleString()}</span>
            </div>
          </div>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleStatusChange(ticket.status === 'resolvido' ? 'em_andamento' : 'resolvido')}
              className={cn("h-12 px-6 rounded-2xl text-white font-bold flex items-center gap-2 shadow-lg transition-all", 
                ticket.status === 'resolvido' ? "bg-amber-500 shadow-amber-100 hover:bg-amber-600" : "bg-emerald-600 shadow-emerald-100 hover:bg-emerald-700")}
            >
              {ticket.status === 'resolvido' ? <RefreshCw size={18} /> : <CheckCircle2 size={18} />}
              {ticket.status === 'resolvido' ? "Reabrir" : "Resolver"}
            </button>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><TicketIcon size={20} className="text-blue-600" /> Descrição</h3>
            <div className="text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">{ticket.descricao}</div>
          </div>
          <div className="space-y-6">
            <h3 className="font-black text-slate-800 flex items-center gap-3"><MessageSquare size={18} className="text-blue-600" /> Timeline <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black rounded-lg">{messages.length}</span></h3>
            <div className="space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={cn("flex gap-4 p-6 rounded-3xl border transition-all", msg.usuario_id === currentUser.id ? "bg-blue-50 border-blue-100 ml-8" : msg.interno ? "bg-amber-50 border-amber-100 border-dashed" : "bg-white border-slate-200")}>
                  <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs uppercase", msg.usuario_id === currentUser.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600")}>{msg.usuario_nome.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-sm font-black text-slate-800">{msg.usuario_nome} {msg.interno && <Badge variant="amber" className="ml-2">Interno</Badge>}</span>
                       <span className="text-[10px] font-bold text-slate-400">{new Date(msg.created_at).toLocaleString()}</span>
                    </div>
                    <div className="text-sm text-slate-600 font-medium whitespace-pre-wrap">{msg.mensagem}</div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl focus-within:ring-4 focus-within:ring-blue-50 transition-all">
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div className="flex items-center gap-4">
                  <button type="button" className="text-slate-400 hover:text-blue-600 flex items-center gap-2 text-xs font-bold"><Paperclip size={16} /> Anexar</button>
                  {canManage && <button type="button" onClick={() => setIsInternal(!isInternal)} className={cn("flex items-center gap-2 text-xs font-bold transition-all px-3 py-1.5 rounded-xl border", isInternal ? "bg-amber-50 text-amber-600 border-amber-200" : "text-slate-400 hover:text-slate-600 border-transparent hover:bg-slate-50")}>{isInternal ? <Eye size={16} /> : <ShieldCheck size={16} />} {isInternal ? "Comentário Interno" : "Habilitar Interno"}</button>}
                </div>
                <div className="relative">
                  <textarea className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-0 outline-none min-h-[100px] resize-none" placeholder="Escreva sua resposta aqui..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                  <button type="submit" disabled={!newMessage.trim()} className="absolute bottom-4 right-4 w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95"><Send size={20} /></button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8 text-sm">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Informações</h4>
              <div className="flex justify-between items-center"><span className="font-bold text-slate-500">Status</span> <Badge variant={ticket.status === 'resolvido' ? 'emerald' : 'blue'}>{ticket.status}</Badge></div>
              <div className="flex justify-between items-center"><span className="font-bold text-slate-500">Prioridade</span> <Badge variant={ticket.prioridade === 'urgente' ? 'red' : 'blue'}>{ticket.prioridade}</Badge></div>
              <div className="flex justify-between items-center"><span className="font-bold text-slate-500">Categoria</span> <span className="font-black uppercase">{ticket.categoria}</span></div>
            </div>
            <div className="pt-8 border-t border-slate-100 space-y-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pessoas</h4>
              <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-xs text-slate-600 uppercase">{ticket.cliente_nome?.charAt(0)}</div><div><div className="font-black text-slate-800">{ticket.cliente_nome}</div><div className="text-[10px] font-bold text-slate-400">Solicitante</div></div></div>
              <div className="flex items-center gap-3"><div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs uppercase", ticket.responsavel_nome ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "bg-slate-100 text-slate-300")}>{ticket.responsavel_nome ? ticket.responsavel_nome.charAt(0) : <UserIcon size={18} />}</div><div className="flex-1"><div className="font-black text-slate-800">{ticket.responsavel_nome || 'Não atribuído'}</div><div className="text-[10px] font-bold text-slate-400">Responsável</div></div></div>
            </div>
            {canManage && (
              <div className="pt-8 border-t border-slate-100 space-y-4">
                <select className="w-full h-12 bg-slate-50 border-none rounded-2xl px-4 font-bold text-slate-700 focus:ring-2 focus:ring-blue-100 transition-all outline-none" onChange={(e) => handleStatusChange(e.target.value)} value={ticket.status}><option value="aberto">Aberto</option><option value="em_andamento">Em Andamento</option><option value="aguardando_cliente">Aguardando Cliente</option><option value="resolvido">Resolvido</option><option value="fechado">Fechado</option></select>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
