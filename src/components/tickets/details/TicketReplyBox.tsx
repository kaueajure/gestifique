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
  EyeOff
} from 'lucide-react';
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
