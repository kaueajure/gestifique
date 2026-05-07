import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Ticket, Message, User, TicketAttachment } from '../../types';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { TicketHeader } from '../tickets/details/TicketHeader';
import { TicketProperties } from '../tickets/details/TicketProperties';
import { TicketConversation } from '../tickets/details/TicketConversation';

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
  
  const [loadingSend, setLoadingSend] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [agents, setAgents] = useState<User[]>([]);
  const [ticketAttachments, setTicketAttachments] = useState<TicketAttachment[]>([]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ticketData, messagesData, attachmentsData] = await Promise.all([
        api.get<Ticket>(`/tickets/${ticketId}`),
        api.get<Message[]>(`/tickets/${ticketId}/messages`),
        api.get<TicketAttachment[]>(`/tickets/${ticketId}/attachments`)
      ]);
      setTicket(ticketData);
      setMessages(messagesData);
      setTicketAttachments(attachmentsData);

      if (currentUser.administrador || currentUser.desenvolvedor) {
        const usersData = await api.get<User[]>('/users');
        const filteredAgents = usersData.filter(u => {
          const isActive = u.ativo !== false;
          if (!isActive) return false;
          
          if (currentUser.desenvolvedor) return true;
          return u.empresa_id === currentUser.empresa_id;
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

  const handleSendMessage = async (mensagem: string, isInternal: boolean, files: File[]) => {
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

  const clienteNome = ticket.cliente_nome || 'Não informado';

  return (
    <div className="flex flex-col gap-6">
      <TicketHeader 
        id={ticket.id}
        titulo={ticket.titulo}
        status={ticket.status || 'aberto'}
        prioridade={ticket.prioridade || 'media'}
        onBack={onBack}
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
          <Card className="flex flex-col">
            <CardHeader className="py-2.5 px-5 border-b border-slate-50">
               <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Histórico</CardTitle>
            </CardHeader>
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
            />
        </div>
      </div>
    </div>
  );
};
