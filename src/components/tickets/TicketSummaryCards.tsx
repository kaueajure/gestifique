import React from 'react';
import { TicketStatus } from '../../types';
import { Card } from '../ui/Card';

import { Clock, CheckCircle2, History, Archive, Layers } from 'lucide-react';

interface SummaryProps {
  summary: Record<TicketStatus | 'total', number>;
}

export const TicketSummaryCards = ({ summary }: SummaryProps) => {
  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-slate-50/50 rounded-xl border border-slate-100/50 w-fit">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-slate-900">{summary.total}</span>
        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-tight">Atendimentos</span>
      </div>
      
      <div className="w-px h-3 bg-slate-200" />

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span className="text-xs font-bold text-slate-700">{summary.aberto}</span>
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">Abertos</span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span className="text-xs font-bold text-slate-700">{summary.aguardando_cliente}</span>
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">Aguardando</span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-xs font-bold text-slate-700">{summary.resolvido}</span>
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">Resolvidos</span>
        </div>
      </div>
    </div>
  );
};
