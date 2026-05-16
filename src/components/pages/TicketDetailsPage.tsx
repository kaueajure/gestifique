import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Ticket, Message, User, TicketAttachment, TicketTimelineItem, TicketStatus } from '../../types';
import { AlertCircle, Loader2, MessageSquare, History, CheckCircle2, Clock, ChevronLeft, User as UserIcon, Mail, Globe } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { TicketHeader } from '../tickets/details/TicketHeader';
import { TicketProperties } from '../tickets/details/TicketProperties';
import { TicketConversation } from '../tickets/details/TicketConversation';
import { TicketTimeline } from '../tickets/details/TicketTimeline';
import { Select } from '../ui/Select';
import { cn, getSlaInfo } from '../../lib/utils';
import { getSocket } from '../../lib/socket';
import { motion, AnimatePresence } from 'motion/react';

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
        <p className="text-slate-500 font-medium text-xs">Carregando...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <Card className="p-8 border-red-100 bg-red-50/50 flex flex-col items-center justify-center text-center rounded-xl">
         <AlertCircle className="w-10 h-10 text-red-500 mb-2" />
         <h2 className="text-base font-semibold text-slate-900 mb-1">Atendimento não encontrado</h2>
         <p className="text-slate-600 font-medium text-sm mb-5 max-w-sm">{error || 'O atendimento solicitado pode ter sido removido ou você não tem acesso.'}</p>
         <Button onClick={onBack} size="sm" variant="outline" className="font-medium h-9">Voltar para a Lista</Button>
      </Card>
    );
  }

  const canManage = !!(currentUser.administrador || currentUser.desenvolvedor || currentUser.perfil === 'gestor' || currentUser.perfil === 'atendente');
  const canAddInternalNote = !!(currentUser.administrador || currentUser.desenvolvedor || currentUser.perfil === 'gestor' || currentUser.perfil === 'atendente');

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden bg-slate-50">
      {/* Header Centralizado */}
      <div className="shrink-0 z-20 bg-white border-b border-slate-200">
         <TicketHeader 
           ticket={ticket}
           currentUser={currentUser}
           onUpdate={handleUpdateTicket}
           onResolve={() => {
              setResolutionData(prev => ({ ...prev, status: 'resolvido' }));
              setIsResolveModalOpen(true);
           }}
           onBack={onBack}
           canManage={canManage}
         />
      </div>

      {/* Main Workspace Grid */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Left: Conversation Feed */}
        <div className="flex-1 flex flex-col min-w-0 bg-white shadow-[1px_0_0_rgba(0,0,0,0.05)] z-10">
          <TicketConversation 
            ticket={ticket}
            messages={messages}
            currentUser={currentUser}
            onSendMessage={handleSendMessage}
            onDeleteAttachment={handleDeleteAttachment}
            loadingSend={loadingSend}
            actionError={actionError}
            actionSuccess={actionSuccess}
            canAddInternalNote={canAddInternalNote}
          />
        </div>

        {/* Right Sidebar: Tabs for Props & Timeline */}
        <div className="w-full md:w-[280px] lg:w-[300px] shrink-0 overflow-y-auto flex flex-col bg-slate-50/30 border-l border-slate-200 custom-scrollbar">
          <div className="flex bg-white border-b border-slate-100 shrink-0">
             <button 
               onClick={() => setActiveTab('messages')}
               className={cn(
                 "flex-1 py-2.5 text-[10px] font-semibold uppercase tracking-wider transition-all border-b-2",
                 activeTab === 'messages' ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
               )}
             >
               Propriedades
             </button>
             <button 
               onClick={() => setActiveTab('timeline')}
               className={cn(
                 "flex-1 py-2.5 text-[10px] font-semibold uppercase tracking-wider transition-all border-b-2",
                 activeTab === 'timeline' ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
               )}
             >
               Histórico
             </button>
          </div>

          <div className="p-3 pb-8">
             <AnimatePresence mode="wait">
               {activeTab === 'messages' ? (
                 <motion.div
                   key="props"
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -10 }}
                   transition={{ duration: 0.2 }}
                 >
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
                 </motion.div>
               ) : (
                 <motion.div
                   key="timeline"
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -10 }}
                   transition={{ duration: 0.2 }}
                 >
                   <TicketTimeline 
                     timeline={timeline}
                     loading={loadingTimeline}
                   />
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Resolution Modal */}
      {isResolveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200"
          >
             <div className="p-6 border-b border-slate-100 flex flex-col gap-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                     <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                       Concluir Atendimento
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                       Informe como este chamado foi resolvido
                    </p>
                  </div>
                </div>
             </div>

             <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                   <label className="text-[11px] font-semibold text-slate-600">Motivo da Resolução</label>
                   <Select 
                     value={resolutionData.resolucao_motivo}
                     onChange={(value) => setResolutionData(prev => ({ ...prev, resolucao_motivo: value }))}
                     placeholder="Selecione o motivo..."
                     buttonClassName="h-9 bg-slate-50 border-slate-200 rounded-lg text-xs"
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
                   <label className="text-[11px] font-semibold text-slate-600">Observação Final</label>
                   <textarea 
                     value={resolutionData.resolucao_observacao}
                     onChange={(e) => setResolutionData(prev => ({ ...prev, resolucao_observacao: e.target.value }))}
                     placeholder="Detalhes sobre a solução..."
                     className="w-full h-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:ring-1 focus:ring-blue-400 transition-all resize-none"
                   />
                </div>
             </div>

             <div className="p-4 bg-slate-50/50 flex flex-col md:flex-row justify-end gap-2 rounded-b-xl border-t border-slate-100">
                <Button 
                   variant="ghost" 
                   size="sm"
                   className="text-slate-500 hover:text-slate-700" 
                   onClick={() => setIsResolveModalOpen(false)}
                >
                   Desistir
                </Button>
                <Button 
                   size="sm"
                   onClick={handleConfirmResolution} 
                   disabled={!resolutionData.resolucao_motivo}
                   className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                >
                   Finalizar Agora
                </Button>
             </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
