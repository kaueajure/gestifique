import React from 'react';
import { TicketStatus } from '../../types';
import { Card } from '../ui/Card';

interface SummaryProps {
  summary: Record<TicketStatus | 'total', number>;
}

export const TicketSummaryCards = ({ summary }: SummaryProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      <Card className="p-3 bg-slate-50 border-slate-200">
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-tight mb-1">Total</h4>
        <p className="text-xl font-semibold text-slate-800">{summary.total}</p>
      </Card>
      <Card className="p-3 bg-blue-50 border-blue-100">
        <h4 className="text-[10px] font-bold text-blue-500 uppercase tracking-tight mb-1">Abertos</h4>
        <p className="text-xl font-semibold text-blue-900">{summary.aberto}</p>
      </Card>
      <Card className="p-3 bg-indigo-50 border-indigo-100">
        <h4 className="text-[10px] font-bold text-indigo-500 uppercase tracking-tight mb-1">Em Andamento</h4>
        <p className="text-xl font-semibold text-indigo-900">{summary.em_andamento}</p>
      </Card>
      <Card className="p-3 bg-amber-50 border-amber-100">
        <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-tight mb-1">Aguardando</h4>
        <p className="text-xl font-semibold text-amber-900">{summary.aguardando_cliente}</p>
      </Card>
      <Card className="p-3 bg-emerald-50 border-emerald-100">
        <h4 className="text-[10px] font-bold text-emerald-500 uppercase tracking-tight mb-1">Resolvidos</h4>
        <p className="text-xl font-semibold text-emerald-900">{summary.resolvido}</p>
      </Card>
      <Card className="p-3 bg-slate-100 border-slate-200">
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-tight mb-1">Fechados</h4>
        <p className="text-xl font-semibold text-slate-700">{summary.fechado}</p>
      </Card>
    </div>
  );
};
