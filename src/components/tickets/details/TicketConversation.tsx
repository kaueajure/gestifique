import React, { useRef, useEffect } from 'react';
import { Message, Ticket } from '../../../types';
import { Clock, MessageSquare, ShieldCheck, User as UserIcon, Lock } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Badge } from '../../ui/Badge';
import { AttachmentList } from '../../ui/AttachmentList';
import { TicketReplyBox } from './TicketReplyBox';

interface TicketConversationProps {
  ticket: Ticket;
  messages: Message[];
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
  isAbertura?: boolean,
  onDeleteAttachment?: (id: number) => Promise<void> 
}) => {
  const isInternal = Number(msg.interno) === 1;
  const date = new Date(msg.created_at || msg.data_mensagem);
  
  return (
    <div className={cn(
      "flex flex-col gap-2 transition-all max-w-full",
      isCliente || isAbertura ? "items-start" : "items-end"
    )}>
      {/* Meta Info Above Bubble */}
      <div className={cn(
        "flex items-center gap-2 px-1",
        isCliente || isAbertura ? "flex-row" : "flex-row-reverse text-right"
      )}>
        <span className="text-[11px] font-bold text-slate-900 uppercase tracking-tight">
          {msg.usuario_nome || (isAbertura ? 'Solicitante' : 'Sistema')}
        </span>
        <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 uppercase tracking-tighter">
          <Clock size={10} /> {date.toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
        </span>
        {isAbertura && (
          <Badge variant="blue" className="text-[9px] font-black px-1.5 py-0 uppercase border-none rounded bg-blue-50 text-blue-600 h-4 tracking-widest">Início</Badge>
        )}
        {isInternal && (
          <Badge variant="amber" className="text-[9px] font-black px-1.5 py-0 uppercase border-none rounded bg-amber-100 text-amber-700 h-4 tracking-widest flex items-center gap-1">
            <Lock size={8} /> Nota Interna
          </Badge>
        )}
      </div>

      {/* Bubble Container */}
      <div className={cn(
        "relative group flex gap-3 max-w-[92%] md:max-w-[80%] lg:max-w-[75%]",
        isCliente || isAbertura ? "flex-row" : "flex-row-reverse"
      )}>
        {/* Avatar */}
        <div className={cn(
          "shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm border",
          isAbertura || isCliente 
            ? "bg-white border-slate-200 text-slate-600" 
            : isInternal 
              ? "bg-amber-100 border-amber-200 text-amber-700" 
              : "bg-blue-50 border-blue-100 text-blue-600"
        )}>
          {(msg.usuario_nome || 'S').charAt(0).toUpperCase()}
        </div>

        {/* Content Card */}
        <div className={cn(
          "p-4 rounded-2xl shadow-sm border text-sm leading-relaxed min-w-[200px]",
          isAbertura || (isCliente && !isInternal)
            ? "bg-white border-slate-200 text-slate-800 rounded-tl-none"
            : isInternal
              ? "bg-amber-50/50 border-amber-100 text-slate-800 italic rounded-tr-none"
              : "bg-blue-50/50 border-blue-100 text-slate-800 rounded-tr-none"
        )}>
          {isInternal && (
            <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-amber-100/50 text-[10px] font-bold text-amber-600 uppercase tracking-widest">
              <Lock size={10} /> Visível apenas para a equipe
            </div>
          )}

          <div className="whitespace-pre-wrap font-medium">
            {msg.mensagem || msg.descricao}
          </div>

          {msg.attachments && msg.attachments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
               <AttachmentList 
                 attachments={msg.attachments} 
                 onRemove={onDeleteAttachment}
               />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const TicketConversation = ({ 
  ticket, messages, onSendMessage, onDeleteAttachment, 
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
    <div className="flex flex-col h-full overflow-hidden bg-slate-50/10">
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar">
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
                <div className="w-20 h-20 bg-white text-slate-200 rounded-3xl flex items-center justify-center mb-6 border border-slate-100 shadow-sm">
                  <MessageSquare size={40} />
                </div>
                <h4 className="text-base font-bold text-slate-800 uppercase tracking-widest mb-2">Sem mensagens no histórico</h4>
                <p className="text-sm font-medium text-slate-400 max-w-xs">Envie uma resposta para iniciar a comunicação com o solicitante.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id}>
                <MessageBubble 
                  msg={msg}
                  isCliente={msg.usuario_id === ticket.usuario_id}
                  onDeleteAttachment={onDeleteAttachment}
                />
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Campo de Resposta */}
        <div className="shrink-0 p-4 md:p-6 bg-white border-t border-slate-100 shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
           {ticket.status === 'fechado' ? (
              <div className="flex flex-col items-center justify-center py-4 bg-slate-50 border border-slate-200 border-dashed rounded-2xl">
                 <Lock className="w-5 h-5 text-slate-400 mb-2" />
                 <p className="text-xs font-bold text-slate-900 uppercase tracking-widest leading-none mb-1">Chamado Encerrado</p>
                 <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight italic">
                   Novas respostas estão bloqueadas para este atendimento.
                 </p>
              </div>
           ) : (
              <TicketReplyBox 
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
