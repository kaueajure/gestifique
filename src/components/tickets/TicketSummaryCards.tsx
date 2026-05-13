import React from 'react';
import { TicketStatus } from '../../types';
import { Card } from '../ui/Card';

interface SummaryProps {
  summary: Record<TicketStatus | 'total', number>;
}

export const TicketSummaryCards = ({ summary }: SummaryProps) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm no-scrollbar">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 shrink-0">
        <span className="text-[10px] uppercase text-slate-500 font-bold tracking-tight">Total</span>
        <span className="text-sm font-bold text-slate-900">{summary.total}</span>
      </div>
      <div className="w-px h-4 bg-slate-200" />
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 shrink-0">
        <span className="text-[10px] uppercase text-blue-500 font-bold tracking-tight">Abertos</span>
        <span className="text-sm font-bold text-blue-900">{summary.aberto}</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 shrink-0">
        <span className="text-[10px] uppercase text-indigo-500 font-bold tracking-tight">Em Andamento</span>
        <span className="text-sm font-bold text-indigo-900">{summary.em_andamento}</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 shrink-0">
        <span className="text-[10px] uppercase text-amber-500 font-bold tracking-tight">Aguardando</span>
        <span className="text-sm font-bold text-amber-900">{summary.aguardando_cliente}</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 shrink-0">
        <span className="text-[10px] uppercase text-emerald-500 font-bold tracking-tight">Resolvidos</span>
        <span className="text-sm font-bold text-emerald-900">{summary.resolvido}</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 shrink-0">
        <span className="text-[10px] uppercase text-slate-500 font-bold tracking-tight">Fechados</span>
        <span className="text-sm font-bold text-slate-700">{summary.fechado}</span>
      </div>
    </div>
  );
};
