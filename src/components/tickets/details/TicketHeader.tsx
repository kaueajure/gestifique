import React from 'react';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { 
  ArrowLeft, 
  CheckCircle2,
  RefreshCw,
  Clock,
  Mail,
  ShieldAlert,
  UserRound,
  CalendarDays,
  Hash,
  Building2
} from 'lucide-react';
import { Ticket, TicketStatus, User } from '../../../types';
import { cn, getSlaInfo } from '../../../lib/utils';

interface TicketHeaderProps {
  ticket: Ticket;
  currentUser: User;
  onUpdate: (data: Partial<Ticket>) => Promise<void>;
  onResolve: () => void;
  onBack: () => void;
  canManage: boolean;
}

export const TicketHeader = ({ 
  ticket, 
  currentUser, 
  onUpdate, 
  onResolve, 
  onBack,
  canManage 
}: TicketHeaderProps) => {
  const { 
    id, 
    titulo, 
    status, 
    prioridade, 
    origem, 
    cliente_nome,
    empresa_nome,
    responsavel_nome,
    prazo_sla,
    sla_status_operacional,
    created_at
  } = ticket;

  const showResolveButton = canManage && status !== 'resolvido' && status !== 'fechado';
  const showReopenButton = canManage && (status === 'resolvido' || status === 'fechado');
  
  const slaInfo = getSlaInfo(prazo_sla, status, sla_status_operacional);

  const getPriorityInfo = (prio: string) => {
    switch (prio) {
      case 'urgente': return { color: 'text-red-700 bg-red-100' };
      case 'alta': return { color: 'text-orange-700 bg-orange-100' };
      case 'media': return { color: 'text-amber-700 bg-amber-100' };
      case 'baixa': return { color: 'text-blue-700 bg-blue-100' };
      default: return { color: 'text-slate-700 bg-slate-100' };
    }
  };
  const priorityColor = getPriorityInfo(prioridade);
  const openedAt = new Date(created_at).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 sticky top-0 z-40">
      <div className="max-w-[1600px] mx-auto flex flex-col gap-4">
        
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onBack}
              className="h-9 w-9 p-0 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors shrink-0"
            >
              <ArrowLeft size={18} />
            </Button>
            
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded-md px-2 py-1">
                  <Hash size={11} />
                  {id}
                </span>
                {origem === 'email' && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 rounded-md px-2 py-1">
                    <Mail size={11} />
                    E-mail
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-slate-950 leading-snug">
                {titulo || 'Sem título'}
              </h2>
            </div>
          </div>

          <div className="flex items-center shrink-0">
            {showResolveButton && (
              <Button 
                onClick={onResolve}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm h-9 px-3 rounded-lg"
              >
                <CheckCircle2 size={14} className="mr-1.5" />
                Finalizar
              </Button>
            )}

            {showReopenButton && (
              <Button 
                variant="outline"
                size="sm"
                onClick={() => onUpdate({ status: 'aberto' })}
                className="text-xs font-semibold border-blue-200 text-blue-600 hover:bg-blue-50 shadow-sm h-9 px-3 rounded-lg"
              >
                <RefreshCw size={14} className="mr-1.5" />
                Reabrir
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
          <HeaderMeta
            label="Status"
            value={status.replace('_', ' ')}
            icon={<span className={cn("w-2 h-2 rounded-full", ticketStatusColors[status as TicketStatus])} />}
          />
          <HeaderMeta
            label="Prioridade"
            value={prioridade.charAt(0).toUpperCase() + prioridade.slice(1)}
            icon={<ShieldAlert size={14} />}
            className={priorityColor.color}
          />
          <HeaderMeta
            label="Solicitante"
            value={cliente_nome || 'Nao informado'}
            icon={<UserRound size={14} />}
          />
          <HeaderMeta
            label="Responsavel"
            value={responsavel_nome || 'Sem responsavel'}
            icon={<UserRound size={14} />}
          />
          <HeaderMeta
            label="Abertura"
            value={openedAt}
            icon={<CalendarDays size={14} />}
          />
          <HeaderMeta
            label={empresa_nome ? 'Empresa' : 'SLA'}
            value={empresa_nome || (slaInfo.compactText || slaInfo.label)}
            icon={empresa_nome ? <Building2 size={14} /> : <Clock size={14} />}
            className={!empresa_nome ? slaInfo.color : undefined}
          />
        </div>
      </div>
    </div>
  );
};

const HeaderMeta = ({
  label,
  value,
  icon,
  className
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  className?: string;
}) => (
  <div className={cn(
    "min-w-0 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2",
    className
  )}>
    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
      {icon}
      {label}
    </div>
    <div className="text-xs font-semibold text-slate-800 truncate capitalize" title={value}>
      {value}
    </div>
  </div>
);

const ticketStatusColors: Record<TicketStatus, string> = {
  aberto: "bg-blue-500",
  em_andamento: "bg-indigo-500",
  aguardando_cliente: "bg-amber-500",
  resolvido: "bg-emerald-500",
  fechado: "bg-slate-400",
};
