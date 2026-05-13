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
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/20">
          {messages.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center">
                <div className="w-10 h-10 bg-slate-50 text-slate-200 rounded-xl flex items-center justify-center mb-3 border border-slate-100 shadow-inner">
                  <MessageSquare size={20} />
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Inicie a conversa para este chamado</p>
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
                <div className="flex items-center gap-2 px-1">
                   {!isCliente && msg.interno && (
                     <Badge variant="amber" className="text-[7px] font-bold px-1 py-0 uppercase border-none rounded-sm h-3.5">Nota Interna</Badge>
                   )}
                   <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-tighter">
                     <Clock size={8} /> {new Date(msg.created_at).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                   </span>
                </div>

                <div 
                  className={cn(
                    "max-w-[90%] p-3 rounded-xl border shadow-sm relative group",
                    msg.interno 
                      ? "bg-amber-50/80 border-amber-200/60" 
                      : isCliente 
                        ? "bg-white border-slate-200 rounded-tl-none" 
                        : "bg-blue-600 border-blue-700 text-white rounded-tr-none"
                  )}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                     <div className={cn(
                       "w-4 h-4 rounded-sm flex items-center justify-center text-[7px] font-bold uppercase",
                       isCliente ? "bg-slate-100 text-slate-600" : (msg.interno ? "bg-amber-100 text-amber-700" : "bg-blue-500 text-white")
                     )}>
                       {(msg.usuario_nome || 'S').charAt(0)}
                     </div>
                     <span className={cn(
                       "text-[9px] font-bold uppercase tracking-tight",
                       msg.interno ? "text-amber-900" : isCliente ? "text-slate-900" : "text-blue-100"
                     )}>
                       {msg.usuario_nome || 'Sistema'}
                     </span>
                     {!isCliente && !msg.interno && (
                        <ShieldCheck size={10} className="text-blue-200" />
                     )}
                  </div>

                  <div className={cn(
                    "text-xs font-medium leading-relaxed whitespace-pre-wrap",
                    msg.interno ? "text-amber-800" : isCliente ? "text-slate-600" : "text-white"
                  )}>
                    {msg.mensagem}
                  </div>

                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-black/5">
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
        <div className="shrink-0 p-3 bg-white border-t border-slate-100">
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
