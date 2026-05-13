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
    <div className="flex flex-col h-full">
        <div className="max-h-[600px] overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/20 rounded-t-xl border-b border-slate-100">
          {messages.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center">
                <div className="w-12 h-12 bg-slate-50 text-slate-200 rounded-2xl flex items-center justify-center mb-4 border border-slate-100 shadow-inner">
                  <MessageSquare size={24} />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Inicie a conversa para este chamado</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isCliente = msg.usuario_id === ticket.usuario_id;
              
              return (
              <div 
                key={msg.id} 
                className={cn(
                  "flex flex-col gap-2 transition-all",
                  isCliente ? "items-start" : "items-end"
                )}
              >
                <div className="flex items-center gap-2 px-1">
                   {!isCliente && msg.interno && (
                     <Badge variant="amber" className="text-[8px] font-bold px-1.5 py-0 uppercase border-none rounded-sm">Nota Interna</Badge>
                   )}
                   <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-tight">
                     <Clock size={10} /> {new Date(msg.created_at).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                   </span>
                </div>

                <div 
                  className={cn(
                    "max-w-[85%] p-4 rounded-2xl border shadow-sm relative group",
                    msg.interno 
                      ? "bg-amber-50/80 border-amber-200/60" 
                      : isCliente 
                        ? "bg-white border-slate-200 rounded-tl-none" 
                        : "bg-blue-600 border-blue-700 text-white rounded-tr-none"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                     <div className={cn(
                       "w-5 h-5 rounded flex items-center justify-center text-[8px] font-bold uppercase",
                       isCliente ? "bg-slate-100 text-slate-600" : (msg.interno ? "bg-amber-100 text-amber-700" : "bg-blue-500 text-white")
                     )}>
                       {(msg.usuario_nome || 'S').charAt(0)}
                     </div>
                     <span className={cn(
                       "text-[10px] font-bold uppercase tracking-tight",
                       msg.interno ? "text-amber-900" : isCliente ? "text-slate-900" : "text-blue-100"
                     )}>
                       {msg.usuario_nome || 'Sistema'}
                     </span>
                     {!isCliente && !msg.interno && (
                        <ShieldCheck size={10} className="text-blue-200" />
                     )}
                  </div>

                  <div className={cn(
                    "text-sm font-medium leading-relaxed whitespace-pre-wrap",
                    msg.interno ? "text-amber-800" : isCliente ? "text-slate-600" : "text-white"
                  )}>
                    {msg.mensagem}
                  </div>

                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-black/5">
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
        <div className="p-5 bg-white rounded-b-xl border-t border-slate-100">
           {ticket.status === 'fechado' ? (
              <div className="text-center p-4 bg-slate-50 border border-slate-200 rounded-xl">
                 <p className="text-sm font-semibold text-slate-600 mb-2">Este atendimento está fechado.</p>
                 <p className="text-xs font-medium text-slate-500">
                   Você não pode enviar novas mensagens. 
                   {canAddInternalNote && " Altere o status para reabrir o atendimento se necessário."}
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
