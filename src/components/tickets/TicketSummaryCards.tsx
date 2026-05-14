import React from 'react';
import { TicketStatus } from '../../types';
import { Card } from '../ui/Card';

import { Clock, CheckCircle2, History, Archive, Layers } from 'lucide-react';

interface SummaryProps {
  summary: Record<TicketStatus | 'total', number>;
}

export const TicketSummaryCards = ({ summary }: SummaryProps) => {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
      <span className="text-slate-700">{summary.total} tickets</span>
      <span>&middot;</span>
      <span>{summary.aberto} abertos</span>
      <span>&middot;</span>
      <span className="text-amber-600">{summary.aguardando_cliente} aguardando</span>
      <span>&middot;</span>
      <span className="text-emerald-600">{summary.resolvido} resolvidos</span>
    </div>
  );
};
