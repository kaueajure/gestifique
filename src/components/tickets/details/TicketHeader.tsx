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
  estado_atendimento?: string;
  onBack: () => void;
  onUpdateStatus?: (data: { status: TicketStatus }) => void;
  canEdit?: boolean;
}

export const TicketHeader = ({ id, titulo, status, prioridade, estado_atendimento, onBack, onUpdateStatus, canEdit }: TicketHeaderProps) => {
  const showResolveButton = canEdit && status !== 'resolvido' && status !== 'fechado';
  const showReopenButton = canEdit && (status === 'resolvido' || status === 'fechado');

  const getEstadoAtendimentoInfo = (estado?: string) => {
    switch (estado) {
      case 'cliente_respondeu':
        return { 
          label: 'Cliente respondeu', 
          color: 'bg-blue-600 text-white border-blue-700 shadow-lg ring-1 ring-blue-400',
          dot: 'bg-blue-100'
        };
      case 'aguardando_cliente':
        return { 
          label: 'Aguardando cliente', 
          color: 'bg-amber-100 text-amber-700 border-amber-200 shadow-sm',
          dot: 'bg-amber-500'
        };
      case 'atendente_respondeu':
        return { 
          label: 'Atendente respondeu', 
          color: 'bg-slate-50 text-slate-500 border-slate-200',
          dot: 'bg-slate-300'
        };
      case 'sem_resposta':
        return { 
          label: 'Sem resposta', 
          color: 'bg-rose-50 text-rose-600 border-rose-100 ring-1 ring-rose-200',
          dot: 'bg-rose-500'
        };
      default:
        return null;
    }
  };

  const estadoInfo = getEstadoAtendimentoInfo(estado_atendimento);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-4 px-6 rounded-xl shadow-sm relative overflow-hidden">
      {estadoInfo && (
        <div className={`absolute top-0 right-0 left-0 h-0.5 ${estadoInfo.dot.replace('bg-', 'bg-')}`} />
      )}
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

      <div className="flex items-center gap-3 shrink-0">
        {estadoInfo && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest ${estadoInfo.color}`}>
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${estadoInfo.dot}`} />
            {estadoInfo.label}
          </div>
        )}

        {showResolveButton && onUpdateStatus && (
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => onUpdateStatus({ status: 'resolvido' })}
            className="h-9 px-4 text-[10px] uppercase font-bold tracking-widest shrink-0 shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white"
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
