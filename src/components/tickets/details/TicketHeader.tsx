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
  const getStatusVariant = (st: string) => {
    const map: Record<string, 'blue' | 'emerald' | 'amber' | 'red' | 'indigo' | 'slate'> = {
      aberto: 'blue',
      em_andamento: 'indigo',
      aguardando_cliente: 'amber',
      resolvido: 'emerald',
      fechado: 'slate'
    };
    return map[st] || 'slate';
  };

  const getPriorityVariant = (pr: string) => {
    const map: Record<string, 'blue' | 'indigo' | 'orange' | 'red' | 'slate'> = {
        baixa: 'blue',
        media: 'indigo',
        alta: 'orange',
        urgente: 'red'
    };
    return map[pr] || 'slate';
  };

  const showResolveButton = canEdit && status !== 'resolvido' && status !== 'fechado';
  const showReopenButton = canEdit && (status === 'resolvido' || status === 'fechado');

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <button 
          onClick={onBack}
          className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm"
          title="Voltar para a lista"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">#{id}</span>
            <span className="text-slate-300">·</span>
            <Badge variant={getStatusVariant(status || 'aberto')} className="text-[9px] py-0 px-1.5 font-bold uppercase tracking-tight">{(status || 'aberto').replace('_', ' ')}</Badge>
            <Badge variant={getPriorityVariant(prioridade || 'media') as any} className="text-[9px] py-0 px-1.5 font-bold uppercase tracking-tight">{prioridade || 'media'}</Badge>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 truncate tracking-tight">{titulo || 'Atendimento'}</h2>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {showResolveButton && onUpdateStatus && (
          <Button 
            variant="emerald" 
            size="sm" 
            onClick={() => onUpdateStatus({ status: 'resolvido' })}
            className="h-8 px-4 text-[10px] uppercase font-bold tracking-widest shrink-0"
          >
            Marcar como Resolvido
          </Button>
        )}

        {showReopenButton && onUpdateStatus && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onUpdateStatus({ status: 'aberto' })}
            className="h-8 px-4 text-[10px] uppercase font-bold tracking-widest shrink-0 border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            Reabrir Chamado
          </Button>
        )}
      </div>
    </div>
  );
};
