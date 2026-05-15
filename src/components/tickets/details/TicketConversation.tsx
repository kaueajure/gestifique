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
      "flex flex-col gap-2 transition-all max-w-full group",
      isInternal ? "my-6" : "my-4",
      isCliente || isAbertura ? "items-start" : "items-end"
    )}>
      {/* Internal Note Banner */}
      {isInternal && (
         <div className="w-full flex items-center gap-4 mb-2">
            <div className="h-px flex-1 bg-amber-100" />
            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
               <Lock size={10} /> Nota Interna de Atendimento
            </div>
            <div className="h-px flex-1 bg-amber-100" />
         </div>
      )}

      <div className={cn(
        "flex gap-3 max-w-[90%] md:max-w-[75%]",
        isCliente || isAbertura ? "flex-row" : "flex-row-reverse"
      )}>
        {/* Avatar */}
        <div className={cn(
          "shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black shadow-sm border transition-transform group-hover:scale-105",
          isAbertura || isCliente 
            ? "bg-white border-slate-200 text-slate-600" 
            : isInternal 
              ? "bg-amber-100 border-amber-200 text-amber-700" 
              : "bg-blue-600 border-blue-700 text-white"
        )}>
          {(msg.usuario_nome || (isAbertura ? 'S' : 'A')).charAt(0).toUpperCase()}
        </div>

        {/* Content */}
        <div className={cn(
          "flex flex-col gap-1.5",
          isCliente || isAbertura ? "items-start" : "items-end"
        )}>
           {/* Meta */}
           <div className={cn(
             "flex items-center gap-2 text-[10px] uppercase font-black tracking-widest",
             isCliente || isAbertura ? "text-slate-400" : "flex-row-reverse text-blue-600"
           )}>
              <span className={cn(
                isInternal ? "text-amber-700" : (isCliente || isAbertura ? "text-slate-700" : "text-blue-600")
              )}>
                {msg.usuario_nome || (isAbertura ? 'Solicitante' : 'Atendente')}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="font-bold flex items-center gap-1">
                 <Clock size={10} />
                 {date.toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
              {isAbertura && (
                <span className="text-[8px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100 ml-1">ABERTURA</span>
              )}
           </div>

           {/* Bubble */}
           <div className={cn(
             "p-4 rounded-3xl shadow-sm border text-sm leading-relaxed transition-all",
             isInternal 
               ? "bg-amber-50/50 border-amber-200 text-slate-800 rounded-tl-none" 
               : isCliente || isAbertura
                 ? "bg-white border-slate-200 text-slate-700 rounded-tl-none"
                 : "bg-blue-600 border-blue-700 text-white rounded-tr-none shadow-blue-200"
           )}>
             <div className="whitespace-pre-wrap font-medium">
               {msg.mensagem || msg.descricao}
             </div>

             {msg.attachments && msg.attachments.length > 0 && (
               <div className={cn(
                 "mt-4 pt-4 border-t",
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
           <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
              {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
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
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8 space-y-2 custom-scrollbar">
          {/* Timeline Start Indication */}
          <div className="flex flex-col items-center justify-center mb-10 mt-4">
             <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 mb-3">
                <Calendar size={18} />
             </div>
             <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                Atendimento Iniciado em {new Date(ticket.created_at).toLocaleDateString()}
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
            <div className="py-24 text-center flex flex-col items-center">
                <div className="w-24 h-24 bg-white text-slate-200 rounded-[2rem] flex items-center justify-center mb-8 border border-slate-100 shadow-sm">
                  <MessageSquare size={48} />
                </div>
                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-3">Aguardando interações</h4>
                <p className="text-xs font-bold text-slate-400 max-w-xs uppercase tracking-widest leading-relaxed">
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
        <div className="shrink-0 p-4 md:p-8 bg-white border-t border-slate-200/60 shadow-[0_-12px_40px_rgba(0,0,0,0.03)] z-10">
           {ticket.status === 'fechado' ? (
              <div className="flex flex-col items-center justify-center py-6 bg-slate-50 border border-slate-200 border-dashed rounded-[2rem]">
                 <div className="w-12 h-12 rounded-2xl bg-slate-200/50 flex items-center justify-center text-slate-400 mb-3">
                    <Lock size={20} />
                 </div>
                 <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">Este atendimento está fechado</p>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
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
