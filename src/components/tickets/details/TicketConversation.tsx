import React, { useRef, useEffect } from 'react';
import { Message, Ticket } from '../../../types';
import { MessageSquare } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Badge } from '../../ui/Badge';
import { AttachmentList } from '../../ui/AttachmentList';
import { TicketReplyBox } from './TicketReplyBox';

interface TicketConversationProps {
  ticket: Ticket;
  messages: Message[];
  onSendMessage: (mensagem: string, isInternal: boolean, files: File[]) => Promise<void>;
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
        <div className="max-h-[500px] overflow-y-auto p-5 space-y-5 custom-scrollbar bg-slate-50/30 rounded-t-xl border-b border-slate-100">
          {messages.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center">
                <div className="w-10 h-10 bg-slate-50 text-slate-200 rounded-xl flex items-center justify-center mb-3 border border-slate-100">
                  <MessageSquare size={20} />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nenhuma mensagem registrada.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div 
                key={msg.id} 
                className={cn(
                  "flex gap-4 p-4 rounded-xl border transition-colors shadow-sm",
                  msg.interno 
                    ? "bg-amber-50/60 border-amber-200/50" 
                    : "bg-white border-slate-200"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-[10px] uppercase shrink-0 shadow-sm",
                  msg.usuario_id === ticket.usuario_id ? "bg-slate-900" : (msg.interno ? "bg-amber-500" : "bg-blue-600")
                )}>
                  {(msg.usuario_nome || 'S').charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xs font-bold", msg.interno ? "text-amber-900" : "text-slate-900")}>{msg.usuario_nome || 'Sistema'}</span>
                        {msg.interno && (
                          <Badge variant="amber" className="text-[8px] font-bold px-1.5 py-0 uppercase border-none shadow-none">Nota Interna</Badge>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{new Date(msg.created_at).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span>
                  </div>
                  <div className={cn("text-sm font-medium leading-relaxed whitespace-pre-wrap", msg.interno ? "text-amber-800" : "text-slate-600")}>
                    {msg.mensagem}
                  </div>
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-3">
                        <AttachmentList 
                          attachments={msg.attachments} 
                          compact 
                          onRemove={onDeleteAttachment}
                        />
                    </div>
                  )}
                </div>
              </div>
            ))
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
