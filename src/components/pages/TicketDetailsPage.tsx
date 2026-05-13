import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Ticket, Message, User, TicketAttachment, TicketTimelineItem } from '../../types';
import { AlertCircle, Loader2, MessageSquare, History } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { TicketHeader } from '../tickets/details/TicketHeader';
import { TicketProperties } from '../tickets/details/TicketProperties';
import { TicketConversation } from '../tickets/details/TicketConversation';
import { TicketTimeline } from '../tickets/details/TicketTimeline';
import { cn } from '../../lib/utils';

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

  const loadTimeline = async () => {
    setLoadingTimeline(true);
    try {
      const timelineData = await api.get<TicketTimelineItem[]>(`/tickets/${ticketId}/timeline`);
      setTimeline(timelineData);
    } catch (err) {
      console.error('Erro ao carregar linha do tempo:', err);
    } finally {
      setLoadingTimeline(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [ticketId]);

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
      
      // Reload everything
      fetchData();
      
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

  const handleArchiveTicket = async () => {
    await handleUpdateTicket({ status: 'fechado' });
  };

  const handleUpdateTags = async (tags: string[]) => {
    try {
      await api.patch(`/tickets/${ticketId}/tags`, { tags });
      setTicket(prev => prev ? { ...prev, tags } : null);
    } catch (err) {
      console.error('Erro ao atualizar tags:', err);
      alert('Erro ao atualizar tags.');
    }
  };

  const handleUpdateCustomFields = async (fields: any[]) => {
    try {
      await api.patch(`/tickets/${ticketId}/custom-fields`, { fields });
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
      fetchData();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir anexo.';
      setActionError(message);
    }
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

  const isClienteRemovido = ticket.cliente_nome === 'Usuário Removido';
  const clienteNome = isClienteRemovido ? 'Conta Excluída' : (ticket.cliente_nome || 'Não informado');

  return (
    <div className="flex flex-col gap-6">
      <TicketHeader 
        id={ticket.id}
        titulo={ticket.titulo}
        status={ticket.status || 'aberto'}
        prioridade={ticket.prioridade || 'media'}
        onBack={onBack}
        onUpdateStatus={handleUpdateTicket}
        canEdit={!!(currentUser.administrador || currentUser.desenvolvedor)}
      />

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
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0",
                    isClienteRemovido ? "bg-slate-300" : "bg-slate-900"
                  )}>
                     {isClienteRemovido ? '?' : clienteNome.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                     <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                           <span className={cn("text-sm font-bold", isClienteRemovido ? "text-slate-400" : "text-slate-900")}>
                             {clienteNome}
                           </span>
                           {isClienteRemovido && (
                             <Badge variant="slate" className="text-[9px] px-1.5 py-0 border-none bg-slate-100 text-slate-500">
                               Usuário Removido
                             </Badge>
                           )}
                        </div>
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
          <Card className="flex flex-col">
            <CardHeader className="py-0 px-5 border-b border-slate-50 flex flex-row items-center justify-between">
               <div className="flex">
                  <button 
                    onClick={() => setActiveTab('messages')}
                    className={cn(
                      "flex items-center gap-2 py-3 px-4 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2",
                      activeTab === 'messages' ? "text-blue-600 border-blue-600" : "text-slate-400 border-transparent hover:text-slate-600"
                    )}
                  >
                    <MessageSquare size={12} />
                    Mensagens
                  </button>
                  <button 
                    onClick={() => setActiveTab('timeline')}
                    className={cn(
                      "flex items-center gap-2 py-3 px-4 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2",
                      activeTab === 'timeline' ? "text-blue-600 border-blue-600" : "text-slate-400 border-transparent hover:text-slate-600"
                    )}
                  >
                    <History size={12} />
                    Linha do Tempo
                  </button>
               </div>
               <Badge variant="slate" className="text-[9px] px-1.5 py-0 border-none bg-slate-50 text-slate-400">
                 {activeTab === 'messages' ? `${messages.length} mensagens` : `${timeline.length} eventos`}
               </Badge>
            </CardHeader>

            {activeTab === 'messages' ? (
              <TicketConversation 
                 ticket={ticket}
                 messages={messages}
                 onSendMessage={handleSendMessage}
                 onDeleteAttachment={handleDeleteAttachment}
                 loadingSend={loadingSend}
                 actionError={actionError}
                 actionSuccess={actionSuccess}
                 canAddInternalNote={!!(currentUser.administrador || currentUser.desenvolvedor)}
              />
            ) : (
              <TicketTimeline 
                timeline={timeline}
                loading={loadingTimeline}
              />
            )}
          </Card>
        </div>

        {/* Coluna Lateral */}
        <div className="lg:col-span-4 space-y-6">
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
  );
};
