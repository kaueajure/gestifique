import React from 'react';
import { TicketStatus } from '../../types';
import { Card } from '../ui/Card';

import { Clock, CheckCircle2, History, Archive, Layers } from 'lucide-react';

interface SummaryProps {
  summary: Record<TicketStatus | 'total', number>;
}

export const TicketSummaryCards = ({ summary }: SummaryProps) => {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto bg-white/50 backdrop-blur-sm border border-slate-200 rounded-lg px-1 py-1 shadow-sm no-scrollbar mb-1.5">
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white border border-slate-100 shadow-sm shrink-0">
        <div className="w-4 h-4 rounded-[3px] bg-slate-900 text-white flex items-center justify-center shrink-0">
          <Layers size={9} />
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-[8px] uppercase text-slate-400 font-black tracking-widest leading-none">Total</span>
          <span className="text-[11px] font-black text-slate-900 leading-none">{summary.total}</span>
        </div>
      </div>

      <div className="w-px h-4 bg-slate-200 mx-0.5 shrink-0" />

      <div className="flex items-center gap-3 px-1 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <div className="flex items-baseline gap-1">
            <span className="text-[8px] uppercase text-slate-400 font-black tracking-widest leading-none">Abertos</span>
            <span className="text-[11px] font-black text-slate-700 leading-none">{summary.aberto}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          <div className="flex items-baseline gap-1">
            <span className="text-[8px] uppercase text-slate-400 font-black tracking-widest leading-none">Andamento</span>
            <span className="text-[11px] font-black text-slate-700 leading-none">{summary.em_andamento}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <div className="flex items-baseline gap-1">
            <span className="text-[8px] uppercase text-slate-400 font-black tracking-widest leading-none">Aguardando</span>
            <span className="text-[11px] font-black text-slate-700 leading-none">{summary.aguardando_cliente}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <div className="flex items-baseline gap-1">
            <span className="text-[8px] uppercase text-slate-400 font-black tracking-widest leading-none">Resolvidos</span>
            <span className="text-[11px] font-black text-slate-700 leading-none">{summary.resolvido}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
