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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-4 px-6 rounded-xl shadow-sm">
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="h-9 w-9 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:text-slate-900 transition-all shrink-0 border border-slate-100"
          title="Voltar"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2 leading-none mb-1">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest shrink-0 bg-blue-50 px-1.5 py-0.5 rounded">#{id}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">Atendimento</span>
          </div>
          <h2 className="text-lg font-black text-slate-900 truncate tracking-tight uppercase leading-none">{titulo || 'Atendimento'}</h2>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {showResolveButton && onUpdateStatus && (
          <Button 
            variant="emerald" 
            size="sm" 
            onClick={() => onUpdateStatus({ status: 'resolvido' })}
            className="h-9 px-4 text-[10px] uppercase font-bold tracking-widest shrink-0 shadow-sm"
          >
            Finalizar
          </Button>
        )}

        {showReopenButton && onUpdateStatus && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onUpdateStatus({ status: 'aberto' })}
            className="h-9 px-4 text-[10px] uppercase font-bold tracking-widest shrink-0 border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            Reabrir
          </Button>
        )}
      </div>
    </div>
  );
};
