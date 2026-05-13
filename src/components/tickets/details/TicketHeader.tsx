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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white border border-slate-200 p-1.5 px-3 rounded-lg shadow-sm">
      <div className="flex items-center gap-2">
        <button 
          onClick={onBack}
          className="h-6 w-6 flex items-center justify-center rounded bg-slate-50 text-slate-400 hover:text-slate-900 transition-all shrink-0"
          title="Voltar"
        >
          <ArrowLeft size={12} />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 leading-none mb-0.5">
            <span className="text-[9px] font-black text-blue-600 uppercase tracking-tighter shrink-0 bg-blue-50 px-1 py-0 rounded">#{id}</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">Atendimento</span>
          </div>
          <h2 className="text-base font-black text-slate-900 truncate tracking-tight uppercase leading-none">{titulo || 'Atendimento'}</h2>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {showResolveButton && onUpdateStatus && (
          <Button 
            variant="emerald" 
            size="sm" 
            onClick={() => onUpdateStatus({ status: 'resolvido' })}
            className="h-6 px-2 text-[8px] uppercase font-bold tracking-widest shrink-0"
          >
            Finalizar
          </Button>
        )}

        {showReopenButton && onUpdateStatus && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onUpdateStatus({ status: 'aberto' })}
            className="h-6 px-2 text-[8px] uppercase font-bold tracking-widest shrink-0 border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            Reabrir
          </Button>
        )}
      </div>
    </div>
  );
};
