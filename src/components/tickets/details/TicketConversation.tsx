import React, { useRef, useEffect } from 'react';
import { Message, Ticket, User } from '../../../types';
import { 
  Clock, 
  MessageSquare, 
  ShieldCheck, 
  User as UserIcon, 
  Lock, 
  EyeOff,
  UserCheck,
  Calendar
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Badge } from '../../ui/Badge';
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
  isCurrentUser,
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
  
  return (
    <div className={cn(
      "flex flex-col gap-1 transition-all max-w-full group",
      isInternal ? "my-3" : "my-2",
      isCliente || isAbertura ? "items-start" : "items-end"
    )}>
      {/* Internal Note Banner */}
      {isInternal && (
         <div className="w-full flex items-center gap-3 mb-1">
            <div className="h-px flex-1 bg-amber-100" />
            <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
               <Lock size={10} /> Nota Interna
            </div>
            <div className="h-px flex-1 bg-amber-100" />
         </div>
      )}

      <div className={cn(
        "flex gap-2 max-w-[90%] md:max-w-2xl",
        isCliente || isAbertura ? "flex-row" : "flex-row-reverse"
      )}>
        {/* Avatar */}
        <div className={cn(
          "shrink-0 w-7 h-7 rounded flex items-center justify-center text-[10px] font-bold shadow-sm border",
          isAbertura || isCliente 
            ? "bg-slate-50 border-slate-200 text-slate-600" 
            : isInternal 
              ? "bg-amber-50 border-amber-200 text-amber-700" 
              : "bg-blue-600 border-blue-700 text-white"
        )}>
          {(msg.usuario_nome || (isAbertura ? 'S' : 'A')).charAt(0).toUpperCase()}
        </div>

        {/* Content */}
        <div className={cn(
          "flex flex-col gap-1 min-w-0",
          isCliente || isAbertura ? "items-start" : "items-end"
        )}>
           {/* Meta */}
           <div className={cn(
             "flex items-center gap-1.5 text-[9px]",
             isCliente || isAbertura ? "text-slate-500" : "flex-row-reverse text-blue-600"
           )}>
              <span className={cn(
                "font-semibold",
                isInternal ? "text-amber-700" : (isCliente || isAbertura ? "text-slate-700" : "text-blue-600")
              )}>
                {msg.usuario_nome || (isAbertura ? 'Solicitante' : 'Atendente')}
              </span>
              <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
              <span className="flex items-center gap-1 font-medium">
                 {date.toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
              {isAbertura && (
                <span className="text-[8px] font-bold bg-slate-100 text-slate-500 px-1 py-0.5 rounded ml-1 uppercase tracking-wider">Abertura</span>
              )}
           </div>

           {/* Bubble */}
           <div className={cn(
             "px-3 py-2 outline outline-1 outline-transparent rounded-lg text-[13px] leading-relaxed transition-all shadow-sm max-w-full",
             isInternal 
               ? "bg-amber-50 border border-amber-200 text-slate-800 rounded-tl-sm" 
               : isCliente || isAbertura
                 ? "bg-white border border-slate-200 text-slate-700 rounded-tl-sm"
                 : "bg-blue-600 border border-blue-700 text-white rounded-tr-sm shadow-blue-200"
           )}>
             <div className="whitespace-pre-wrap font-medium break-words">
               {msg.mensagem || msg.descricao}
             </div>

             {msg.attachments && msg.attachments.length > 0 && (
               <div className={cn(
                 "mt-3 pt-3 border-t",
                 isCliente || isAbertura || isInternal ? "border-slate-100" : "border-blue-500/30"
               )}>
                  <AttachmentList 
                    attachments={msg.attachments} 
                    onRemove={onDeleteAttachment}
                    compact
                    className={!isCliente && !isAbertura && !isInternal ? "text-white" : ""}
                  />
               </div>
             )}
           </div>

           {/* Full Date on Hover/Focus */}
           <div className="text-[8px] font-semibold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
              {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
           </div>
        </div>
      </div>
    </div>
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

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50/20">
        <div className="flex-1 min-h-0 overflow-y-auto p-3 md:p-4 space-y-1 custom-scrollbar">
          {/* Timeline Start Indication */}
          <div className="flex flex-col items-center justify-center mb-4 mt-2">
             <p className="text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 px-2.5 py-1 rounded-full shadow-sm">
                Iniciado em {new Date(ticket.created_at).toLocaleDateString()}
             </p>
          </div>

          {/* Abertura do Chamado */}
          {ticket.descricao && (
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
                <div className="w-12 h-12 bg-white text-slate-300 rounded-2xl flex items-center justify-center mb-4 border border-slate-100 shadow-sm">
                  <MessageSquare size={24} />
                </div>
                <h4 className="text-sm font-semibold text-slate-900 tracking-tight mb-1">Aguardando interações</h4>
                <p className="text-xs font-medium text-slate-500 max-w-xs leading-relaxed">
                  Não há mensagens registradas para este atendimento ainda.
                </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id}>
                <MessageBubble 
                  msg={msg}
                  isCliente={msg.usuario_id === ticket.usuario_id}
                  isCurrentUser={msg.usuario_id === currentUser.id}
                  onDeleteAttachment={onDeleteAttachment}
                />
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Campo de Resposta Wrapping Area */}
        <div className="shrink-0 p-3 bg-white border-t border-slate-200 z-10">
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
  );
};
