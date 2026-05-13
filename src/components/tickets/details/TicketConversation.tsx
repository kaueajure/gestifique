import React, { useRef, useEffect } from 'react';
import { Message, Ticket } from '../../../types';
import { Clock, MessageSquare, ShieldCheck, User as UserIcon } from 'lucide-react';
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

export const TicketConversation = ({ 
  ticket, messages, onSendMessage, onDeleteAttachment, 
  loadingSend, actionError, actionSuccess, canAddInternalNote 
}: TicketConversationProps) => {

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 custom-scrollbar bg-slate-50/20">
          {/* Mensagem de Abertura do Chamado */}
          {ticket.descricao && (
            <div className="flex flex-col gap-1 items-start transition-all">
              <div className="flex items-center gap-1.5 px-1">
                <Badge variant="blue" className="text-[6.5px] font-black px-1 py-0 uppercase border-none rounded-sm h-3 bg-blue-50 text-blue-600">Abertura</Badge>
                <span className="text-[8px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-tighter">
                  <Clock size={7} /> {new Date(ticket.created_at).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                </span>
              </div>

              <div className="max-w-[95%] p-2.5 rounded-lg border shadow-sm bg-white border-slate-200 rounded-tl-none">
                <div className="flex items-center gap-1 mb-1">
                  <div className="w-3.5 h-3.5 rounded-sm flex items-center justify-center text-[6px] font-black uppercase bg-slate-100 text-slate-600">
                    {(ticket.cliente_nome || 'S').charAt(0)}
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-tight text-slate-900">
                    {ticket.cliente_nome || 'Solicitante'}
                  </span>
                </div>

                <div className="text-[11px] font-medium leading-normal whitespace-pre-wrap text-slate-600">
                  {ticket.descricao}
                </div>
              </div>
            </div>
          )}

          {messages.length === 0 && !ticket.descricao ? (
            <div className="py-16 text-center flex flex-col items-center">
                <div className="w-8 h-8 bg-slate-50 text-slate-200 rounded-lg flex items-center justify-center mb-2 border border-slate-100 shadow-inner">
                  <MessageSquare size={16} />
                </div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Inicie a conversa</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isCliente = msg.usuario_id === ticket.usuario_id;
              
              return (
              <div 
                key={msg.id} 
                className={cn(
                  "flex flex-col gap-1 transition-all",
                  isCliente ? "items-start" : "items-end"
                )}
              >
                <div className="flex items-center gap-1.5 px-1">
                   {!isCliente && msg.interno && (
                     <Badge variant="amber" className="text-[6.5px] font-black px-1 py-0 uppercase border-none rounded-sm h-3">Interno</Badge>
                   )}
                   <span className="text-[8px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-tighter">
                     <Clock size={7} /> {new Date(msg.created_at).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                   </span>
                </div>

                <div 
                  className={cn(
                    "max-w-[95%] p-2.5 rounded-lg border shadow-sm relative group",
                    msg.interno 
                      ? "bg-amber-50/80 border-amber-200/40" 
                      : isCliente 
                        ? "bg-white border-slate-200 rounded-tl-none" 
                        : "bg-blue-600 border-blue-700 text-white rounded-tr-none shadow-blue-200/50"
                  )}
                >
                  <div className="flex items-center gap-1 mb-1">
                     <div className={cn(
                       "w-3.5 h-3.5 rounded-sm flex items-center justify-center text-[6px] font-black uppercase",
                       isCliente ? "bg-slate-100 text-slate-600" : (msg.interno ? "bg-amber-100 text-amber-700" : "bg-blue-500 text-white")
                     )}>
                       {(msg.usuario_nome || 'S').charAt(0)}
                     </div>
                     <span className={cn(
                       "text-[8px] font-black uppercase tracking-tight",
                       msg.interno ? "text-amber-900" : isCliente ? "text-slate-900" : "text-blue-100"
                     )}>
                       {msg.usuario_nome || 'Sistema'}
                     </span>
                     {!isCliente && !msg.interno && (
                        <ShieldCheck size={9} className="text-blue-200" />
                     )}
                  </div>

                  <div className={cn(
                    "text-[11px] font-medium leading-normal whitespace-pre-wrap",
                    msg.interno ? "text-amber-800" : isCliente ? "text-slate-600" : "text-white"
                  )}>
                    {msg.mensagem}
                  </div>

                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className={cn(
                      "mt-1.5 pt-1.5 border-t",
                      isCliente || msg.interno ? "border-slate-100" : "border-white/10"
                    )}>
                        <AttachmentList 
                          attachments={msg.attachments} 
                          compact 
                          onRemove={onDeleteAttachment}
                        />
                    </div>
                  )}
                </div>
              </div>
            )})
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Campo de Resposta */}
        <div className="shrink-0 p-2.5 bg-white border-t border-slate-100">
           {ticket.status === 'fechado' ? (
              <div className="text-center p-3 bg-slate-50 border border-slate-200 rounded-lg">
                 <p className="text-xs font-bold text-slate-600 mb-1">Este atendimento está fechado.</p>
                 <p className="text-[10px] font-medium text-slate-500">
                   Você não pode enviar novas mensagens. 
                   {canAddInternalNote && " Reabra para responder."}
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
