import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Ticket, Message, User, TicketAttachment, TicketTimelineItem, TicketStatus } from '../../types';
import { AlertCircle, Loader2, MessageSquare, History, CheckCircle2, Clock, ChevronLeft, User as UserIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { TicketProperties } from '../tickets/details/TicketProperties';
import { TicketConversation } from '../tickets/details/TicketConversation';
import { TicketTimeline } from '../tickets/details/TicketTimeline';
import { Select } from '../ui/Select';
import { cn, getSlaInfo } from '../../lib/utils';
import { getSocket } from '../../lib/socket';

interface TicketDetailsPageProps {
  ticketId: number;
  onBack: () => void;
  currentUser: User;
}

export const TicketDetailsPage = ({ ticketId, onBack, currentUser }: TicketDetailsPageProps) => {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [timeline, setTimeline] = useState<TicketTimelineItem[]>([]);
  const [activeTab, setActiveTab] = useState<'messages' | 'timeline'>('messages');
  const [loading, setLoading] = useState(true);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [loadingSend, setLoadingSend] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [agents, setAgents] = useState<User[]>([]);
  const [ticketAttachments, setTicketAttachments] = useState<TicketAttachment[]>([]);

  // Resolution Modal State
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolutionData, setResolutionData] = useState({
    status: 'resolvido' as TicketStatus,
    resolucao_motivo: '',
    resolucao_observacao: ''
  });

  const fetchData = async () => {
    setLoading(true);
    setLoadingTimeline(true);
    setError(null);
    try {
      const [ticketData, messagesData, attachmentsData, timelineData] = await Promise.all([
        api.get<Ticket>(`/tickets/${ticketId}`),
        api.get<Message[]>(`/tickets/${ticketId}/messages`),
        api.get<TicketAttachment[]>(`/tickets/${ticketId}/attachments`),
        api.get<TicketTimelineItem[]>(`/tickets/${ticketId}/timeline`).catch(err => {
          console.error('Erro ao carregar linha do tempo:', err);
          return [] as TicketTimelineItem[];
        })
      ]);
      
      setTicket(ticketData);
      setMessages(messagesData);
      setTicketAttachments(attachmentsData);
      setTimeline(timelineData);

      // Marcar como lido
      api.post(`/tickets/${ticketId}/read`, {}).catch(err => {
        console.error('Erro ao marcar ticket como lido:', err);
      });

      if (!!(currentUser.administrador || currentUser.desenvolvedor)) {
        const usersData = await api.get<User[]>('/users');
        const filteredAgents = usersData.filter(u => {
          const isActive = u.ativo !== false;
          if (!isActive) return false;
          
          if (!!currentUser.desenvolvedor) return true;
          return u.empresa_id === currentUser.empresa_id;
        });
        setAgents(filteredAgents);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar detalhes do atendimento.';
      setError(message);
    } finally {
      setLoading(false);
      setLoadingTimeline(false);
    }
  };

  const refreshConversation = async () => {
    try {
      const [messagesData, attachmentsData, timelineData] = await Promise.all([
        api.get<Message[]>(`/tickets/${ticketId}/messages`),
        api.get<TicketAttachment[]>(`/tickets/${ticketId}/attachments`),
        api.get<TicketTimelineItem[]>(`/tickets/${ticketId}/timeline`).catch(() => [] as TicketTimelineItem[])
      ]);
      setMessages(messagesData);
      setTicketAttachments(attachmentsData);
      setTimeline(timelineData);
    } catch (err) {
      console.error('Erro ao atualizar conversa em tempo real:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [ticketId]);

  useEffect(() => {
    if (!ticket?.empresa_id) return;

    const socket = getSocket(ticket.empresa_id);

    const handleMessagesChanged = (payload: { ticketId: number, empresaId: number }) => {
      if (Number(payload.ticketId) !== Number(ticketId)) return;
      refreshConversation();
    };

    socket.on('ticketMessagesChanged', handleMessagesChanged);

    return () => {
      socket.off('ticketMessagesChanged', handleMessagesChanged);
    };
  }, [ticket?.empresa_id, ticketId]);

  const handleSendMessage = async (mensagem: string, isInternal: boolean, files: File[]): Promise<boolean> => {
    setLoadingSend(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      // 1. Create Message
      const messageResponse = await api.post<{ id: number }>(`/tickets/${ticketId}/messages`, {
        mensagem: mensagem.trim() || 'Anexo enviado.',
        interno: isInternal
      });

      const messageId = messageResponse.id;

      // 2. Upload Attachments if any
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        formData.append('mensagem_id', messageId.toString());
        formData.append('interno', isInternal.toString());

        await api.post(`/tickets/${ticketId}/attachments`, formData);
      }

      setActionSuccess('Mensagem enviada com sucesso!');
      
      // Reload conversation only instead of everything
      refreshConversation();
      
      setTimeout(() => setActionSuccess(null), 3000);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao enviar mensagem.';
      setActionError(message);
      return false;
    } finally {
      setLoadingSend(false);
    }
  };

  const handleUpdateTicket = async (data: Partial<Ticket>) => {
    setActionError(null);
    setActionSuccess(null);
    try {
        if (data.status === 'resolvido' || data.status === 'fechado') {
            setResolutionData(prev => ({ ...prev, status: data.status as TicketStatus }));
            setIsResolveModalOpen(true);
            return;
        }

        if (data.status === 'aberto' && (ticket?.status === 'resolvido' || ticket?.status === 'fechado')) {
             await api.patch(`/tickets/${ticketId}/reopen`, {});
             setActionSuccess('Atendimento reaberto com sucesso!');
             fetchData();
             setTimeout(() => setActionSuccess(null), 3000);
             return;
        }

        if (data.status) {
            await api.patch(`/tickets/${ticketId}/status`, { status: data.status });
        } else {
            await api.patch(`/tickets/${ticketId}`, data);
        }
      setActionSuccess('Atendimento atualizado com sucesso!');
      fetchData();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar atendimento.';
      setActionError(message);
    }
  };

  const handleConfirmResolution = async () => {
    if (!resolutionData.resolucao_motivo) {
        alert('Por favor, informe o motivo da resolução.');
        return;
    }

    setLoading(true);
    try {
        await api.patch(`/tickets/${ticketId}/resolve`, resolutionData);
        setIsResolveModalOpen(false);
        setActionSuccess(`Atendimento ${resolutionData.status} com sucesso!`);
        fetchData();
        setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao finalizar atendimento.';
        alert(message);
    } finally {
        setLoading(false);
    }
  };

  const handleArchiveTicket = async () => {
    await handleUpdateTicket({ status: 'fechado' });
  };

  const handleUpdateTags = async (tags: string[]) => {
    try {
      await api.put(`/tickets/${ticketId}/tags`, { tags });
      setTicket(prev => prev ? { ...prev, tags } : null);
    } catch (err) {
      console.error('Erro ao atualizar tags:', err);
      alert('Erro ao atualizar tags.');
    }
  };

  const handleUpdateCustomFields = async (fields: any[]) => {
    try {
      await api.put(`/tickets/${ticketId}/custom-fields`, { fields });
      setTicket(prev => prev ? { ...prev, custom_fields: fields } : null);
    } catch (err) {
      console.error('Erro ao atualizar campos personalizados:', err);
      alert('Erro ao atualizar campos personalizados.');
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este anexo permanentemente?')) return;
    
    try {
      await api.delete(`/attachments/${attachmentId}`);
      setActionSuccess('Anexo removido do sistema.');
      refreshConversation();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir anexo.';
      setActionError(message);
    }
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Carregando...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <Card className="p-10 border-red-100 bg-red-50/30 flex flex-col items-center justify-center text-center rounded-xl">
         <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
         <h2 className="text-lg font-bold text-slate-900 mb-1">Atendimento não encontrado</h2>
         <p className="text-slate-500 font-medium text-sm mb-6 max-w-sm">{error || 'O atendimento solicitado pode ter sido removido ou você não tem acesso.'}</p>
         <Button onClick={onBack} size="sm">Voltar para a Lista</Button>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6 min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <Button variant="outline" size="sm" onClick={onBack} className="h-9 w-9 p-0 rounded-xl bg-white border-slate-200 text-slate-500 shadow-sm shrink-0">
            <ChevronLeft size={20} />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-sm font-semibold text-slate-500">#{ticket.id}</span>
              <Badge variant={ticket.prioridade === 'urgente' ? 'red' : 'slate'} className="text-xs px-2 py-0">
                {ticket.prioridade}
              </Badge>
              <div className="w-1 h-1 rounded-full bg-slate-300" />
              <div className="flex items-center gap-1.5">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  ticket.status === 'aberto' ? "bg-blue-500" :
                  ticket.status === 'em_andamento' ? "bg-indigo-500" :
                  ticket.status === 'aguardando_cliente' ? "bg-amber-500" :
                  ticket.status === 'resolvido' ? "bg-emerald-500" : "bg-slate-500"
                )} />
                <span className="text-sm font-medium text-slate-600 capitalize">{ticket.status?.replace('_', ' ')}</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-300" />
               <span className={cn(
                  "text-sm font-medium",
                  getSlaInfo(ticket.prazo_sla, ticket.status).color.replace('bg-', 'text-').replace('text-white', 'text-slate-900')
                )}>
                  SLA: {getSlaInfo(ticket.prazo_sla, ticket.status).compactText || getSlaInfo(ticket.prazo_sla, ticket.status).label}
                </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">{ticket.titulo}</h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {ticket.status === 'resolvido' || ticket.status === 'fechado' ? (
              <Button 
                onClick={() => handleUpdateTicket({ status: 'aberto' })}
                variant="outline"
                className="font-semibold"
              >
                Reabrir Atendimento
              </Button>
            ) : (
              <Button 
                onClick={() => handleUpdateTicket({ status: 'resolvido' })}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
              >
                Finalizar Atendimento
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 overflow-hidden">
        {/* Coluna Principal */}
        <div className="lg:col-span-8 flex flex-col gap-6 min-h-0 overflow-hidden">
          {/* Conversa */}
          <Card className="flex flex-col flex-1 min-h-0 border-slate-200/60 shadow-sm overflow-hidden rounded-2xl bg-white">
            <div className="bg-slate-50/20 px-8 border-b border-slate-100 flex items-center justify-between shrink-0">
               <div className="flex -mb-px gap-8">
                  <button 
                    onClick={() => setActiveTab('messages')}
                    className={cn(
                      "flex items-center gap-2.5 py-5 text-[11px] font-bold uppercase tracking-widest transition-all border-b-2",
                      activeTab === 'messages' ? "text-blue-600 border-blue-600" : "text-slate-400 border-transparent hover:text-slate-600"
                    )}
                  >
                    Conversa
                  </button>
                  <button 
                    onClick={() => setActiveTab('timeline')}
                    className={cn(
                      "flex items-center gap-2.5 py-5 text-[11px] font-bold uppercase tracking-widest transition-all border-b-2",
                      activeTab === 'timeline' ? "text-blue-600 border-blue-600" : "text-slate-400 border-transparent hover:text-slate-600"
                    )}
                  >
                    Histórico
                  </button>
               </div>
               <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">
                 {activeTab === 'messages' ? `${messages.length} mensagens` : `${timeline.length} eventos`}
               </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden bg-white">
              {activeTab === 'messages' ? (
                <TicketConversation 
                   ticket={ticket}
                   messages={messages}
                   currentUser={currentUser}
                   onSendMessage={handleSendMessage}
                   onDeleteAttachment={handleDeleteAttachment}
                   loadingSend={loadingSend}
                   actionError={actionError}
                   actionSuccess={actionSuccess}
                   canAddInternalNote={!!(currentUser.administrador || currentUser.desenvolvedor)}
                />
              ) : (
                <div className="h-full overflow-y-auto p-8 custom-scrollbar">
                  <TicketTimeline 
                    timeline={timeline}
                    loading={loadingTimeline}
                  />
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Coluna Lateral */}
        <div className="lg:col-span-4 h-full min-h-0 overflow-hidden">
            <div className="h-full overflow-y-auto pr-1 flex flex-col gap-6 custom-scrollbar">
              <TicketProperties 
                  ticket={ticket}
                  currentUser={currentUser}
                  agents={agents}
                  attachments={ticketAttachments}
                  onUpdate={handleUpdateTicket}
                  onArchive={handleArchiveTicket}
                  onUpdateTags={handleUpdateTags}
                  onUpdateCustomFields={handleUpdateCustomFields}
              />
            </div>
        </div>
      </div>

      {/* Resolution Modal */}
      {isResolveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200">
             <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                   <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 size={18} />
                   </div>
                   Finalizar Atendimento
                </h3>
                <Badge variant={resolutionData.status === 'resolvido' ? 'emerald' : 'slate'} className="uppercase text-[10px] font-bold">
                   {resolutionData.status}
                </Badge>
             </div>

             <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                   <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Motivo da Resolução</label>
                   <Select 
                     value={resolutionData.resolucao_motivo}
                     onChange={(value) => setResolutionData(prev => ({ ...prev, resolucao_motivo: value }))}
                     placeholder="Selecione um motivo..."
                     options={[
                       { value: "duvida_sanada", label: "Dúvida sanada" },
                       { value: "problema_corrigido", label: "Problema corrigido" },
                       { value: "solicitacao_atendida", label: "Solicitação atendida" },
                       { value: "cancelamento_realizado", label: "Cancelamento realizado" },
                       { value: "duplicado", label: "Atendimento duplicado" },
                       { value: "sem_retorno_cliente", label: "Sem retorno do cliente" },
                       { value: "outros", label: "Outros" }
                     ]}
                   />
                </div>

                <div className="space-y-1.5">
                   <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Observações (Opcional)</label>
                   <textarea 
                     value={resolutionData.resolucao_observacao}
                     onChange={(e) => setResolutionData(prev => ({ ...prev, resolucao_observacao: e.target.value }))}
                     placeholder="Detalhes sobre a solução aplicada..."
                     className="w-full h-32 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-emerald-100 transition-all resize-none"
                   />
                </div>
             </div>

             <div className="p-6 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
                <Button variant="ghost" onClick={() => setIsResolveModalOpen(false)} className="text-slate-500 font-semibold">
                   Cancelar
                </Button>
                <Button 
                  onClick={handleConfirmResolution} 
                  disabled={!resolutionData.resolucao_motivo}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-10 px-6 rounded-xl shadow-lg ring-2 ring-emerald-50"
                >
                   Finalizar Chamado
                </Button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
