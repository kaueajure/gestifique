import React from 'react';
import { Button } from '../../ui/Button';
import { Select } from '../../ui/Select';
import { 
  ArrowLeft, 
  CheckCircle2,
  RefreshCw,
  Clock,
  Mail,
  UserRound,
  CalendarDays,
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
  agents: User[];
}

export const TicketHeader = ({ 
  ticket, 
  currentUser, 
  onUpdate, 
  onResolve, 
  onBack,
  canManage,
  agents
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
  const defaultStatusOptions = [
    { value: 'aberto', label: 'Aberto' },
    { value: 'em_andamento', label: 'Em andamento' },
    { value: 'aguardando_cliente', label: 'Aguard. cliente' },
    { value: 'resolvido', label: 'Resolvido' },
    { value: 'fechado', label: 'Fechado' }
  ];
  const statusOptions = defaultStatusOptions.some(option => option.value === status)
    ? defaultStatusOptions
    : [
        ...defaultStatusOptions,
        {
          value: status || 'aberto',
          label: (status || 'aberto').replace(/_/g, ' ')
        }
      ];

  const getPriorityInfo = (prio: string) => {
    switch (prio) {
      case 'urgente': return { dot: 'bg-red-500' };
      case 'alta': return { dot: 'bg-orange-500' };
      case 'media': return { dot: 'bg-amber-500' };
      case 'baixa': return { dot: 'bg-blue-500' };
      default: return { dot: 'bg-slate-400' };
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
    <div className="bg-white border-b border-slate-200 px-4 sm:px-5 py-4 sticky top-0 z-40">
      <div className="flex flex-col gap-4">
        
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
              {origem === 'email' && (
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 rounded-md px-2 py-1">
                    <Mail size={11} />
                    E-mail
                  </span>
                </div>
              )}
              <h2 className="text-lg sm:text-xl font-semibold text-slate-950 leading-snug">
                {titulo || 'Sem título'} <span className="font-medium text-slate-400">- #{id}</span>
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
          <HeaderSelectMeta
            label="Status"
            icon={<span className={cn("w-2 h-2 rounded-full", ticketStatusColors[status] || "bg-slate-400")} />}
          >
            <Select 
              value={status || 'aberto'}
              onChange={(value) => onUpdate({ status: value as TicketStatus })}
              options={statusOptions}
              buttonClassName="h-7 rounded-md border-slate-200 bg-white text-xs font-semibold text-slate-800 capitalize"
              dropdownClassName="min-w-[180px]"
              disabled={!canManage}
            />
          </HeaderSelectMeta>
          <HeaderSelectMeta
            label="Prioridade"
            icon={<span className={cn("w-2 h-2 rounded-sm", priorityColor.dot)} />}
          >
            <div className="relative">
              <span className={cn("absolute left-2 top-1/2 -translate-y-1/2 z-10 w-2 h-2 rounded-sm pointer-events-none", priorityColor.dot)} />
              <Select 
                value={prioridade || 'media'}
                onChange={(value) => onUpdate({ prioridade: value as any })}
                options={[
                  { value: 'baixa', label: 'Baixa' },
                  { value: 'media', label: 'Média' },
                  { value: 'alta', label: 'Alta' },
                  { value: 'urgente', label: 'Urgente' }
                ]}
                buttonClassName="h-7 rounded-md border-slate-200 bg-white pl-6 text-xs font-semibold text-slate-800"
                dropdownClassName="min-w-[150px]"
                disabled={!canManage}
              />
            </div>
          </HeaderSelectMeta>
          <HeaderSelectMeta
            label="Responsavel"
            icon={<UserRound size={14} />}
          >
            <Select 
              value={ticket.responsavel_id ? String(ticket.responsavel_id) : ''}
              onChange={(value) => onUpdate({ responsavel_id: value ? Number(value) : null })}
              options={[
                { value: '', label: 'Sem responsavel' },
                ...agents.map(a => ({ value: String(a.id), label: a.nome }))
              ]}
              buttonClassName="h-7 rounded-md border-slate-200 bg-white text-xs font-semibold text-slate-800"
              dropdownClassName="min-w-[220px]"
              disabled={!canManage}
            />
          </HeaderSelectMeta>
          <HeaderMeta
            label="Solicitante"
            value={cliente_nome || 'Nao informado'}
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

const HeaderSelectMeta = ({
  label,
  icon,
  children
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2">
    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
      {icon}
      {label}
    </div>
    {children}
  </div>
);

const ticketStatusColors: Record<string, string> = {
  aberto: "bg-blue-500",
  em_andamento: "bg-indigo-500",
  aguardando_cliente: "bg-amber-500",
  resolvido: "bg-emerald-500",
  fechado: "bg-slate-400",
};
