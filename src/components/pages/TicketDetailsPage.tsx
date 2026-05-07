import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import { Ticket, Message, User } from '../../types';
import { 
  ArrowLeft, 
  Send, 
  MessageSquare,
  CheckCircle2, 
  AlertCircle,
  User as UserIcon,
  Calendar,
  Building2,
  Loader2,
  Trash2,
  Tag,
} from 'lucide-react';
import { Badge } from '../ui/Badge';

type BadgeVariant = 'blue' | 'emerald' | 'amber' | 'red' | 'indigo' | 'slate' | 'orange';
type TicketStatus = 'aberto' | 'em_andamento' | 'aguardando_cliente' | 'resolvido' | 'fechado';
type TicketPriority = 'baixa' | 'media' | 'alta' | 'urgente';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

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
          const isActive = u.ativo !== false;
          if (!isActive) return false;
          
          if (currentUser.desenvolvedor) return isAgent;
          return isAgent && u.empresa_id === currentUser.empresa_id;
        });
        setAgents(filteredAgents);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar detalhes do atendimento.';
      setError(message);
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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao enviar mensagem.';
      setActionError(message);
    } finally {
      setLoadingSend(false);
    }
  };

  const handleUpdateTicket = async (data: Partial<Ticket>) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      await api.patch(`/tickets/${ticketId}`, data);
      setActionSuccess('Atendimento atualizado com sucesso!');
      fetchData();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar atendimento.';
      setActionError(message);
    }
  };

  const handleArchiveTicket = async () => {
    await handleUpdateTicket({ status: 'fechado' });
    setIsArchiveConfirmOpen(false);
  };

  const getStatusVariant = (status: string): BadgeVariant => {
    const map: Record<string, BadgeVariant> = {
      aberto: 'blue',
      em_andamento: 'indigo',
      aguardando_cliente: 'amber',
      resolvido: 'emerald',
      fechado: 'slate'
    };
    return map[status] || 'slate';
  };

  const getPriorityVariant = (priority: string): BadgeVariant => {
    const map: Record<string, BadgeVariant> = {
      baixa: 'blue',
      media: 'indigo',
      alta: 'orange',
      urgente: 'red'
    };
    return map[priority] || 'slate';
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
      <Card className="p-12 border-red-100 bg-red-50/30 flex flex-col items-center justify-center text-center rounded-xl">
         <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
         <h2 className="text-xl font-semibold text-slate-900 mb-2">Atendimento não encontrado</h2>
         <p className="text-slate-500 font-medium mb-8 max-w-sm">{error || 'O atendimento solicitado pode ter sido removido ou você não tem acesso.'}</p>
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
    <div className="flex flex-col gap-6">
      <ConfirmDialog 
        isOpen={isArchiveConfirmOpen}
        onClose={() => setIsArchiveConfirmOpen(false)}
        onConfirm={handleArchiveTicket}
        title="Arquivar Atendimento?"
        description="O atendimento será fechado e continuará disponível para consulta."
        confirmLabel="Arquivar"
        cancelLabel="Cancelar"
        variant="danger"
      />

      {/* Header Compacto */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm"
            title="Voltar para a lista"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">#{ticket.id}</span>
              <span className="text-slate-300">·</span>
              <Badge variant={getStatusVariant(ticket.status || 'aberto')} className="text-[9px] py-0 px-1.5 font-bold uppercase tracking-tight">{(ticket.status || 'aberto').replace('_', ' ')}</Badge>
              <Badge variant={getPriorityVariant(ticket.prioridade || 'media')} className="text-[9px] py-0 px-1.5 font-bold uppercase tracking-tight">{ticket.prioridade || 'media'}</Badge>
            </div>
            <h2 className="text-lg font-bold text-slate-900 truncate leading-tight tracking-tight">{ticket.titulo || 'Atendimento'}</h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Principal */}
        <div className="lg:col-span-8 space-y-6">
          {/* Descrição */}
          <Card>
            <CardHeader className="py-2.5 px-5 border-b border-slate-50">
               <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Descrição</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
               <div className="flex items-start gap-4 mb-4">
                  <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-xs shrink-0">
                     {clienteNome.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                     <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-bold text-slate-900">{clienteNome}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{new Date(ticket.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                     </div>
                     <div className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {ticket.descricao || 'Nenhuma descrição fornecida.'}
                     </div>
                  </div>
               </div>
            </CardContent>
          </Card>

          {/* Histórico/Mensagens */}
          <Card>
            <CardHeader className="py-2.5 px-5 border-b border-slate-50">
               <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Histórico</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               <div className="max-h-[500px] overflow-y-auto p-5 space-y-5 custom-scrollbar">
                  {messages.length === 0 ? (
                    <div className="py-10 text-center flex flex-col items-center">
                       <div className="w-10 h-10 bg-slate-50 text-slate-200 rounded-xl flex items-center justify-center mb-3">
                          <MessageSquare size={20} />
                       </div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nenhuma mensagem registrada.</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={cn(
                          "flex gap-4 p-4 rounded-xl border transition-colors",
                          msg.interno 
                            ? "bg-amber-50/40 border-amber-100/50 border-dashed" 
                            : "bg-white border-slate-100 hover:border-slate-200"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-[10px] uppercase shrink-0 shadow-sm",
                          msg.usuario_id === ticket.usuario_id ? "bg-slate-900" : (msg.interno ? "bg-amber-500" : "bg-blue-600")
                        )}>
                          {(msg.usuario_nome || 'S').charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                             <div className="flex items-center gap-2">
                                <span className={cn("text-xs font-bold", msg.interno ? "text-amber-900" : "text-slate-900")}>{msg.usuario_nome || 'Sistema'}</span>
                                {msg.interno && (
                                  <Badge variant="amber" className="text-[8px] font-bold px-1.5 py-0 uppercase border-none shadow-none">Nota Interna</Badge>
                                )}
                             </div>
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{new Date(msg.created_at).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span>
                          </div>
                          <div className={cn("text-sm font-medium leading-relaxed whitespace-pre-wrap", msg.interno ? "text-amber-800" : "text-slate-600")}>
                            {msg.mensagem}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
               </div>
            </CardContent>
            
            {/* Campo de Resposta */}
            <div className="p-5 pt-0">
               <div className="pt-5 border-t border-slate-50">
                  <form onSubmit={handleSendMessage} className="space-y-4">
                     {(actionError || actionSuccess) && (
                        <AnimatePresence>
                           {actionError && (
                             <motion.div 
                               initial={{ opacity: 0, y: -10 }}
                               animate={{ opacity: 1, y: 0 }}
                               className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-xs font-bold"
                             >
                               <AlertCircle size={14} /> {actionError}
                             </motion.div>
                           )}
                           {actionSuccess && (
                             <motion.div 
                               initial={{ opacity: 0, y: -10 }}
                               animate={{ opacity: 1, y: 0 }}
                               className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-2 text-emerald-600 text-xs font-bold"
                             >
                               <CheckCircle2 size={14} /> {actionSuccess}
                             </motion.div>
                           )}
                        </AnimatePresence>
                     )}

                     <div className="relative group">
                        <textarea 
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder={isInternal ? "Escrever nota interna (visível apenas para equipe)..." : "Escrever resposta para o cliente..."}
                          rows={3}
                          className={cn(
                            "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 transition-all outline-none resize-none",
                            isInternal ? "focus:ring-amber-100 focus:border-amber-300 bg-amber-50/20" : "focus:ring-blue-100 focus:border-blue-300"
                          )}
                        />
                     </div>

                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-4">
                           {(currentUser.administrador || currentUser.desenvolvedor) && (
                             <label className="flex items-center gap-2 cursor-pointer group">
                                <div 
                                  onClick={() => setIsInternal(!isInternal)}
                                  className={cn(
                                    "w-8 h-4 rounded-full transition-all relative",
                                    isInternal ? "bg-amber-500" : "bg-slate-200 group-hover:bg-slate-300"
                                  )}
                                >
                                   <div className={cn(
                                     "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow-sm",
                                     isInternal ? "translate-x-4" : "translate-x-0"
                                   )} />
                                </div>
                                <span className={cn("text-[10px] font-bold uppercase tracking-widest", isInternal ? "text-amber-600" : "text-slate-400 group-hover:text-slate-500")}>Nota Interna</span>
                             </label>
                           )}
                        </div>

                        <Button 
                          type="submit" 
                          disabled={!newMessage.trim() || loadingSend}
                          className={cn(
                            "h-9 px-6 font-bold text-xs uppercase tracking-widest shadow-sm",
                            isInternal ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-600 hover:bg-blue-700"
                          )}
                        >
                          {loadingSend ? (
                            <Loader2 size={16} className="animate-spin mr-2" />
                          ) : (
                            <Send size={16} className="mr-2" />
                          )}
                          Enviar
                        </Button>
                     </div>
                  </form>
               </div>
            </div>
          </Card>
        </div>

        {/* Coluna Lateral */}
        <div className="lg:col-span-4 space-y-6">
           <Card>
              <CardHeader className="py-2.5 px-5 border-b border-slate-50">
                 <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Propriedades</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-6">
                 {/* Status & Prioridade para Admin */}
                 {(currentUser.administrador || currentUser.desenvolvedor) ? (
                   <div className="space-y-4">
                      <div className="space-y-1.5">
                         <span className="text-xs font-semibold text-slate-500">Status</span>
                         <select 
                           value={ticket.status || 'aberto'}
                           onChange={(e) => handleUpdateTicket({ status: e.target.value as TicketStatus })}
                           className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer hover:bg-slate-50"
                         >
                            <option value="aberto">Aberto</option>
                            <option value="em_andamento">Em Andamento</option>
                            <option value="aguardando_cliente">Aguardando Cliente</option>
                            <option value="resolvido">Resolvido</option>
                            <option value="fechado">Fechado</option>
                         </select>
                      </div>
                      <div className="space-y-1.5">
                         <span className="text-xs font-semibold text-slate-500">Prioridade</span>
                         <select 
                           value={ticket.prioridade || 'media'}
                           onChange={(e) => handleUpdateTicket({ prioridade: e.target.value as TicketPriority })}
                           className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer hover:bg-slate-50"
                         >
                            <option value="baixa">Baixa</option>
                            <option value="media">Média</option>
                            <option value="alta">Alta</option>
                            <option value="urgente">Urgente</option>
                         </select>
                      </div>
                      <div className="space-y-1.5">
                         <span className="text-xs font-semibold text-slate-500">Responsável</span>
                         <select 
                           value={ticket.responsavel_id || ''}
                           onChange={(e) => handleUpdateTicket({ responsavel_id: e.target.value ? parseInt(e.target.value) : null })}
                           className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer hover:bg-slate-50"
                         >
                            <option value="">Sem responsável</option>
                            {agents.map(agent => (
                              <option key={agent.id} value={agent.id}>{agent.nome || 'Usuário'}</option>
                            ))}
                         </select>
                      </div>
                   </div>
                 ) : (
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                         <span className="text-xs font-semibold text-slate-500">Status</span>
                         <div className="pt-1">
                            <Badge variant={getStatusVariant(ticket.status || 'aberto')} className="uppercase text-[9px] font-bold border-none">{(ticket.status || 'aberto').replace('_', ' ')}</Badge>
                         </div>
                      </div>
                      <div className="space-y-1">
                         <span className="text-xs font-semibold text-slate-500">Prioridade</span>
                         <div className="pt-1">
                            <Badge variant={getPriorityVariant(ticket.prioridade || 'media')} className="uppercase text-[9px] font-bold border-none">{ticket.prioridade || 'media'}</Badge>
                         </div>
                      </div>
                   </div>
                 )}

                 <div className="space-y-4 pt-4 border-t border-slate-50">
                    <div className="space-y-2">
                       <span className="text-xs font-semibold text-slate-500">Solicitante</span>
                       <div className="flex items-center gap-3 bg-slate-50/50 p-2 rounded-lg border border-slate-100/50">
                          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                             <UserIcon size={14} />
                          </div>
                          <div className="min-w-0">
                             <div className="text-xs font-bold text-slate-900 truncate">{clienteNome}</div>
                             <div className="text-[10px] font-medium text-slate-400 truncate mt-0.5">{ticket.cliente_email || 'Email não disponível'}</div>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <span className="text-xs font-semibold text-slate-500">Empresa</span>
                       <div className="flex items-center gap-3">
                          <Building2 size={14} className="text-slate-300" />
                          <span className="text-xs font-bold text-slate-600 truncate">{empresaNome}</span>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <span className="text-xs font-semibold text-slate-500">Categoria</span>
                       <div className="flex items-center gap-3">
                          <Tag size={14} className="text-slate-300" />
                          <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{(ticket.categoria || 'Não informada').replace('_', ' ')}</span>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <span className="text-xs font-semibold text-slate-500">Origem</span>
                       <div className="flex items-center gap-3">
                          <Calendar size={14} className="text-slate-300" />
                          <span className="text-xs font-bold text-slate-600">{origemLabel}</span>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-3 pt-4 border-t border-slate-50">
                    <div className="flex justify-between items-center text-xs font-medium">
                       <span className="text-slate-500">Aberto em</span>
                       <span className="text-slate-800 font-semibold">{new Date(ticket.created_at).toLocaleDateString()}</span>
                    </div>
                    {ticket.updated_at && ticket.updated_at !== ticket.created_at && (
                      <div className="flex justify-between items-center text-xs font-medium">
                         <span className="text-slate-500">Atualizado</span>
                         <span className="text-slate-800 font-semibold">{new Date(ticket.updated_at).toLocaleDateString()}</span>
                      </div>
                    )}
                    {ticket.prazo_sla && (
                      <div className="flex justify-between items-center text-xs font-medium">
                         <span className="text-slate-500">Prazo SLA</span>
                         <span className="text-amber-600 font-bold">{new Date(ticket.prazo_sla).toLocaleDateString()}</span>
                      </div>
                    )}
                    {ticket.status === 'fechado' && (ticket.finalizado_em || ticket.updated_at) && (
                      <div className="flex justify-between items-center text-xs font-medium">
                         <span className="text-slate-500">Finalizado</span>
                         <span className="text-emerald-600 font-bold">{new Date(ticket.finalizado_em || ticket.updated_at).toLocaleDateString()}</span>
                      </div>
                    )}
                 </div>

                 {(currentUser.administrador || currentUser.desenvolvedor) && ticket.status !== 'fechado' && (
                   <div className="pt-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => setIsArchiveConfirmOpen(true)}
                        className="w-full h-9 border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-all text-[10px] font-bold uppercase tracking-widest rounded-lg"
                      >
                         <Trash2 size={12} className="mr-2" /> Arquivar Atendimento
                      </Button>
                   </div>
                 )}
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
};
