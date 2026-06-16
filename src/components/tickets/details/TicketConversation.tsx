import React, { useRef, useEffect } from 'react';
import { Message, Ticket, User } from '../../../types';
import { 
  MessageSquare, 
  Lock, 
  Calendar,
  Megaphone,
  ClipboardList,
  UserRound,
  Clock3
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { AttachmentList } from '../../ui/AttachmentList';
import { TicketReplyBox } from './TicketReplyBox';

interface TicketConversationProps {
  ticket: Ticket;
  messages: Message[];
  currentUser: User;
  onSendMessage: (mensagem: string, isInternal: boolean, files: File[]) => Promise<boolean>;
  onDeleteAttachment: (id: number) => Promise<void>;
  loadingSend: boolean;
  actionError: string | null;
  actionSuccess: string | null;
  canAddInternalNote: boolean;
}

const MessageBubble = ({ 
  msg, 
  isCliente, 
  isAbertura = false,
  onDeleteAttachment 
}: { 
  msg: any, 
  isCliente: boolean, 
  isCurrentUser?: boolean,
  isAbertura?: boolean,
  onDeleteAttachment?: (id: number) => Promise<void> 
}) => {
  const isInternal = Number(msg.interno) === 1;
  const date = new Date(msg.created_at || msg.data_mensagem);
  const interaction = isAbertura
    ? {
        label: 'Abertura do chamado',
        icon: ClipboardList,
        badge: 'bg-slate-100 text-slate-700 border-slate-200',
        marker: 'bg-slate-700 ring-slate-100',
        card: 'bg-white border-slate-200'
      }
    : isInternal
      ? {
          label: 'Nota interna',
          icon: Lock,
          badge: 'bg-amber-50 text-amber-700 border-amber-200',
          marker: 'bg-amber-500 ring-amber-100',
          card: 'bg-amber-50/60 border-amber-200'
        }
      : isCliente
        ? {
            label: 'Resposta do solicitante',
            icon: UserRound,
            badge: 'bg-blue-50 text-blue-700 border-blue-200',
            marker: 'bg-blue-500 ring-blue-100',
            card: 'bg-white border-slate-200'
          }
        : {
            label: 'Acao publica',
            icon: Megaphone,
            badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            marker: 'bg-emerald-500 ring-emerald-100',
            card: 'bg-white border-slate-200'
          };
  const InteractionIcon = interaction.icon;
  
  return (
    <article className="relative pl-9 sm:pl-11">
      <div className={cn(
        "absolute left-[7px] sm:left-[9px] top-5 w-3 h-3 rounded-full ring-4",
        interaction.marker
      )} />

      <div className={cn(
        "rounded-lg border shadow-sm transition-colors overflow-hidden",
        interaction.card
      )}>
        <div className="px-4 py-3 border-b border-slate-100/80 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center border shrink-0",
              isInternal ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-slate-100 text-slate-600 border-slate-200"
            )}>
              <InteractionIcon size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900 truncate">
                  {msg.usuario_nome || (isAbertura ? 'Solicitante' : 'Atendente')}
                </h3>
                <span className={cn(
                  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  interaction.badge
                )}>
                  <InteractionIcon size={10} />
                  {interaction.label}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Calendar size={11} />
                  {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock3 size={11} />
                  {date.toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-4">
          <div className="whitespace-pre-wrap text-sm leading-6 text-slate-700 break-words">
            {msg.mensagem || msg.descricao}
          </div>

          {msg.attachments && msg.attachments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200/70">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Anexos
              </div>
              <AttachmentList 
                attachments={msg.attachments} 
                onRemove={onDeleteAttachment}
                compact
              />
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export const TicketConversation = ({ 
  ticket, messages, currentUser, onSendMessage, onDeleteAttachment, 
  loadingSend, actionError, actionSuccess, canAddInternalNote 
}: TicketConversationProps) => {

  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const normalizeMessage = (value?: string | null) =>
    String(value || '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();

  const normalizedDesc = normalizeMessage(ticket.descricao);
  
  // No point 4, pede para considerar as primeiras mensagens. 
  // No point 2, deu a fórmula com messages.some.
  // Vamos buscar a duplicata apenas entre as primeiras mensagens públicas para não esconder a abertura
  // se houver uma mensagem idêntica muito depois na conversa.
  const hasInitialMessageInMessages = messages
    .filter(msg => !Number(msg.interno))
    .slice(0, 3) // Entre as primeiras mensagens do ticket
    .some(msg => normalizeMessage(msg.mensagem) === normalizedDesc);

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50">
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          <div className="mx-auto w-full max-w-5xl px-3 sm:px-5 lg:px-7 py-5 sm:py-6">
          {/* Timeline Start Indication */}
          <div className="mb-5 flex items-center gap-3 pl-9 sm:pl-11">
             <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                <Calendar size={12} />
                Historico iniciado em {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
             </div>
          </div>

          <div className="relative space-y-4 before:absolute before:left-3 sm:before:left-[15px] before:top-0 before:bottom-0 before:w-px before:bg-slate-200">
            {/* Abertura do Chamado - Apenas se não estiver nas mensagens iniciais */}
            {ticket.descricao && !hasInitialMessageInMessages && (
              <MessageBubble 
                msg={{
                  ...ticket,
                  usuario_nome: ticket.cliente_nome,
                  created_at: ticket.created_at
                }}
                isCliente={true}
                isAbertura={true}
              />
            )}

            {messages.length === 0 && !ticket.descricao ? (
              <div className="py-12 text-center flex flex-col items-center">
                  <div className="w-12 h-12 bg-white text-slate-300 rounded-xl flex items-center justify-center mb-4 border border-slate-100 shadow-sm">
                    <MessageSquare size={24} />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 tracking-tight mb-1">Aguardando interações</h4>
                  <p className="text-xs font-medium text-slate-500 max-w-xs leading-relaxed">
                    Não há mensagens registradas para este atendimento ainda.
                  </p>
              </div>
            ) : (
              messages.map((msg) => (
                <MessageBubble 
                  key={msg.id}
                  msg={msg}
                  isCliente={msg.usuario_id === ticket.usuario_id || (!msg.usuario_id && !msg.interno)}
                  isCurrentUser={msg.usuario_id && msg.usuario_id === currentUser.id}
                  onDeleteAttachment={onDeleteAttachment}
                />
              ))
            )}
            <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
        
        {/* Campo de Resposta Wrapping Area */}
        <div className="shrink-0 bg-white border-t border-slate-200 z-10">
          <div className="mx-auto w-full max-w-5xl p-3 sm:px-5 lg:px-7">
           {ticket.status === 'fechado' ? (
              <div className="flex flex-col items-center justify-center py-4 bg-slate-50 border border-slate-200 border-dashed rounded-xl">
                 <div className="w-8 h-8 rounded-lg bg-slate-200/50 flex items-center justify-center text-slate-400 mb-2">
                    <Lock size={14} />
                 </div>
                 <p className="text-xs font-semibold text-slate-900 tracking-tight mb-0.5">Atendimento fechado</p>
                 <p className="text-[10px] font-medium text-slate-500">
                   Reabra o atendimento para enviar novas mensagens.
                 </p>
              </div>
           ) : (
              <TicketReplyBox 
                 ticket={ticket}
                 currentUser={currentUser}
                 onSendMessage={onSendMessage}
                 loadingSend={loadingSend}
                 actionError={actionError}
                 actionSuccess={actionSuccess}
                 canAddInternalNote={canAddInternalNote}
              />
           )}
          </div>
        </div>
    </div>
  );
};
