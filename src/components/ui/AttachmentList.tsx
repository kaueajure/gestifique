import React from 'react';
import { TicketAttachment } from '../../types';
import { FileIcon } from './FileIcon';
import { Download, X, Eye } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AttachmentListProps {
  attachments: TicketAttachment[];
  onRemove?: (id: number) => void;
  className?: string;
  compact?: boolean;
}

export const AttachmentList = ({ attachments, onRemove, className, compact = false }: AttachmentListProps) => {
  if (attachments.length === 0) return null;

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className={cn("grid gap-2", compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2", className)}>
      {attachments.map((file) => (
        <div 
          key={file.id} 
          className={cn(
            "flex items-center justify-between p-2 rounded-lg border border-slate-100 bg-white shadow-sm transition-all hover:border-slate-200",
            file.interno && "bg-amber-50/30 border-amber-100"
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className={cn(
               "w-8 h-8 rounded flex items-center justify-center shrink-0",
               file.interno ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"
            )}>
              <FileIcon mimeType={file.mime_type} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-700 truncate" title={file.nome_original}>
                {file.nome_original}
              </p>
              <p className="text-[10px] font-medium text-slate-400">
                {formatSize(file.tamanho_bytes)}
                {file.interno && <span className="ml-1.5 text-amber-600 font-bold uppercase tracking-wider">Interno</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
             <a 
               href={file.url} 
               target="_blank" 
               rel="noopener noreferrer"
               download={file.nome_original}
               className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
               title="Baixar arquivo"
             >
               <Download size={14} />
             </a>
             {onRemove && (
               <button 
                 onClick={() => onRemove(file.id)}
                 className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                 title="Remover anexo"
               >
                 <X size={14} />
               </button>
             )}
          </div>
        </div>
      ))}
    </div>
  );
};
