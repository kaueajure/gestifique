import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import { Ticket, Message, User } from '../../types';
import { 
  ArrowLeft, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  User as UserIcon,
  Calendar,
  Building2,
  Lock,
  Loader2,
  Trash2,
  Tag,
  Clock,
  History
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

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
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [agents, setAgents] = useState<User[]>([]);
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
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

      if (currentUser.administrador || currentUser.desenvolvedor) {
        const usersData = await api.get<User[]>('/users');
        const filteredAgents = usersData.filter(u => {
          const isAgent = u.administrador || u.desenvolvedor;
          if (currentUser.desenvolvedor) return isAgent;
          return isAgent && u.empresa_id === currentUser.empresa_id;
        });
        setAgents(filteredAgents);
      }
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
    setActionError(null);
    setActionSuccess(null);
    try {
      await api.post(`/tickets/${ticketId}/messages`, {
        mensagem: newMessage,
        interno: isInternal
      });
      setNewMessage('');
      setActionSuccess('Mensagem enviada com sucesso!');
      const updatedMessages = await api.get<Message[]>(`/tickets/${ticketId}/messages`);
      setMessages(updatedMessages);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setActionError(err.message || 'Erro ao enviar mensagem.');
    } finally {
      setLoadingSend(false);
    }
  };

  const handleUpdateTicket = async (data: Partial<Ticket>) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      await api.patch(`/tickets/${ticketId}`, data);
      setActionSuccess('Chamado atualizado com sucesso!');
      fetchData();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setActionError(err.message || 'Erro ao atualizar chamado.');
    }
  };

  const handleArchiveTicket = async () => {
    handleUpdateTicket({ status: 'fechado' });
  };

  const getStatusVariant = (status: string) => {
    const map: Record<string, any> = {
      aberto: 'blue',
      em_andamento: 'indigo',
      aguardando_cliente: 'amber',
      resolvido: 'emerald',
      fechado: 'slate'
    };
    return map[status] || 'slate';
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-slate-400 font-medium text-sm">Carregando histórico...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <Card className="p-12 border-red-100 bg-red-50/30 flex flex-col items-center justify-center text-center">
         <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
         <h2 className="text-xl font-semibold text-slate-900 mb-2">Chamado não encontrado</h2>
         <p className="text-slate-500 font-medium mb-8 max-w-sm">{error || 'O ticket solicitado pode ter sido removido ou você não tem acesso.'}</p>
         <Button onClick={onBack}>Voltar para a Lista</Button>
      </Card>
    );
  }

  const clienteNome = ticket.cliente_nome || 'Não informado';
  const empresaNome = ticket.empresa_nome || 'Empresa não vinculada';
  const responsavelNome = ticket.responsavel_nome || 'Sem responsável';
  const categoriaLabel = ticket.categoria || 'Não informado';
  const origemLabel = ticket.origem || 'Não informado';

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-160px)] min-h-[600px]">
      <ConfirmDialog 
        isOpen={isArchiveConfirmOpen}
        onClose={() => setIsArchiveConfirmOpen(false)}
        onConfirm={handleArchiveTicket}
        title="Arquivar Atendimento"
        description="Tem certeza que deseja arquivar este atendimento? Ele ficará fechado e poderá ser consultado depois."
        confirmLabel="Arquivar"
        cancelLabel="Cancelar"
        variant="danger"
      />

      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <button 
                onClick={onBack}
                className="w-8 h-8 flex items-center justify-center bg-white text-slate-400 hover:text-slate-900 rounded-lg shadow-sm border border-slate-200 transition-all active:scale-95"
              >
                <ArrowLeft size={14} />
              </button>
              <div className="min-w-0">
                 <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">#{ticket.id}</span>
                    <Badge variant={getStatusVariant(ticket.status)} className="text-[9px] py-0 px-1.5 font-bold uppercase">{ticket.status.replace('_', ' ')}</Badge>
                 </div>
                 <h3 className="text-sm font-semibold text-slate-900 truncate max-w-md leading-tight">{ticket.titulo}</h3>
              </div>
           </div>
           
           {(currentUser.administrador || currentUser.desenvolvedor) && (
             <div className="flex items-center gap-2">
                <select 
                  value={ticket.status}
                  onChange={(e) => handleUpdateTicket({ status: e.target.value as any })}
                  className="h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
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
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar bg-white">
          <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-100">
             <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white shadow-sm font-bold text-xs">
                   {clienteNome.charAt(0)}
                </div>
                <div>
                   <div className="text-sm font-bold text-slate-900">{clienteNome}</div>
                   <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight italic">Relatado em {new Date(ticket.created_at).toLocaleString()}</div>
                </div>
             </div>
             <div className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap pl-11">
               {ticket.descricao}
             </div>
          </div>

          <div className="relative py-2">
             <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-slate-50"></div>
             <div className="relative flex justify-center">
                <span className="bg-white px-3 text-[9px] font-bold text-slate-300 uppercase tracking-widest italic">Comunicações</span>
             </div>
          </div>

          {(actionError || actionSuccess) && (
            <AnimatePresence>
               {actionError && (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-xs font-semibold"
                 >
                   <AlertCircle size={14} /> {actionError}
                 </motion.div>
               )}
               {actionSuccess && (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-2 text-emerald-600 text-xs font-semibold"
                 >
                   <CheckCircle2 size={14} /> {actionSuccess}
                 </motion.div>
               )}
            </AnimatePresence>
          )}

          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={cn(
                "flex gap-3 animate-in fade-in slide-in-from-bottom-1 duration-300",
                msg.interno && "bg-amber-50/50 p-3 rounded-xl border border-dashed border-amber-100"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-[10px] uppercase flex-shrink-0 shadow-sm",
                msg.usuario_id === ticket.usuario_id ? "bg-slate-900" : (msg.interno ? "bg-amber-500" : "bg-blue-600")
              )}>
                {(msg.usuario_nome || 'U').charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                   <span className="text-xs font-bold text-slate-900">{msg.usuario_nome || 'Usuário'}</span>
                   <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight italic">{new Date(msg.created_at).toLocaleString()}</span>
                   {msg.interno && (
                     <Badge variant="amber" className="text-[8px] font-bold px-1.5 py-0 uppercase">Nota Interna</Badge>
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
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <form onSubmit={handleSendMessage} className="space-y-4">
             <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => setIsInternal(false)}
                  className={cn(
                    "h-8 px-3 rounded-md text-[10px] font-bold uppercase tracking-tight transition-all",
                    !isInternal ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  Público
                </button>
                {(currentUser.administrador || currentUser.desenvolvedor) && (
                  <button 
                    type="button"
                    onClick={() => setIsInternal(true)}
                    className={cn(
                      "h-8 px-3 rounded-md text-[10px] font-bold uppercase tracking-tight transition-all",
                      isInternal ? "bg-amber-100 text-amber-700 shadow-sm ring-1 ring-amber-200" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    Interno
                  </button>
                )}
             </div>
             <div className="relative flex items-end gap-2">
                <textarea 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={isInternal ? "Escrever nota interna..." : "Sua resposta..."}
                  rows={1}
                  className={cn(
                    "flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-4 transition-all outline-none resize-none min-h-[46px]",
                    isInternal ? "focus:ring-amber-50 border-amber-200" : "focus:ring-blue-50 focus:border-blue-200"
                  )}
                />
                <Button 
                  type="submit" 
                  disabled={!newMessage.trim() || loadingSend}
                  size="icon"
                  className={cn(
                    "h-11 w-11 rounded-xl shrink-0",
                    isInternal ? "bg-amber-500 hover:bg-amber-600 shadow-amber-100" : "bg-blue-600 hover:bg-blue-700 shadow-blue-100"
                  )}
                >
                  {loadingSend ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </Button>
             </div>
          </form>
        </div>
      </div>

      {/* Sidebar Info */}
      <div className="w-full lg:w-80 space-y-4">
         <Card className="p-6 space-y-6">
            <div>
               <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-50 pb-2">Informações do Cliente</h4>
               <div className="space-y-4">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-sm">
                        {clienteNome.charAt(0)}
                     </div>
                     <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 truncate">{clienteNome}</div>
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight truncate">{ticket.cliente_email || 'Email não informado'}</div>
                     </div>
                  </div>
                  <div className="space-y-3">
                     <div className="flex items-center gap-2.5">
                        <Building2 size={14} className="text-slate-300" />
                        <span className="text-xs font-semibold text-slate-600 truncate">{empresaNome}</span>
                     </div>
                     <div className="flex items-center gap-2.5">
                        <Tag size={14} className="text-slate-300" />
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-tight truncate">{categoriaLabel}</span>
                     </div>
                     <div className="flex items-center gap-2.5">
                        <Calendar size={14} className="text-slate-300" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Criado: {new Date(ticket.created_at).toLocaleDateString()}</span>
                     </div>
                  </div>
               </div>
            </div>

            <div>
               <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-50 pb-2">Gestão do Ticket</h4>
               <div className="space-y-4">
                  <div className="space-y-1.5 px-0.5">
                     <span className="text-[10px] font-bold text-slate-400 uppercase">Prioridade</span>
                     {currentUser.administrador || currentUser.desenvolvedor ? (
                       <select 
                         value={ticket.prioridade}
                         onChange={(e) => handleUpdateTicket({ prioridade: e.target.value as any })}
                         className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                       >
                          <option value="baixa">Baixa</option>
                          <option value="media">Média</option>
                          <option value="alta">Alta</option>
                          <option value="urgente">Urgente</option>
                       </select>
                     ) : (
                       <Badge variant={ticket.prioridade === 'urgente' ? 'red' : 'blue'} className="px-3 uppercase text-[10px]">{ticket.prioridade}</Badge>
                     )}
                  </div>
                  
                  <div className="space-y-1.5 px-0.5">
                     <span className="text-[10px] font-bold text-slate-400 uppercase">Responsável</span>
                     {currentUser.administrador || currentUser.desenvolvedor ? (
                       <select 
                         value={ticket.responsavel_id || ''}
                         onChange={(e) => handleUpdateTicket({ responsavel_id: e.target.value ? parseInt(e.target.value) : null })}
                         className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                       >
                          <option value="">Não atribuído</option>
                          {agents.map(agent => (
                            <option key={agent.id} value={agent.id}>{agent.nome}</option>
                          ))}
                       </select>
                     ) : (
                       <div className="text-xs font-bold text-slate-900">{responsavelNome}</div>
                     )}
                  </div>
               </div>
            </div>

            <div className="pt-2">
               {(currentUser.administrador || currentUser.desenvolvedor) && ticket.status !== 'fechado' && (
                 <Button 
                   variant="outline"
                   onClick={() => setIsArchiveConfirmOpen(true)}
                   className="w-full h-10 border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-all text-xs font-semibold rounded-lg"
                 >
                    <Trash2 size={14} className="mr-2" /> Arquivar Ticket
                 </Button>
               )}
            </div>
         </Card>
      </div>
    </div>
  );
};
