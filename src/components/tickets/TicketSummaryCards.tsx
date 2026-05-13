import React from 'react';
import { TicketStatus } from '../../types';
import { Card } from '../ui/Card';

import { Clock, CheckCircle2, History, Archive, Layers } from 'lucide-react';

interface SummaryProps {
  summary: Record<TicketStatus | 'total', number>;
}

export const TicketSummaryCards = ({ summary }: SummaryProps) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto bg-white/50 backdrop-blur-sm border border-slate-200 rounded-2xl px-2 py-1.5 shadow-sm no-scrollbar mb-6">
      <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white border border-slate-100 shadow-sm shrink-0">
        <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
          <Layers size={14} />
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] uppercase text-slate-400 font-black tracking-widest leading-none mb-0.5">Total</span>
          <span className="text-sm font-black text-slate-900 leading-none">{summary.total}</span>
        </div>
      </div>

      <div className="w-px h-6 bg-slate-200 mx-1 shrink-0" />

      <div className="flex items-center gap-6 px-2 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase text-slate-400 font-black tracking-widest leading-none mb-0.5">Abertos</span>
            <span className="text-sm font-black text-slate-800 leading-none">{summary.aberto}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase text-slate-400 font-black tracking-widest leading-none mb-0.5">Em Andamento</span>
            <span className="text-sm font-black text-slate-800 leading-none">{summary.em_andamento}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase text-slate-400 font-black tracking-widest leading-none mb-0.5">Aguardando</span>
            <span className="text-sm font-black text-slate-800 leading-none">{summary.aguardando_cliente}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase text-slate-400 font-black tracking-widest leading-none mb-0.5">Resolvidos</span>
            <span className="text-sm font-black text-slate-800 leading-none">{summary.resolvido}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-slate-400" />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase text-slate-400 font-black tracking-widest leading-none mb-0.5">Fechados</span>
            <span className="text-sm font-black text-slate-800 leading-none">{summary.fechado}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
