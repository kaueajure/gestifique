import React, { useState } from 'react';
import { Send, AlertCircle, CheckCircle2, Loader2, MessageSquare } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../ui/Button';
import { FileUpload } from '../../ui/FileUpload';
import { AnimatePresence, motion } from 'motion/react';
import { Ticket, User } from '../../../types';
import { TicketMacroList } from './TicketMacroList';

interface TicketReplyBoxProps {
  ticket: Ticket;
  currentUser: User;
  onSendMessage: (mensagem: string, isInternal: boolean, files: File[]) => Promise<boolean>;
  loadingSend: boolean;
  actionError: string | null;
  actionSuccess: string | null;
  canAddInternalNote: boolean;
}

export const TicketReplyBox = ({ ticket, currentUser, onSendMessage, loadingSend, actionError, actionSuccess, canAddInternalNote }: TicketReplyBoxProps) => {
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner-sm">
             <button
                type="button"
                onClick={() => setIsInternal(false)}
                className={cn(
                  "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                  !isInternal ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50" : "text-slate-400 hover:text-slate-600"
                )}
             >
                Resposta ao cliente
             </button>
             {canAddInternalNote && (
               <button
                  type="button"
                  onClick={() => setIsInternal(true)}
                  className={cn(
                    "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                    isInternal ? "bg-white text-amber-600 shadow-sm ring-1 ring-slate-200/50" : "text-slate-400 hover:text-slate-600"
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
                  "flex items-center gap-2.5 h-10 px-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all shadow-sm",
                  showMacros 
                    ? "bg-blue-600 border-blue-600 text-white shadow-blue-100 ring-4 ring-blue-50" 
                    : "bg-white border-slate-200/60 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                <MessageSquare size={14} className={cn(showMacros ? "text-blue-100" : "text-blue-500")} />
                Macros
              </button>

              {showMacros && (
                <div className="absolute bottom-full right-0 mb-4 z-[60] animate-in slide-in-from-bottom-2 duration-200">
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

        {(actionError || actionSuccess) && (
          <AnimatePresence mode="wait">
              {actionError && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2.5 text-red-600 text-[11px] font-bold"
                >
                  <AlertCircle size={14} /> {actionError}
                </motion.div>
              )}
              {actionSuccess && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2.5 text-emerald-600 text-[11px] font-bold"
                >
                  <CheckCircle2 size={14} /> {actionSuccess}
                </motion.div>
              )}
          </AnimatePresence>
        )}

        <div className="relative group">
          <textarea 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isInternal ? "Escreva uma nota interna privada..." : "Descreva sua resposta aqui..."}
            rows={4}
            className={cn(
              "w-full border rounded-2xl px-5 py-4 text-[14px] font-medium transition-all outline-none resize-none min-h-[140px] shadow-sm",
              isInternal 
                ? "bg-amber-50/20 border-amber-200/60 focus:ring-4 focus:ring-amber-50 focus:border-amber-400 text-amber-900 placeholder:text-amber-300" 
                : "bg-slate-50/30 border-slate-200/60 focus:ring-4 focus:ring-blue-50 focus:border-blue-400 text-slate-800 placeholder:text-slate-400"
            )}
          />
          {isInternal && (
            <div className="absolute top-4 right-5 pointer-events-none opacity-20 hidden md:block">
               <AlertCircle size={40} className="text-amber-500" />
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:flex-1">
             <FileUpload onFilesChange={setSelectedFiles} />
          </div>

          <div className="w-full sm:w-auto shrink-0 flex items-center gap-3">
              {isInternal && (
                <span className="hidden lg:flex items-center gap-2 text-[9px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-2 rounded-lg border border-amber-100/50">
                  <AlertCircle size={11} /> A equipe verá isso
                </span>
              )}
              <Button 
                type="submit" 
                disabled={(!newMessage.trim() && selectedFiles.length === 0) || loadingSend}
                className={cn(
                  "w-full sm:w-auto h-12 px-8 font-black text-[10px] uppercase tracking-[0.15em] shadow-xl transition-all active:scale-95 rounded-xl",
                  isInternal ? "bg-amber-600 hover:bg-amber-700 shadow-amber-200/50 ring-4 ring-amber-50" : "bg-blue-600 hover:bg-blue-700 shadow-blue-200/50 ring-4 ring-blue-50"
                )}
              >
                {loadingSend ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <Send size={18} className="mr-2" />
                    {isInternal ? "Adicionar Nota" : "Enviar Resposta"}
                  </>
                )}
              </Button>
          </div>
        </div>
    </form>
  );
};
