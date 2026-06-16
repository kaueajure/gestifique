import React, { useRef, useEffect } from 'react';
import { Message, Ticket, User } from '../../../types';
import { 
  MessageSquare, 
  Lock, 
  Calendar,
  Megaphone,
  ClipboardList,
  UserRound,
  Clock3,
  Sparkles
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
  isCurrentUser = false,
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
  const authorName = msg.usuario_nome || (isAbertura ? 'Solicitante' : 'Atendente');
  const initials = authorName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0])
    .join('')
    .toUpperCase();
  const interaction = isAbertura
    ? {
        label: 'Abertura do chamado',
        icon: ClipboardList,
        badge: 'bg-slate-100 text-slate-700 border-slate-200',
        avatar: 'bg-slate-900 text-white',
        bubble: 'bg-white border-slate-200 text-slate-800 shadow-sm',
        align: 'items-start'
      }
    : isInternal
      ? {
          label: 'Nota interna',
          icon: Lock,
          badge: 'bg-amber-50 text-amber-700 border-amber-200',
          avatar: 'bg-amber-500 text-white',
          bubble: 'bg-amber-50 border-amber-200 text-amber-950 shadow-sm',
          align: 'items-end'
        }
      : isCliente
        ? {
            label: 'Resposta do solicitante',
            icon: UserRound,
            badge: 'bg-blue-50 text-blue-700 border-blue-200',
            avatar: 'bg-blue-600 text-white',
            bubble: 'bg-white border-slate-200 text-slate-800 shadow-sm',
            align: 'items-start'
          }
        : {
            label: 'Resposta publica',
            icon: Megaphone,
            badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            avatar: 'bg-emerald-600 text-white',
            bubble: 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/10',
            align: 'items-end'
          };
  const InteractionIcon = interaction.icon;
  const alignRight = !isCliente || isInternal || isCurrentUser;
  
  return (
    <article className={cn("flex w-full", alignRight ? "justify-end" : "justify-start")}>
      <div className={cn(
        "flex max-w-[min(760px,92%)] gap-3",
        alignRight ? "flex-row-reverse" : "flex-row"
      )}>
        <div className={cn(
          "mt-1 hidden h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ring-4 ring-white sm:flex",
          interaction.avatar
        )}>
          {isInternal || isAbertura ? <InteractionIcon size={15} /> : initials || <UserRound size={15} />}
        </div>

        <div className={cn("flex min-w-0 flex-col gap-1.5", alignRight ? "items-end" : "items-start")}>
          <div className={cn("flex flex-wrap items-center gap-2 px-1", alignRight ? "justify-end" : "justify-start")}>
            <span className={cn(
              "max-w-[180px] truncate text-xs font-semibold",
              alignRight ? "text-slate-700" : "text-slate-900"
            )}>
              {authorName}
            </span>
            <span className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
              interaction.badge
            )}>
              <InteractionIcon size={10} />
              {interaction.label}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
              <Clock3 size={11} />
              {date.toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className={cn(
            "overflow-hidden rounded-2xl border px-4 py-3",
            alignRight ? "rounded-tr-md" : "rounded-tl-md",
            interaction.bubble
          )}>
            <div className={cn(
              "whitespace-pre-wrap break-words text-sm leading-6",
              (!isCliente && !isInternal) ? "text-white" : "text-inherit"
            )}>
              {msg.mensagem || msg.descricao}
            </div>

          {msg.attachments && msg.attachments.length > 0 && (
            <div className={cn(
              "mt-3 border-t pt-3",
              (!isCliente && !isInternal) ? "border-white/20" : "border-slate-200/80"
            )}>
              <div className={cn(
                "mb-2 text-[10px] font-bold uppercase tracking-wider",
                (!isCliente && !isInternal) ? "text-blue-50" : "text-slate-500"
              )}>
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

          <div className={cn("px-1 text-[11px] font-medium text-slate-400", alignRight ? "text-right" : "text-left")}>
            {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
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
    .slice(0, 3)
    .some(msg => normalizeMessage(msg.mensagem) === normalizedDesc);

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages]);

  const conversationItems = [
    ...(ticket.descricao && !hasInitialMessageInMessages ? [{
      ...ticket,
      id: `ticket-${ticket.id}`,
      usuario_nome: ticket.cliente_nome,
      created_at: ticket.created_at,
      isAbertura: true
    }] : []),
    ...messages.map(msg => ({ ...msg, isAbertura: false }))
  ];

  let lastDateLabel = '';

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.08),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)]">
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-3 py-5 sm:px-5 sm:py-6 lg:px-7">
          <div className="flex justify-center">
             <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 shadow-sm backdrop-blur">
                <Calendar size={12} />
                Historico iniciado em {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
             </div>
          </div>

          <div className="space-y-5">
            {conversationItems.length === 0 ? (
              <div className="flex flex-col items-center py-14 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white bg-white text-slate-300 shadow-sm">
                    <MessageSquare size={24} />
                  </div>
                  <h4 className="mb-1 text-sm font-semibold tracking-tight text-slate-900">Aguardando interacoes</h4>
                  <p className="max-w-xs text-xs font-medium leading-relaxed text-slate-500">
                    Não há mensagens registradas para este atendimento ainda.
                  </p>
              </div>
            ) : (
              conversationItems.map((msg: any) => {
                const dateLabel = new Date(msg.created_at || msg.data_mensagem).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                });
                const showDateSeparator = dateLabel !== lastDateLabel;
                lastDateLabel = dateLabel;

                return (
                  <React.Fragment key={msg.id}>
                    {showDateSeparator && (
                      <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-slate-200/80" />
                        <span className="rounded-full border border-white bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 shadow-sm backdrop-blur">
                          {dateLabel}
                        </span>
                        <div className="h-px flex-1 bg-slate-200/80" />
                      </div>
                    )}
                    <MessageBubble 
                      msg={msg}
                      isCliente={msg.isAbertura || msg.usuario_id === ticket.usuario_id || (!msg.usuario_id && !msg.interno)}
                      isCurrentUser={!!msg.usuario_id && msg.usuario_id === currentUser.id}
                      isAbertura={msg.isAbertura}
                      onDeleteAttachment={onDeleteAttachment}
                    />
                  </React.Fragment>
                );
              })
            )}
            <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
        
        <div className="z-10 shrink-0 border-t border-slate-200/80 bg-white/85 shadow-[0_-18px_40px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="mx-auto w-full max-w-5xl p-3 sm:px-5 lg:px-7">
           {ticket.status === 'fechado' ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-4">
                 <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200/50 text-slate-400">
                    <Lock size={14} />
                 </div>
                 <p className="mb-0.5 text-xs font-semibold tracking-tight text-slate-900">Atendimento fechado</p>
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
           <div className="mt-2 hidden items-center justify-center gap-1.5 text-[10px] font-medium text-slate-400 sm:flex">
             <Sparkles size={11} />
             Mensagens publicas notificam o solicitante. Notas internas ficam visiveis apenas para a equipe.
           </div>
          </div>
        </div>
    </div>
  );
};
