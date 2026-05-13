import React, { useState } from 'react';
import { Send, AlertCircle, CheckCircle2, Loader2, MessageSquare } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../ui/Button';
import { FileUpload } from '../../ui/FileUpload';
import { AnimatePresence, motion } from 'motion/react';
import { Ticket } from '../../../types';
import { TicketMacroList } from './TicketMacroList';

interface TicketReplyBoxProps {
  ticket: Ticket;
  onSendMessage: (mensagem: string, isInternal: boolean, files: File[]) => Promise<boolean>;
  loadingSend: boolean;
  actionError: string | null;
  actionSuccess: string | null;
  canAddInternalNote: boolean;
}

export const TicketReplyBox = ({ ticket, onSendMessage, loadingSend, actionError, actionSuccess, canAddInternalNote }: TicketReplyBoxProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showMacros, setShowMacros] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && selectedFiles.length === 0) || loadingSend) return;

    const ok = await onSendMessage(newMessage, isInternal, selectedFiles);
    
    // Only reset if successful
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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex bg-slate-100 p-0.5 rounded-lg">
             <button
                type="button"
                onClick={() => setIsInternal(false)}
                className={cn(
                  "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all",
                  !isInternal ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
             >
                Responder ao cliente
             </button>
             {canAddInternalNote && (
               <button
                  type="button"
                  onClick={() => setIsInternal(true)}
                  className={cn(
                    "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all",
                    isInternal ? "bg-white text-amber-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
               >
                  Nota interna
               </button>
             )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMacros(!showMacros)}
                className={cn(
                  "flex items-center gap-2 h-9 px-3 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all",
                  showMacros 
                    ? "bg-blue-600 border-blue-600 text-white shadow-lg ring-4 ring-blue-50" 
                    : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 shadow-sm"
                )}
              >
                <MessageSquare size={13} className={showMacros ? "text-blue-100" : "text-blue-500"} />
                Respostas prontas
              </button>

              {showMacros && (
                <div className="absolute bottom-full right-0 mb-3 z-[60]">
                  <TicketMacroList 
                    ticket={ticket}
                    onSelect={handleSelectMacro}
                    onClose={() => setShowMacros(false)}
                  />
                </div>
              )}
            </div>

            {isInternal && (
               <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-100 uppercase tracking-tighter">
                  <AlertCircle size={11} /> Privado para equipe
               </div>
            )}
          </div>
        </div>

        {(actionError || actionSuccess) && (
          <AnimatePresence>
              {actionError && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2.5 text-red-600 text-xs font-bold"
                >
                  <AlertCircle size={14} /> {actionError}
                </motion.div>
              )}
              {actionSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2.5 text-emerald-600 text-xs font-bold"
                >
                  <CheckCircle2 size={14} /> {actionSuccess}
                </motion.div>
              )}
          </AnimatePresence>
        )}

        <div className="relative">
          <textarea 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isInternal ? "Escreva uma nota interna para a equipe..." : "Escreva uma resposta para o cliente..."}
            rows={4}
            className={cn(
              "w-full border rounded-xl px-4 py-3 text-sm font-medium focus:ring-4 transition-all outline-none resize-none min-h-[120px] shadow-sm",
              isInternal 
                ? "bg-amber-50/30 border-amber-200 focus:ring-amber-50 focus:border-amber-400 text-amber-900 placeholder:text-amber-400" 
                : "bg-slate-50/50 border-slate-200 focus:ring-blue-50 focus:border-blue-400 text-slate-800 placeholder:text-slate-400"
            )}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:flex-1">
             <FileUpload onFilesChange={setSelectedFiles} />
          </div>

          <div className="w-full sm:w-auto shrink-0">
              <Button 
                type="submit" 
                disabled={(!newMessage.trim() && selectedFiles.length === 0) || loadingSend}
                className={cn(
                  "w-full sm:w-auto h-10 px-6 font-bold text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95",
                  isInternal ? "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500 shadow-amber-100" : "bg-blue-600 hover:bg-blue-700 shadow-blue-100"
                )}
              >
                {loadingSend ? (
                  <Loader2 size={16} className="animate-spin mr-2" />
                ) : (
                  <Send size={16} className="mr-2" />
                )}
                {isInternal ? "Adicionar Nota" : "Enviar Resposta"}
              </Button>
          </div>
        </div>
    </form>
  );
};
