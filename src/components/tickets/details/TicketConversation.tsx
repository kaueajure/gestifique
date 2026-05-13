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
        <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar bg-slate-50/20">
          {/* Mensagem de Abertura do Chamado */}
          {ticket.descricao && (
            <div className="flex flex-col gap-1.5 items-start transition-all">
              <div className="flex items-center gap-2 px-1">
                <Badge variant="blue" className="text-[10px] font-bold px-2 py-0.5 uppercase border-none rounded-md h-5 bg-blue-50 text-blue-600">Abertura</Badge>
                <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5 uppercase tracking-tight">
                  <Clock size={12} /> {new Date(ticket.created_at).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                </span>
              </div>

              <div className="max-w-[85%] md:max-w-[78%] p-4 rounded-2xl border shadow-sm bg-white border-slate-200 rounded-tl-none">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold uppercase bg-slate-100 text-slate-600 shadow-sm border border-slate-200/50">
                    {(ticket.cliente_nome || 'S').charAt(0)}
                  </div>
                  <span className="text-sm font-bold text-slate-900">
                    {ticket.cliente_nome || 'Solicitante'}
                  </span>
                </div>

                <div className="text-sm font-medium leading-relaxed whitespace-pre-wrap text-slate-600">
                  {ticket.descricao}
                </div>
              </div>
            </div>
          )}

          {messages.length === 0 && !ticket.descricao ? (
            <div className="py-24 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-white text-slate-200 rounded-2xl flex items-center justify-center mb-4 border border-slate-100 shadow-sm">
                  <MessageSquare size={32} />
                </div>
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-1">Nenhuma mensagem ainda</h4>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-tighter">Envie a primeira resposta para iniciar o atendimento.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isCliente = msg.usuario_id === ticket.usuario_id;
              
              return (
              <div 
                key={msg.id} 
                className={cn(
                  "flex flex-col gap-1.5 transition-all",
                  isCliente ? "items-start" : "items-end"
                )}
              >
                <div className="flex items-center gap-2 px-1">
                   {!isCliente && msg.interno && (
                     <Badge variant="amber" className="text-[10px] font-bold px-2 py-0.5 uppercase border-none rounded-md h-5">Nota Interna</Badge>
                   )}
                   <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5 uppercase tracking-tight">
                     <Clock size={12} /> {new Date(msg.created_at).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                   </span>
                </div>

                <div 
                  className={cn(
                    "max-w-[90%] md:max-w-[78%] p-4 rounded-2xl border shadow-sm relative group",
                    msg.interno 
                      ? "bg-amber-50 border-amber-200/50 text-amber-900" 
                      : isCliente 
                        ? "bg-white border-slate-200 rounded-tl-none" 
                        : "bg-blue-600 border-blue-700 text-white rounded-tr-none shadow-blue-100/50"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                     <div className={cn(
                       "w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold uppercase shadow-sm border",
                       isCliente ? "bg-slate-100 border-slate-200 text-slate-600" : (msg.interno ? "bg-amber-100 border-amber-200 text-amber-700" : "bg-blue-500 border-blue-400 text-white")
                     )}>
                       {(msg.usuario_nome || 'S').charAt(0)}
                     </div>
                     <span className={cn(
                       "text-xs font-bold uppercase tracking-tight",
                       msg.interno ? "text-amber-900" : isCliente ? "text-slate-900" : "text-blue-50"
                     )}>
                       {msg.usuario_nome || 'Sistema'}
                     </span>
                     {!isCliente && !msg.interno && (
                        <ShieldCheck size={12} className="text-blue-200" />
                     )}
                  </div>

                  <div className={cn(
                    "text-sm font-medium leading-6 whitespace-pre-wrap",
                    msg.interno ? "text-amber-800" : isCliente ? "text-slate-600" : "text-white"
                  )}>
                    {msg.mensagem}
                  </div>

                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className={cn(
                      "mt-3 pt-3 border-t",
                      isCliente || msg.interno ? "border-slate-100" : "border-white/10"
                    )}>
                        <AttachmentList 
                          attachments={msg.attachments} 
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
        <div className="shrink-0 p-4 md:p-6 bg-white border-t border-slate-100 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
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
