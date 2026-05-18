import React from 'react';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { 
  ArrowLeft, 
  CheckCircle2,
  RefreshCw,
  Clock,
  Mail,
  ShieldAlert
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
    responsavel_nome,
    prazo_sla,
    sla_status_operacional
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

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-2.5 sticky top-0 z-40">
      <div className="max-w-[1600px] mx-auto flex items-start sm:items-center justify-between gap-3">
        
        {/* Left Side: Back button + Title & Metadata */}
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="h-7 w-7 mt-0.5 sm:mt-0 p-0 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors shrink-0"
          >
            <ArrowLeft size={16} />
          </Button>
          
          <div className="flex flex-col min-w-0 w-full gap-1">
            <div className="flex items-center gap-2 relative">
              <span className="text-[11px] font-medium text-slate-500 shrink-0">#{id}</span>
              <h2 className="text-sm font-semibold text-slate-800 truncate leading-tight">
                {titulo || 'Sem título'}
              </h2>
            </div>
            
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Status */}
              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border border-slate-200 bg-slate-50 text-slate-700">
                <div className={cn("w-1.5 h-1.5 rounded-full", ticketStatusColors[status as TicketStatus])} />
                {status.replace('_', ' ')}
              </div>

              {/* Priority */}
              <div className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium", priorityColor.color)}>
                <ShieldAlert size={10} />
                {prioridade.charAt(0).toUpperCase() + prioridade.slice(1)}
              </div>

              {/* Assignee */}
              {responsavel_nome && (
                <div className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border border-slate-200 bg-slate-50 text-slate-600">
                  <span className="opacity-70 mr-1">R:</span>
                  {responsavel_nome.split(' ')[0]}
                </div>
              )}

              {/* Client */}
              {cliente_nome && (
                <div className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border border-slate-200 bg-slate-50 text-slate-600">
                  <span className="opacity-70 mr-1">C:</span>
                  <span className="truncate max-w-[100px] block">{cliente_nome.split(' ')[0]}</span>
                </div>
              )}

              {/* SLA */}
              <div className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium", slaInfo.color)}>
                <Clock size={10} />
                {slaInfo.compactText || slaInfo.label}
              </div>

              {/* Origin */}
              {origem === 'email' && (
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-500" title="Origem: E-Mail">
                  <Mail size={10} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center shrink-0">
          {showResolveButton && (
            <Button 
              onClick={onResolve}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-medium shadow-sm h-7 px-2.5 rounded-md"
            >
              <CheckCircle2 size={12} className="mr-1.5" />
              Finalizar
            </Button>
          )}

          {showReopenButton && (
            <Button 
              variant="outline"
              size="sm"
              onClick={() => onUpdate({ status: 'aberto' })}
              className="text-[11px] font-medium border-blue-200 text-blue-600 hover:bg-blue-50 shadow-sm h-7 px-2.5 rounded-md"
            >
              <RefreshCw size={12} className="mr-1.5" />
              Reabrir
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const ticketStatusColors: Record<TicketStatus, string> = {
  aberto: "bg-blue-500",
  em_andamento: "bg-indigo-500",
  aguardando_cliente: "bg-amber-500",
  resolvido: "bg-emerald-500",
  fechado: "bg-slate-400",
};
