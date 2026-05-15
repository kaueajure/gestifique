import React from 'react';
import { Ticket, User } from '../../types';
import { 
  MessageSquare, 
  ChevronRight, 
  User as UserIcon, 
  Tag, 
  Search, 
  Clock, 
  ShieldAlert, 
  UserPlus, 
  Play, 
  Copy, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  History,
  Mail
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { cn, formatRelativeTime, getSlaInfo, getFirstResponseSlaInfo } from '../../lib/utils';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';

interface TicketListProps {
  tickets: Ticket[];
  onSelectTicket: (id: number) => void;
  currentUser: User;
  onStatusChange: () => void;
  searchTerm?: string;
  hasFilters?: boolean;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange?: (page: number) => void;
  selectedTicketIds?: number[];
  onSelectionChange?: (ids: number[]) => void;
  canSelectBulk?: boolean;
}

type SortKey = 'id' | 'updated_at' | 'prioridade' | 'status' | 'titulo';
type SortOrder = 'asc' | 'desc';

export const TicketList = ({ 
  tickets, onSelectTicket, currentUser, onStatusChange, searchTerm, hasFilters, meta, 
  onPageChange, selectedTicketIds = [], onSelectionChange, canSelectBulk 
}: TicketListProps) => {

  const [sortKey, setSortKey] = React.useState<SortKey>('updated_at');
  const [sortOrder, setSortOrder] = React.useState<SortOrder>('desc');

  const canManage = !!(currentUser.administrador || currentUser.desenvolvedor);

  const handleAssumirTicket = async (e: React.MouseEvent, ticketId: number) => {
    e.stopPropagation();
    try {
      await api.patch(`/tickets/${ticketId}`, { responsavel_id: currentUser.id });
      onStatusChange();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleMudarStatus = async (e: React.MouseEvent, ticketId: number, status: string) => {
    e.stopPropagation();
    try {
      await api.patch(`/tickets/${ticketId}/status`, { status });
      onStatusChange();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleCopyId = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id.toString());
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const sortedTickets = [...tickets].sort((a, b) => {
    let valA: any = a[sortKey as keyof Ticket];
    let valB: any = b[sortKey as keyof Ticket];
    
    if (sortKey === 'updated_at' || sortKey === 'id') {
      valA = valA ? (typeof valA === 'string' ? new Date(valA).getTime() : valA) : 0;
      valB = valB ? (typeof valB === 'string' ? new Date(valB).getTime() : valB) : 0;
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const getPriorityInfo = (prio: string) => {
    switch (prio) {
      case 'urgente': return { color: 'text-red-600 bg-red-50 border-red-100', label: 'URG' };
      case 'alta': return { color: 'text-orange-600 bg-orange-50 border-orange-100', label: 'ALTA' };
      case 'media': return { color: 'text-amber-600 bg-amber-50 border-amber-100', label: 'MÉD' };
      case 'baixa': return { color: 'text-blue-600 bg-blue-50 border-blue-100', label: 'BAIX' };
      default: return { color: 'text-slate-500 bg-slate-50 border-slate-200', label: prio.substring(0, 4).toUpperCase() };
    }
  };

  const getEstadoAtendimentoInfo = (estado?: string) => {
    switch (estado) {
      case 'cliente_respondeu':
        return { 
          label: 'Cliente respondeu', 
          color: 'bg-blue-600 text-white border-blue-700 shadow-sm',
          dot: 'bg-blue-100'
        };
      case 'aguardando_cliente':
        return { 
          label: 'Aguardando cliente', 
          color: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500'
        };
      case 'atendente_respondeu':
        return { 
          label: 'Atendente respondeu', 
          color: 'bg-slate-50 text-slate-500 border-slate-200',
          dot: 'bg-slate-300'
        };
      case 'sem_resposta':
        return { 
          label: 'Sem resposta', 
          color: 'bg-rose-50 text-rose-600 border-rose-100',
          dot: 'bg-rose-500'
        };
      default:
        return null;
    }
  };

  const statusColors: Record<string, string> = {
    aberto: 'text-blue-600 bg-blue-50 border-blue-100',
    em_andamento: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    aguardando_cliente: 'text-amber-600 bg-amber-50 border-amber-100',
    resolvido: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    fechado: 'text-slate-500 bg-slate-50 border-slate-200'
  };

  const SortHeader = ({ label, k, className }: { label: string, k: SortKey, className?: string }) => (
    <th 
      className={cn("px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-700 transition-colors group/th", className)}
      onClick={() => handleSort(k)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortKey === k ? (
          sortOrder === 'asc' ? <ArrowUp size={10} className="text-blue-500" /> : <ArrowDown size={10} className="text-blue-500" />
        ) : (
          <ArrowUpDown size={10} className="text-slate-300 opacity-0 group-hover/th:opacity-100 transition-opacity" />
        )}
      </div>
    </th>
  );

  const currentPageIds = tickets.map(t => t.id);
  const selectedOnPage = currentPageIds.filter(id => selectedTicketIds.includes(id));
  const isAllSelected = tickets.length > 0 && selectedOnPage.length === tickets.length;

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onSelectionChange) return;
    if (e.target.checked) {
      const newSelections = [...new Set([...selectedTicketIds, ...currentPageIds])];
      onSelectionChange(newSelections);
    } else {
      const newSelections = selectedTicketIds.filter(id => !currentPageIds.includes(id));
      onSelectionChange(newSelections);
    }
  };

  const toggleSelectTicket = (id: number) => {
    if (!onSelectionChange) return;
    if (selectedTicketIds.includes(id)) {
      onSelectionChange(selectedTicketIds.filter(tid => tid !== id));
    } else {
      onSelectionChange([...selectedTicketIds, id]);
    }
  };

  if (tickets.length === 0) {
    return (
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <div className="p-12 text-center flex flex-col items-center">
          <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-xl flex items-center justify-center mb-4 border border-slate-100/50">
            <Search size={24} />
          </div>
          {hasFilters ? (
            <>
              <h4 className="text-base font-black text-slate-800 uppercase tracking-tight">Nenhum resultado</h4>
              <p className="text-[11px] text-slate-500 max-w-[300px] mx-auto mt-1 font-medium">Ajuste os filtros ou tente outro termo de busca.</p>
            </>
          ) : (
            <>
              <h4 className="text-base font-black text-slate-800 uppercase tracking-tight">Fila vazia</h4>
              <p className="text-[11px] text-slate-500 max-w-[300px] mx-auto mt-1 font-medium">Não há atendimentos registrados nesta visualização.</p>
            </>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-slate-200 shadow-xl shadow-slate-200/50 bg-white rounded-2xl">
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100">
              {canSelectBulk && (
                <th className="w-10 px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center">
                  <input 
                    type="checkbox" 
                    className="w-3.5 h-3.5 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500/20 cursor-pointer shadow-sm"
                    onChange={toggleSelectAll}
                    checked={isAllSelected}
                  />
                </th>
              )}
              <SortHeader label="Atendimento" k="titulo" className="w-[300px]" />
              <th className="w-[140px] px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Situação</th>
              <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 hidden md:table-cell">Cliente</th>
              <SortHeader label="Status" k="status" className="w-[120px]" />
              <SortHeader label="Prioridade" k="prioridade" className="w-[100px] text-center" />
              <th className="w-[100px] px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 hidden xl:table-cell text-center">SLA</th>
              <th className="w-[140px] px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Responsável</th>
              <th className="w-[50px] px-3 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedTickets.map((ticket) => {
              const sla = getSlaInfo(ticket.prazo_sla, ticket.status);
              const isAbertoESemResp = ticket.status === 'aberto' && !ticket.responsavel_id;
              const isSelected = selectedTicketIds.includes(ticket.id);
              const priority = getPriorityInfo(ticket.prioridade);
              const estadoInfo = getEstadoAtendimentoInfo(ticket.estado_atendimento);

              const needsAgentAction = ticket.status === 'aberto' || ticket.status === 'em_andamento';
              const needsClientAction = ticket.status === 'aguardando_cliente';

              return (
                <tr 
                  key={ticket.id}
                  onClick={() => onSelectTicket(ticket.id)}
                  className={cn(
                    "group transition-all cursor-pointer relative",
                    isSelected ? "bg-blue-50/50" : "hover:bg-slate-50/40",
                    sla.status === 'vencido' && !isSelected && "bg-rose-50/10 hover:bg-rose-50/30",
                    ticket.nao_lido && "font-bold"
                  )}
                >
                  {canSelectBulk && (
                  <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      className="w-3.5 h-3.5 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500/20 cursor-pointer shadow-sm"
                      checked={isSelected}
                      onChange={() => toggleSelectTicket(ticket.id)}
                    />
                  </td>
                )}
                <td className="px-3 py-2">
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      {ticket.nao_lido && (
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" title="Mensagem não lida" />
                      )}
                      <span className="text-[10px] font-bold text-blue-600 tracking-wider shrink-0 bg-blue-50 px-1 rounded border border-blue-100">#{ticket.id}</span>
                      
                      {ticket.origem === 'email' && (
                        <div className="flex items-center gap-1 text-[9px] font-semibold text-blue-500 bg-blue-50/50 px-1 rounded border border-blue-100 tracking-wider" title="Origem: E-mail">
                          <Mail size={10} />
                        </div>
                      )}
                      
                      <span className="text-xs font-semibold text-slate-800 truncate group-hover:text-blue-700 transition-colors tracking-tight">{ticket.titulo}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Clock size={10} /> {formatRelativeTime(ticket.updated_at)}
                      </span>
                      
                      {isAbertoESemResp && (
                        <span className="text-[9px] font-semibold text-white bg-amber-500 px-1.5 rounded-md border border-amber-500 tracking-wider shadow-sm shadow-amber-200">Novo</span>
                      )}
                      
                      {ticket.estado_atendimento === 'cliente_respondeu' && (
                        <span className="text-[9px] font-semibold text-white bg-emerald-500 px-1.5 rounded-md border border-emerald-500 tracking-wider shadow-sm shadow-emerald-200">Resposta</span>
                      )}

                      {ticket.tags && ticket.tags.length > 0 && (
                        <div className="flex gap-1">
                          {ticket.tags.slice(0, 2).map(tag => (
                             <span key={tag} className="text-[9px] font-medium text-slate-500 bg-slate-100 border border-slate-200 rounded px-1">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2">
                  {estadoInfo ? (
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border transition-all text-[9px] font-bold uppercase tracking-wider",
                      estadoInfo.color
                    )}>
                      <div className={cn("w-1 h-1 rounded-full", estadoInfo.dot)} />
                      <span className="whitespace-nowrap">{estadoInfo.label}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">Nenhuma</span>
                  )}
                </td>
                <td className="px-3 py-2 hidden md:table-cell">
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-semibold text-slate-700 truncate">{ticket.cliente_nome || 'N/A'}</span>
                    <span className="text-[9px] text-slate-500 truncate">{ticket.empresa_nome}</span>
                  </div>
                </td>
                <td className="px-3 py-2">
                   <div className={cn(
                     "inline-flex px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border",
                     statusColors[ticket.status]
                   )}>
                     {ticket.status.replace('_', ' ')}
                   </div>
                </td>
                <td className="px-3 py-2 text-center">
                   <div className={cn(
                     "inline-flex px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border",
                     priority.color
                   )}>
                     {priority.label}
                   </div>
                </td>
                <td className="px-3 py-2 hidden xl:table-cell">
                   <div className="flex flex-col gap-1 items-center">
                     <div className={cn(
                       "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-wider",
                       sla.color
                     )} title={`Resolução: ${sla.label}`}>
                       <Clock size={10} />
                       {sla.compactText || sla.label}
                     </div>
                     {!ticket.primeira_resposta_em && ticket.prazo_primeira_resposta && (
                       <div className={cn(
                         "inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[8px] font-bold tracking-wider",
                         getFirstResponseSlaInfo(ticket).color
                       )} title={`Primeira Resposta: ${getFirstResponseSlaInfo(ticket).label}`}>
                         PR: {getFirstResponseSlaInfo(ticket).compactText}
                       </div>
                     )}
                   </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {ticket.responsavel_id ? (
                      <>
                        <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 shrink-0">
                          {ticket.responsavel_nome?.[0]}
                        </div>
                        <div className="flex flex-col min-w-0">
                           <span className="text-[10px] font-semibold text-slate-700 truncate">
                             {ticket.responsavel_nome?.split(' ')[0]}
                           </span>
                           {needsAgentAction && ticket.responsavel_id === currentUser.id && (
                             <span className="text-[8px] font-bold text-blue-600 uppercase tracking-widest animate-pulse">Sua vez</span>
                           )}
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-1 text-amber-600">
                        <ShieldAlert size={12} />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Pendente</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex items-center justify-end">
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all">
                      {canManage && isAbertoESemResp && (
                        <button onClick={(e) => handleAssumirTicket(e, ticket.id)} title="Assumir" className="w-7 h-7 flex items-center justify-center hover:bg-blue-600 hover:text-white text-blue-600 border border-transparent hover:border-blue-700 rounded transition-all">
                          <UserPlus size={12} />
                        </button>
                      )}
                      {canManage && ticket.status === 'aberto' && ticket.responsavel_id === currentUser.id && (
                        <button onClick={(e) => handleMudarStatus(e, ticket.id, 'em_andamento')} title="Iniciar" className="w-7 h-7 flex items-center justify-center hover:bg-indigo-600 hover:text-white text-indigo-600 border border-transparent hover:border-indigo-700 rounded transition-all">
                          <Play size={12} />
                        </button>
                      )}
                      <button onClick={(e) => handleCopyId(e, ticket.id)} title="Copiar ID" className="w-7 h-7 flex items-center justify-center hover:bg-slate-200 text-slate-400 border border-transparent rounded transition-all">
                        <Copy size={12} />
                      </button>
                    </div>
                    <div className="p-1 text-slate-300 group-hover:text-blue-600 transition-colors group-hover:translate-x-1 duration-200">
                       <ChevronRight size={14} />
                    </div>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 bg-slate-50/20">
          <div className="flex items-center gap-4">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Página {meta.page} / {meta.totalPages}</span>
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{meta.total} Tickets</span>
          </div>
          <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 px-2 font-black uppercase text-[8px] tracking-widest border-slate-200 bg-white"
              disabled={meta.page <= 1} 
              onClick={() => onPageChange?.(meta.page - 1)}
            >
              Anterior
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 px-2 font-black uppercase text-[8px] tracking-widest border-slate-200 bg-white"
              disabled={meta.page >= meta.totalPages} 
              onClick={() => onPageChange?.(meta.page + 1)}
            >
              Próximo
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
