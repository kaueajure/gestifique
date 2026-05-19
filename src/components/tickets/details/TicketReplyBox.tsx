import React, { useState } from 'react';
import { 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  MessageSquare, 
  Lock, 
  User, 
  Paperclip, 
  X,
  Zap,
  EyeOff,
  Bot,
  Sparkles
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
    <div className="flex flex-col gap-0 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all focus-within:shadow-md focus-within:border-blue-300">
        {/* Composer Tabs */}
        <div className="flex items-center justify-between px-3 bg-slate-50/50 border-b border-slate-100">
          <div className="flex -mb-[1px]">
              <button
                type="button"
                onClick={() => setIsInternal(false)}
                className={cn(
                  "px-3 py-2 text-xs font-semibold transition-all border-b-2 flex items-center gap-1.5",
                  !isInternal 
                    ? "text-blue-600 border-blue-600 bg-white" 
                    : "text-slate-500 border-transparent hover:text-slate-700"
                )}
             >
                <User size={12} />
                Resposta Pública
             </button>
             {canAddInternalNote && (
               <button
                  type="button"
                  onClick={() => setIsInternal(true)}
                  className={cn(
                    "px-3 py-2 text-xs font-semibold transition-all border-b-2 flex items-center gap-1.5",
                    isInternal 
                      ? "text-amber-600 border-amber-600 bg-white" 
                      : "text-slate-500 border-transparent hover:text-slate-700"
                  )}
               >
                  <Lock size={12} />
                  Nota Interna
               </button>
             )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={loadingSuggestion}
              onClick={handleSuggestReply}
              className="flex items-center gap-1.5 h-7 px-2.5 rounded-md border text-xs font-semibold transition-all shadow-sm bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
            >
              {loadingSuggestion ? (
                <Loader2 size={12} className="animate-spin text-indigo-600" />
              ) : (
                <Bot size={12} className="text-indigo-600" />
              )}
              Sugerir Resposta
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMacros(!showMacros)}
                className={cn(
                  "flex items-center gap-1.5 h-7 px-2.5 rounded-md border text-xs font-semibold transition-all shadow-sm",
                  showMacros 
                    ? "bg-blue-600 border-blue-600 text-white" 
                    : "bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600"
                )}
              >
                <Zap size={12} />
                Atalhos
              </button>

              {showMacros && (
                <div className="absolute bottom-full right-0 mb-3 z-[60]">
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

        {/* Text Area Content */}
        <div className={cn(
          "relative transition-colors",
          isInternal ? "bg-amber-50/30" : "bg-white"
        )}>
          {isInternal && (
             <div className="absolute top-2 right-2 z-10 flex items-center gap-1 text-[9px] font-semibold text-amber-600 bg-amber-100/50 px-1.5 py-0.5 rounded border border-amber-200/50 pointer-events-none">
                <EyeOff size={10} /> Visível apenas para agentes
             </div>
          )}

          <textarea 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isInternal ? "Escreva uma observação interna ou detalhe técnico..." : "Digite sua mensagem para o cliente..."}
            className={cn(
              "w-full p-3 text-sm font-medium focus:ring-0 focus:outline-none transition-all resize-none border-0 min-h-[70px]",
              isInternal 
                ? "text-amber-900 placeholder:text-amber-400" 
                : "text-slate-700 placeholder:text-slate-400"
            )}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                handleSubmit(e);
              }
            }}
          />

          {/* Feedback Area */}
          <div className="absolute bottom-1 left-3 right-3">
             <AnimatePresence>
                {actionError && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-1.5 mb-1 bg-rose-50 border border-rose-100 rounded-md flex items-center gap-1.5 text-rose-600 text-xs font-semibold"
                  >
                    <AlertCircle size={14} /> {actionError}
                  </motion.div>
                )}
                {actionSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-1.5 mb-1 bg-emerald-50 border border-emerald-100 rounded-md flex items-center gap-1.5 text-emerald-600 text-xs font-semibold"
                  >
                    <CheckCircle2 size={14} /> {actionSuccess}
                  </motion.div>
                )}
             </AnimatePresence>
          </div>
        </div>

        {/* Suggested Response Panel */}
        {suggestedReply && (
          <div className="mx-3 my-2.5 p-3 px-3.5 bg-indigo-50 border border-indigo-100 rounded-lg relative shadow-inner">
            <div className="flex justify-between items-center mb-1.5">
               <span className="text-[10px] font-bold text-indigo-700 flex items-center gap-1.5 uppercase tracking-wider">
                 <Sparkles size={11} className="text-indigo-600 animate-pulse" /> Resposta Sugerida por IA
               </span>
               <button 
                 type="button"
                 onClick={() => setSuggestedReply(null)}
                 className="text-slate-400 hover:text-slate-600 text-xs font-semibold hover:bg-slate-200/50 p-1 rounded transition-colors"
               >
                 <X size={12} />
               </button>
            </div>
            <p className="text-xs text-slate-700 italic leading-relaxed whitespace-pre-wrap mb-2.5 bg-white/80 p-2 border border-indigo-100/40 rounded-md font-sans">
               {suggestedReply}
            </p>
            <div className="flex gap-2 justify-end">
               <button
                 type="button"
                 onClick={() => {
                   setNewMessage(suggestedReply);
                   setSuggestedReply(null);
                 }}
                 className="px-3 py-1.5 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded transition-all shadow-sm"
               >
                 Usar Resposta
               </button>
            </div>
          </div>
        )}

        {/* Footer / Actions */}
        <div className="flex flex-wrap items-center justify-between p-2 bg-slate-50/50 border-t border-slate-100 gap-2">
          <div className="flex flex-1 min-w-0">
             <FileUpload 
               onFilesChange={setSelectedFiles}
               className="w-full"
               compact
             />
          </div>

          <div className="flex items-center gap-3">
             <span className="hidden sm:inline-block text-[10px] font-medium text-slate-400">
               CTRL + ENTER para enviar
             </span>
             <Button 
                onClick={handleSubmit}
                disabled={isMessageEmpty || loadingSend}
                size="sm"
                className={cn(
                  "px-3 text-xs font-semibold shadow-sm h-8",
                  isInternal 
                    ? "bg-amber-600 hover:bg-amber-500 text-white" 
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
    </div>
  );
};
