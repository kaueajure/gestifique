import React, { useState } from 'react';
import { Send, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../ui/Button';
import { FileUpload } from '../../ui/FileUpload';
import { AnimatePresence, motion } from 'motion/react';

interface TicketReplyBoxProps {
  onSendMessage: (mensagem: string, isInternal: boolean, files: File[]) => Promise<void>;
  loadingSend: boolean;
  actionError: string | null;
  actionSuccess: string | null;
  canAddInternalNote: boolean;
}

export const TicketReplyBox = ({ onSendMessage, loadingSend, actionError, actionSuccess, canAddInternalNote }: TicketReplyBoxProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && selectedFiles.length === 0) || loadingSend) return;

    await onSendMessage(newMessage, isInternal, selectedFiles);
    
    // Only reset if successful
    if (!actionError) {
      setNewMessage('');
      setSelectedFiles([]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
        {(actionError || actionSuccess) && (
          <AnimatePresence>
              {actionError && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-xs font-bold"
                >
                  <AlertCircle size={14} /> {actionError}
                </motion.div>
              )}
              {actionSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-2 text-emerald-600 text-xs font-bold"
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
            placeholder={isInternal ? "Escrever nota interna (visível apenas para equipe)..." : "Escrever resposta para o cliente..."}
            rows={3}
            className={cn(
              "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 transition-all outline-none resize-none",
              isInternal ? "focus:ring-amber-100 focus:border-amber-300 bg-amber-50/20 text-amber-900" : "focus:ring-blue-100 focus:border-blue-300 text-slate-800"
            )}
          />
        </div>

        <FileUpload onFilesChange={setSelectedFiles} />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4">
              {canAddInternalNote && (
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div 
                    onClick={() => setIsInternal(!isInternal)}
                    className={cn(
                      "w-8 h-4 rounded-full transition-all relative",
                      isInternal ? "bg-amber-500" : "bg-slate-200 group-hover:bg-slate-300"
                    )}
                  >
                      <div className={cn(
                        "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow-sm",
                        isInternal ? "translate-x-4" : "translate-x-0"
                      )} />
                  </div>
                  <span className={cn("text-[10px] font-bold uppercase tracking-widest", isInternal ? "text-amber-600" : "text-slate-400 group-hover:text-slate-500")}>Nota Interna</span>
                </label>
              )}
          </div>

          <Button 
            type="submit" 
            disabled={(!newMessage.trim() && selectedFiles.length === 0) || loadingSend}
            className={cn(
              "h-9 px-6 font-bold text-xs uppercase tracking-widest shadow-sm",
              isInternal ? "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500" : "bg-blue-600 hover:bg-blue-700"
            )}
          >
            {loadingSend ? (
              <Loader2 size={16} className="animate-spin mr-2" />
            ) : (
              <Send size={16} className="mr-2" />
            )}
            Enviar
          </Button>
        </div>
    </form>
  );
};
