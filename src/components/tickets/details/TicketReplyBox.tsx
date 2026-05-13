import React, { useState } from 'react';
import { Send, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../ui/Button';
import { FileUpload } from '../../ui/FileUpload';
import { AnimatePresence, motion } from 'motion/react';

interface TicketReplyBoxProps {
  onSendMessage: (mensagem: string, isInternal: boolean, files: File[]) => Promise<boolean>;
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

    const ok = await onSendMessage(newMessage, isInternal, selectedFiles);
    
    // Only reset if successful
    if (ok) {
      setNewMessage('');
      setSelectedFiles([]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
        {(actionError || actionSuccess) && (
          <AnimatePresence>
              {actionError && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-2 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-[10px] font-bold"
                >
                  <AlertCircle size={12} /> {actionError}
                </motion.div>
              )}
              {actionSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-2 text-emerald-600 text-[10px] font-bold"
                >
                  <CheckCircle2 size={12} /> {actionSuccess}
                </motion.div>
              )}
          </AnimatePresence>
        )}

        <div className="relative group">
          <textarea 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isInternal ? "Nota interna..." : "Resposta para o cliente..."}
            rows={1}
            className={cn(
              "w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-medium focus:ring-2 transition-all outline-none resize-none min-h-[40px]",
              isInternal ? "focus:ring-amber-100 focus:border-amber-300 bg-amber-50/20 text-amber-900" : "focus:ring-blue-100 focus:border-blue-300 text-slate-800"
            )}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 max-w-[200px]">
             <FileUpload onFilesChange={setSelectedFiles} />
          </div>

          <div className="flex items-center gap-3 shrink-0">
              {canAddInternalNote && (
                <label className="flex items-center gap-1.5 cursor-pointer group">
                  <div 
                    onClick={() => setIsInternal(!isInternal)}
                    className={cn(
                      "w-6 h-3 rounded-full transition-all relative",
                      isInternal ? "bg-amber-500" : "bg-slate-200 group-hover:bg-slate-300"
                    )}
                  >
                      <div className={cn(
                        "absolute top-0.5 w-2 h-2 rounded-full bg-white transition-all shadow-sm",
                        isInternal ? "translate-x-3.5" : "translate-x-0.5"
                      )} />
                  </div>
                  <span className={cn("text-[8px] font-black uppercase tracking-tight", isInternal ? "text-amber-600" : "text-slate-400 group-hover:text-slate-500")}>Interno</span>
                </label>
              )}

              <Button 
                type="submit" 
                disabled={(!newMessage.trim() && selectedFiles.length === 0) || loadingSend}
                className={cn(
                  "h-7 px-3 font-black text-[9px] uppercase tracking-widest shadow-sm translate-y-[-1px]",
                  isInternal ? "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500" : "bg-blue-600 hover:bg-blue-700 shadow-blue-100"
                )}
              >
                {loadingSend ? (
                  <Loader2 size={11} className="animate-spin mr-1.5" />
                ) : (
                  <Send size={11} className="mr-1.5" />
                )}
                Responder
              </Button>
          </div>
        </div>
    </form>
  );
};
