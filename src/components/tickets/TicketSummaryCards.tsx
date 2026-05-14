import React from 'react';
import { TicketStatus } from '../../types';
import { Card } from '../ui/Card';

import { Clock, CheckCircle2, History, Archive, Layers } from 'lucide-react';

interface SummaryProps {
  summary: Record<TicketStatus | 'total', number>;
}

export const TicketSummaryCards = ({ summary }: SummaryProps) => {
  return (
    <div className="flex items-center gap-4 overflow-x-auto bg-transparent px-1 py-1.5 no-scrollbar mb-1">
      <div className="flex flex-col gap-0.5 min-w-[70px]">
        <span className="text-[9px] uppercase text-slate-400 font-bold tracking-[0.1em] transition-colors">Total</span>
        <span className="text-sm font-black text-slate-900 leading-none tracking-tight">{summary.total}</span>
      </div>

      <div className="w-px h-6 bg-slate-200 shrink-0 mx-1" />

      <div className="flex items-center gap-8 shrink-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-sm" />
            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-[0.05em]">Abertos</span>
          </div>
          <span className="text-[13px] font-black text-slate-800 leading-none ml-3 tracking-tight">{summary.aberto}</span>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-sm" />
            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-[0.05em]">Andamento</span>
          </div>
          <span className="text-[13px] font-black text-slate-800 leading-none ml-3 tracking-tight">{summary.em_andamento}</span>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-sm" />
            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-[0.05em]">Aguardando</span>
          </div>
          <span className="text-[13px] font-black text-slate-800 leading-none ml-3 tracking-tight">{summary.aguardando_cliente}</span>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm" />
            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-[0.05em]">Resolvidos</span>
          </div>
          <span className="text-[13px] font-black text-slate-800 leading-none ml-3 tracking-tight">{summary.resolvido}</span>
        </div>
      </div>
    </div>
  );
};
