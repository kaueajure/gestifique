import React, { useState } from 'react';
import { 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Lock, 
  User, 
  X,
  Zap,
  EyeOff,
  Bot,
  Sparkles,
  MessageSquareText
} from 'lucide-react';
import { api } from '../../../lib/api';
import { cn } from '../../../lib/utils';
import { Button } from '../../ui/Button';
import { FileUpload } from '../../ui/FileUpload';
import { AnimatePresence, motion } from 'motion/react';
import { Ticket, User as UserType } from '../../../types';
import { TicketMacroList } from './TicketMacroList';

interface TicketReplyBoxProps {
  ticket: Ticket;
  currentUser: UserType;
  onSendMessage: (mensagem: string, isInternal: boolean, files: File[]) => Promise<boolean>;
  loadingSend: boolean;
  actionError: string | null;
  actionSuccess: string | null;
  canAddInternalNote: boolean;
}

export const TicketReplyBox = ({ 
  ticket, 
  currentUser, 
  onSendMessage, 
  loadingSend, 
  actionError, 
  actionSuccess, 
  canAddInternalNote 
}: TicketReplyBoxProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showMacros, setShowMacros] = useState(false);
  const [suggestedReply, setSuggestedReply] = useState<string | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  const handleSuggestReply = async () => {
    setLoadingSuggestion(true);
    setSuggestedReply(null);
    try {
      const res = await api.post<{ suggestion: string }>(`/ai/tickets/${ticket.id}/suggest-reply`, {
        agentDraft: newMessage.trim() || undefined
      });
      setSuggestedReply(res.suggestion);
    } catch (err: any) {
      console.error('Erro ao gerar sugestão de resposta:', err);
      alert(err.message || 'Erro ao gerar sugestão de resposta com IA.');
    } finally {
      setLoadingSuggestion(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && selectedFiles.length === 0) || loadingSend) return;

    const ok = await onSendMessage(newMessage, isInternal, selectedFiles);
    
    if (ok) {
      setNewMessage('');
      setSelectedFiles([]);
    }
  };

  const handleSelectMacro = (content: string) => {
    setNewMessage(prev => {
      if (!prev.trim()) return content;
      return prev + '\n' + content;
    });
    setShowMacros(false);
  };

  const isMessageEmpty = !newMessage.trim() && selectedFiles.length === 0;

  return (
    <form onSubmit={handleSubmit} className={cn(
      "relative overflow-visible rounded-lg border bg-white shadow-sm transition-all focus-within:border-blue-300 focus-within:ring-1 focus-within:ring-blue-100",
      isInternal ? "border-slate-300 opacity-85" : "border-slate-200"
    )}>
        <div className={cn(
          "flex flex-col gap-2 border-b px-3 py-2 sm:flex-row sm:items-center sm:justify-between",
          isInternal ? "border-slate-200 bg-slate-100/70" : "border-slate-200 bg-slate-50"
        )}>
          <div className="inline-flex w-full rounded-md border border-slate-200 bg-white p-0.5 sm:w-auto">
              <button
                type="button"
                onClick={() => setIsInternal(false)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-all sm:flex-none",
                  !isInternal 
                    ? "bg-white text-blue-700 shadow-sm ring-1 ring-slate-200" 
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                )}
             >
                <User size={12} />
                Resposta pública
             </button>
             {canAddInternalNote && (
               <button
                  type="button"
                  onClick={() => setIsInternal(true)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-all sm:flex-none",
                    isInternal 
                      ? "bg-white text-slate-700 shadow-sm ring-1 ring-slate-200" 
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  )}
               >
                  <Lock size={12} />
                  Nota interna
               </button>
             )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={loadingSuggestion}
              onClick={handleSuggestReply}
              className="flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50"
            >
              {loadingSuggestion ? (
                <Loader2 size={12} className="animate-spin text-indigo-600" />
              ) : (
                <Bot size={12} className="text-indigo-600" />
              )}
              Sugerir
            </button>

            <div className="relative">
              <button
              type="button"
              onClick={() => setShowMacros(!showMacros)}
              className={cn(
                  "flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-semibold transition-all",
                  showMacros 
                    ? "bg-blue-600 border-blue-600 text-white" 
                    : "bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600"
                )}
              >
                <Zap size={12} />
                Atalhos
              </button>

              {showMacros && (
                <div className="absolute bottom-full right-0 z-[80] mb-2 max-w-[calc(100vw-2rem)]">
                  <TicketMacroList 
                    ticket={ticket}
                    currentUser={currentUser}
                    onSelect={handleSelectMacro}
                    onClose={() => setShowMacros(false)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={cn(
          "relative transition-colors",
          isInternal ? "bg-amber-50/30" : "bg-white"
        )}>
          {isInternal && (
             <div className="pointer-events-none absolute right-3 top-3 z-10 hidden items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[9px] font-semibold text-slate-500 sm:flex">
                <EyeOff size={10} /> Visível apenas para agentes
             </div>
          )}

          <div className={cn(
            "pointer-events-none absolute left-4 top-4",
            isInternal ? "text-slate-400" : "text-slate-300"
          )}>
            {isInternal ? <Lock size={17} /> : <MessageSquareText size={17} />}
          </div>

          <textarea 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isInternal ? "Escreva uma nota interna..." : "Escreva a resposta do atendimento..."}
            className={cn(
              "min-h-[104px] w-full resize-none border-0 bg-transparent py-4 pl-11 pr-4 text-sm font-medium leading-6 transition-all focus:outline-none focus:ring-0 sm:pr-48",
              isInternal 
                ? "text-slate-600 placeholder:text-slate-400" 
                : "text-slate-700 placeholder:text-slate-400"
            )}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                handleSubmit(e);
              }
            }}
          />

          <div className="absolute bottom-2 left-3 right-3">
             <AnimatePresence>
                {actionError && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mb-1 flex items-center gap-1.5 rounded-lg border border-rose-100 bg-rose-50 p-2 text-xs font-semibold text-rose-600 shadow-sm"
                  >
                    <AlertCircle size={14} /> {actionError}
                  </motion.div>
                )}
                {actionSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mb-1 flex items-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50 p-2 text-xs font-semibold text-emerald-600 shadow-sm"
                  >
                    <CheckCircle2 size={14} /> {actionSuccess}
                  </motion.div>
                )}
             </AnimatePresence>
          </div>
        </div>

        {/* Suggested Response Panel */}
        {suggestedReply && (
          <div className="relative mx-3 my-2.5 rounded-xl border border-indigo-100 bg-indigo-50 p-3 px-3.5">
            <div className="mb-1.5 flex items-center justify-between">
               <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                 <Sparkles size={11} className="text-indigo-600 animate-pulse" /> Resposta Sugerida por IA
               </span>
               <button 
                 type="button"
                 onClick={() => setSuggestedReply(null)}
                 className="rounded p-1 text-xs font-semibold text-slate-400 transition-colors hover:bg-slate-200/50 hover:text-slate-600"
               >
                 <X size={12} />
               </button>
            </div>
            <p className="mb-2.5 whitespace-pre-wrap rounded-lg border border-indigo-100/40 bg-white/80 p-2.5 font-sans text-xs italic leading-relaxed text-slate-700">
               {suggestedReply}
            </p>
            <div className="flex justify-end gap-2">
               <button
                 type="button"
                 onClick={() => {
                   setNewMessage(suggestedReply);
                   setSuggestedReply(null);
                 }}
                 className="rounded-lg bg-indigo-600 px-3 py-1.5 text-[10px] font-bold text-white shadow-sm transition-all hover:bg-indigo-500"
               >
                 Usar Resposta
               </button>
            </div>
          </div>
        )}

         <div className={cn(
          "flex flex-col gap-3 border-t p-3 sm:flex-row sm:items-end sm:justify-between",
          isInternal ? "border-slate-200 bg-slate-100/70" : "border-slate-200 bg-slate-50"
        )}>
          <div className="flex min-w-0 flex-1">
             <FileUpload 
               onFilesChange={setSelectedFiles}
               className="w-full"
               compact
             />
          </div>

          <div className="flex items-center justify-between gap-3 sm:justify-end">
             <span className="hidden text-[10px] font-medium text-slate-400 sm:inline-block">
               CTRL + ENTER para enviar
             </span>
             <Button 
                type="submit"
                disabled={isMessageEmpty || loadingSend}
                size="sm"
                className={cn(
                  "h-9 rounded-md px-4 text-xs font-semibold shadow-sm",
                  isInternal 
                    ? "bg-slate-700 hover:bg-slate-600 text-white" 
                    : "bg-blue-600 hover:bg-blue-500 text-white",
                  isMessageEmpty && "opacity-50 grayscale"
                )}
              >
                {loadingSend ? (
                  <Loader2 size={12} className="animate-spin mr-1.5" />
                ) : (
                  <Send size={12} className="mr-1.5" />
                )}
                {isInternal ? "Postar Nota" : "Enviar Resposta"}
              </Button>
          </div>
        </div>
    </form>
  );
};
