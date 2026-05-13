import React from 'react';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { ArrowLeft } from 'lucide-react';
import { TicketStatus } from '../../../types';

interface TicketHeaderProps {
  id: number;
  titulo: string;
  status: string;
  prioridade: string;
  onBack: () => void;
  onUpdateStatus?: (data: { status: TicketStatus }) => void;
  canEdit?: boolean;
}

export const TicketHeader = ({ id, titulo, status, prioridade, onBack, onUpdateStatus, canEdit }: TicketHeaderProps) => {
  const showResolveButton = canEdit && status !== 'resolvido' && status !== 'fechado';
  const showReopenButton = canEdit && (status === 'resolvido' || status === 'fechado');

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white border border-slate-200 p-2 px-3 rounded-xl shadow-sm">
      <div className="flex items-center gap-3">
        <button 
          onClick={onBack}
          className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm shrink-0"
          title="Voltar para a lista"
        >
          <ArrowLeft size={14} />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter shrink-0 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100/50">#{id}</span>
            <span className="text-slate-300">·</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">Atendimento</span>
          </div>
          <h2 className="text-lg font-black text-slate-900 truncate tracking-tight group-hover:text-blue-700 transition-colors uppercase">{titulo || 'Atendimento'}</h2>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {showResolveButton && onUpdateStatus && (
          <Button 
            variant="emerald" 
            size="sm" 
            onClick={() => onUpdateStatus({ status: 'resolvido' })}
            className="h-7 px-3 text-[9px] uppercase font-bold tracking-widest shrink-0"
          >
            Finalizar
          </Button>
        )}

        {showReopenButton && onUpdateStatus && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onUpdateStatus({ status: 'aberto' })}
            className="h-7 px-3 text-[9px] uppercase font-bold tracking-widest shrink-0 border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            Reabrir
          </Button>
        )}
      </div>
    </div>
  );
};
