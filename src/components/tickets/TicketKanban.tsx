import React, { useState } from 'react';
import { TicketKanbanColumn, TicketKanbanResponse, User } from '../../types';
import { Badge } from '../ui/Badge';
import { MessageSquare, User as UserIcon, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { api } from '../../lib/api';

interface TicketKanbanProps {
  kanbanData: TicketKanbanResponse;
  onSelectTicket: (id: number) => void;
  currentUser: User;
  onStatusChange: () => void;
}

export const TicketKanban = ({ kanbanData, onSelectTicket, currentUser, onStatusChange }: TicketKanbanProps) => {

  const canManage = currentUser.administrador || currentUser.desenvolvedor;

  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleStatusChange = async (ticketId: number, e: React.ChangeEvent<HTMLSelectElement>, currentStatus: string) => {
    e.stopPropagation();
    const newStatus = e.target.value;
    if (newStatus === currentStatus) return;

    setUpdatingId(ticketId);
    setErrorMsg(null);
    try {
      await api.patch(`/tickets/${ticketId}/status`, { status: newStatus });
      onStatusChange();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao atualizar status do ticket.');
    } finally {
      setUpdatingId(null);
    }
  };

  const statusMap: Record<string, string> = {
    aberto: 'blue',
    em_andamento: 'indigo',
    aguardando_cliente: 'amber',
    resolvido: 'emerald',
    fechado: 'slate'
  };

  const getPriorityVariant = (prio: string): 'red' | 'orange' | 'amber' | 'blue' | 'slate' => {
    switch (prio) {
      case 'urgente': return 'red';
      case 'alta': return 'orange';
      case 'media': return 'amber';
      case 'baixa': return 'blue';
      default: return 'slate';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-xs font-bold shrink-0 mx-2">
          <AlertCircle size={14} /> {errorMsg}
        </div>
      )}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-2 -mx-2 px-2 snap-x items-start">
        {kanbanData.columns.map(column => (
          <div key={column.id} className="w-[300px] shrink-0 bg-slate-50/50 rounded-xl p-3 border border-slate-200/60 snap-center flex flex-col max-h-full">
             <div className="flex items-center justify-between mb-3 px-1">
               <h3 className="font-bold text-sm text-slate-700 tracking-tight">{column.title}</h3>
               <Badge variant={statusMap[column.id] as any} className="text-[10px] bg-white bg-opacity-100 shadow-sm px-2">
                 {column.count}
               </Badge>
             </div>
             
             <div className="flex flex-col gap-3 flex-1 overflow-y-auto custom-scrollbar pr-1 pb-1">
               {column.tickets.map(ticket => (
                 <div 
                   key={ticket.id} 
                   onClick={() => onSelectTicket(ticket.id)}
                   className={cn(
                     "bg-white rounded-lg p-3 shadow-sm border border-slate-200 cursor-pointer hover:shadow-md transition-all group relative shrink-0",
                     updatingId === ticket.id && "opacity-50 pointer-events-none"
                   )}
                 >
                   {updatingId === ticket.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10 rounded-lg">
                         <Loader2 className="animate-spin text-blue-600" size={20} />
                      </div>
                   )}
                   <div className="flex items-start justify-between gap-2 mb-2">
                     <div className="flex-1 min-w-0">
                       <span className="text-[10px] font-bold text-slate-400 tracking-tighter block mb-1">#{ticket.id}</span>
                       <h4 className="font-semibold text-sm leading-tight text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2">
                         {ticket.titulo}
                       </h4>
                     </div>
                     <Badge variant={getPriorityVariant(ticket.prioridade || 'media')} className="text-[9px] px-1 font-bold uppercase shrink-0">
                       {ticket.prioridade}
                     </Badge>
                   </div>
  
                   <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-slate-50">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                         <span className="flex items-center gap-1 min-w-0"><UserIcon size={10} className="shrink-0" /><span className="truncate">{ticket.cliente_nome?.split(' ')[0] || 'Usuário'}</span></span>
                         <span className="flex items-center gap-1 shrink-0"><Calendar size={10} />{new Date(ticket.created_at).toLocaleDateString()}</span>
                      </div>
                      {ticket.responsavel_nome && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 uppercase tracking-tight">
                           <UserIcon size={10} /> {ticket.responsavel_nome}
                        </div>
                      )}
                   </div>
  
                   {/* Ações Rápidas - visível mobile, tooltip/hover desktop */}
                   {canManage && (
                     <div className="mt-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                       <select 
                         value={ticket.status}
                         onChange={(e) => handleStatusChange(ticket.id, e, ticket.status)}
                         className="w-full text-[10px] font-bold text-slate-600 border border-slate-200 rounded p-1 bg-slate-50 uppercase tracking-tight outline-none focus:ring-2 focus:ring-blue-100"
                       >
                          <option value="aberto">Mover para Aberto</option>
                          <option value="em_andamento">Mover para Andamento</option>
                          <option value="aguardando_cliente">Mover para Aguardando</option>
                          <option value="resolvido">Mover para Resolvido</option>
                          <option value="fechado">Mover para Fechado</option>
                       </select>
                     </div>
                   )}
                 </div>
               ))}
               {column.tickets.length === 0 && (
                 <div className="flex-1 min-h-[100px] flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg p-4">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vazio</p>
                 </div>
               )}
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};
