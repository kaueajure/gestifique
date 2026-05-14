import React from 'react';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { ArrowLeft } from 'lucide-react';
import { TicketStatus } from '../../../types';
import { cn } from '../../../lib/utils';

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
          color: 'bg-blue-500 text-white border-blue-600 shadow-md shadow-blue-100',
          dot: 'bg-white'
        };
      case 'aguardando_cliente':
        return { 
          label: 'Aguardando cliente', 
          color: 'bg-amber-50 text-amber-700 border-amber-200/50 shadow-sm',
          dot: 'bg-amber-500'
        };
      case 'atendente_respondeu':
        return { 
          label: 'Atendente respondeu', 
          color: 'bg-slate-50 text-slate-500 border-slate-200/50 shadow-sm',
          dot: 'bg-slate-400'
        };
      case 'sem_resposta':
        return { 
          label: 'Sem resposta', 
          color: 'bg-rose-50 text-rose-600 border-rose-200/50 shadow-sm',
          dot: 'bg-rose-500'
        };
      default:
        return null;
    }
  };

  const estadoInfo = getEstadoAtendimentoInfo(estado_atendimento);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-md border border-slate-200/60 p-4 px-6 rounded-2xl shadow-sm relative overflow-hidden">
      <div className="flex items-center gap-5 min-w-0">
        <button 
          onClick={onBack}
          className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-white hover:border-blue-100 hover:shadow-sm transition-all shrink-0 border border-slate-100"
          title="Voltar"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 opacity-60 group">
             <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] bg-blue-50 px-1.5 py-0.5 rounded leading-none">#{id}</span>
             <div className="w-1 h-1 rounded-full bg-slate-300" />
             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Ticket Management</span>
          </div>
          <h2 className="text-[20px] font-black text-slate-900 truncate tracking-tight uppercase leading-tight">{titulo || 'Atendimento'}</h2>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {estadoInfo && (
          <div className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
            estadoInfo.color
          )}>
            <div className={cn("w-1.5 h-1.5 rounded-full", estadoInfo.dot, estadoInfo.label === 'Cliente respondeu' ? 'animate-pulse' : '')} />
            {estadoInfo.label}
          </div>
        )}

        <div className="h-6 w-px bg-slate-100 mx-1" />

        {showResolveButton && onUpdateStatus && (
          <Button 
            variant="emerald" 
            size="sm" 
            onClick={() => onUpdateStatus({ status: 'resolvido' })}
            className="h-10 px-6 text-[10px] uppercase font-black tracking-widest shrink-0 shadow-lg shadow-emerald-50 rounded-xl"
          >
            Finalizar
          </Button>
        )}

        {showReopenButton && onUpdateStatus && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onUpdateStatus({ status: 'aberto' })}
            className="h-10 px-6 text-[10px] uppercase font-black tracking-widest shrink-0 border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl"
          >
            Reabrir Ticket
          </Button>
        )}
      </div>
    </div>
  );
};
