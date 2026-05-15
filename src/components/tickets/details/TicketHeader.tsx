import React from 'react';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { 
  ArrowLeft, 
  Mail, 
  Globe, 
  Clock, 
  User as UserIcon, 
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  Lock,
  RefreshCw
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
    prazo_sla 
  } = ticket;

  const showResolveButton = canManage && status !== 'resolvido' && status !== 'fechado';
  const showReopenButton = canManage && (status === 'resolvido' || status === 'fechado');
  
  const slaInfo = getSlaInfo(prazo_sla, status);

  const statusColors: Record<string, string> = {
    aberto: "bg-blue-50 text-blue-700 border-blue-200",
    em_andamento: "bg-indigo-50 text-indigo-700 border-indigo-200",
    aguardando_cliente: "bg-amber-50 text-amber-700 border-amber-200",
    resolvido: "bg-emerald-50 text-emerald-700 border-emerald-200",
    fechado: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <div className="bg-white border-b border-slate-200 p-4 md:p-6 sticky top-0 z-40">
      <div className="max-w-[1600px] mx-auto space-y-4">
        {/* Top Row: Navigation + Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onBack}
              className="h-10 w-10 p-0 rounded-xl bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900 transition-all shrink-0"
            >
              <ArrowLeft size={18} />
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100 uppercase tracking-widest">
                  #{id}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Atendimento Profissional</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 truncate tracking-tight uppercase leading-tight">
                {titulo || 'Sem título'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {showResolveButton && (
              <Button 
                onClick={onResolve}
                className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white border-b-4 border-emerald-800 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all active:translate-y-0.5 active:border-b-0 shadow-lg shadow-emerald-200"
              >
                <CheckCircle2 size={16} className="mr-2" />
                Finalizar
              </Button>
            )}

            {showReopenButton && (
              <Button 
                variant="outline" 
                onClick={() => onUpdate({ status: 'aberto' })}
                className="h-10 px-6 text-[11px] font-black uppercase tracking-widest rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50 shadow-sm"
              >
                <RefreshCw size={16} className="mr-2" />
                Reabrir Chamado
              </Button>
            )}
          </div>
        </div>

        {/* Bottom Row: Metadata Badges */}
        <div className="flex flex-wrap items-center gap-y-3 gap-x-6 pt-2">
          {/* Status */}
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 pr-4 rounded-xl border border-slate-100">
             <div className={cn(
               "w-6 h-6 rounded-lg flex items-center justify-center border shadow-sm",
               ticketStatusColors[status as TicketStatus] || "bg-slate-100 border-slate-200"
             )}>
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
             </div>
             <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Status</span>
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{status.replace('_', ' ')}</span>
             </div>
          </div>

          {/* Prioridade */}
          <div className="flex items-center gap-2">
             <div className={cn(
               "w-8 h-8 rounded-xl flex items-center justify-center border shadow-sm",
               prioridade === 'urgente' ? "bg-rose-50 border-rose-100 text-rose-600" :
               prioridade === 'alta' ? "bg-amber-50 border-amber-100 text-amber-600" :
               "bg-slate-50 border-slate-100 text-slate-600"
             )}>
                <ShieldAlert size={14} />
             </div>
             <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Prioridade</span>
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{prioridade}</span>
             </div>
          </div>

          {/* Responsável */}
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                <UserIcon size={14} />
             </div>
             <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Responsável</span>
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{responsavel_nome || 'Pendente'}</span>
             </div>
          </div>

          {/* Cliente */}
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shadow-sm">
                <Globe size={14} />
             </div>
             <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Solicitante</span>
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight truncate max-w-[150px]">{cliente_nome || 'Externo'}</span>
             </div>
          </div>

          {/* SLA */}
          <div className="flex items-center gap-2">
             <div className={cn(
               "w-8 h-8 rounded-xl flex items-center justify-center border shadow-sm",
               slaInfo.color
             )}>
                <Clock size={14} />
             </div>
             <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Prazo SLA</span>
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-tight",
                  slaInfo.status === 'vencido' ? "text-rose-600" : "text-slate-700"
                )}>{slaInfo.compactText || slaInfo.label}</span>
             </div>
          </div>

          {/* Origem */}
          {origem && (
            <div className="flex items-center gap-2">
               <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shadow-sm">
                  {origem === 'email' ? <Mail size={14} /> : <Globe size={14} />}
               </div>
               <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Canal</span>
                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{origem}</span>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ticketStatusColors: Record<TicketStatus, string> = {
  aberto: "bg-blue-100 border-blue-200 text-blue-600",
  em_andamento: "bg-indigo-100 border-indigo-200 text-indigo-600",
  aguardando_cliente: "bg-amber-100 border-amber-200 text-amber-600",
  resolvido: "bg-emerald-100 border-emerald-200 text-emerald-600",
  fechado: "bg-slate-200 border-slate-300 text-slate-600",
};
