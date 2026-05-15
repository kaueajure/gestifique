import React from 'react';
import { TicketStatus } from '../../types';
import { Card } from '../ui/Card';
import { 
  Clock, 
  CheckCircle2, 
  MessageSquare, 
  AlertCircle, 
  Layers, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SummaryProps {
  summary: Record<TicketStatus | 'total', number> & { [key: string]: number };
}

export const TicketSummaryCards = ({ summary }: SummaryProps) => {
  const cards = [
    { 
      label: 'Novo/Aberto', 
      value: summary.aberto || 0, 
      icon: MessageSquare, 
      color: 'blue',
      description: 'Aguardando ação'
    },
    { 
      label: 'Em Andamento', 
      value: summary.em_andamento || 0, 
      icon: Clock, 
      color: 'indigo',
      description: 'Sendo atendidos'
    },
    { 
      label: 'Aguardando Cliente', 
      value: summary.aguardando_cliente || 0, 
      icon: ShieldAlert, 
      color: 'amber',
      description: 'Resposta pendente'
    },
    { 
      label: 'SLA Crítico', 
      value: summary.sla_vencido || 0, 
      icon: AlertCircle, 
      color: 'rose',
      description: 'Fora do prazo'
    },
    { 
      label: 'Resolvidos', 
      value: summary.resolvido || 0, 
      icon: CheckCircle2, 
      color: 'emerald',
      description: 'Ciclo concluído'
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
      {cards.map((card) => (
        <Card 
          key={card.label} 
          className={cn(
            "p-2 border-slate-200 transition-all flex items-center gap-2",
            `hover:border-${card.color}-200`
          )}
        >
          <div className={cn(
            "p-1.5 rounded-md border shrink-0",
            card.color === 'blue' && "bg-blue-50 border-blue-100 text-blue-600",
            card.color === 'indigo' && "bg-indigo-50 border-indigo-100 text-indigo-600",
            card.color === 'amber' && "bg-amber-50 border-amber-100 text-amber-600",
            card.color === 'rose' && "bg-rose-50 border-rose-100 text-rose-600",
            card.color === 'emerald' && "bg-emerald-50 border-emerald-100 text-emerald-600",
          )}>
            <card.icon size={14} />
          </div>
          <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
            <h4 className="text-[11px] font-semibold text-slate-600 truncate" title={card.description}>
              {card.label}
            </h4>
            <span className="text-sm font-bold text-slate-800">
              {card.value}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
};
