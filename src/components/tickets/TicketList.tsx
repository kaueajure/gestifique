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
  History
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { cn, formatRelativeTime, getSlaInfo } from '../../lib/utils';
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

  const statusColors: Record<string, string> = {
    aberto: 'text-blue-600 bg-blue-50 border-blue-100',
    em_andamento: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    aguardando_cliente: 'text-amber-600 bg-amber-50 border-amber-100',
    resolvido: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    fechado: 'text-slate-500 bg-slate-50 border-slate-200'
  };

  const SortHeader = ({ label, k, className }: { label: string, k: SortKey, className?: string }) => (
    <th 
      className={cn("px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-600 transition-colors group/th", className)}
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
    <Card className="overflow-hidden border-slate-200 shadow-sm bg-white">
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              {canSelectBulk && (
                <th className="w-8 px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">
                  <input 
                    type="checkbox" 
                    className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    onChange={toggleSelectAll}
                    checked={isAllSelected}
                  />
                </th>
              )}
              <SortHeader label="Atendimento" k="titulo" className="w-[300px]" />
              <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hidden md:table-cell">Solicitante</th>
              <SortHeader label="Status" k="status" className="w-[120px]" />
              <SortHeader label="Prioridade" k="prioridade" className="w-[100px] text-center justify-center" />
              <th className="w-[90px] px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hidden xl:table-cell text-center">SLA</th>
              <th className="w-[140px] px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-400">Responsável</th>
              <th className="w-[90px] px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sortedTickets.map((ticket) => {
              const sla = getSlaInfo(ticket.prazo_sla, ticket.status);
              const isAbertoESemResp = ticket.status === 'aberto' && !ticket.responsavel_id;
              const isSelected = selectedTicketIds.includes(ticket.id);
              const priority = getPriorityInfo(ticket.prioridade);

              const needsAgentAction = ticket.status === 'aberto' || ticket.status === 'em_andamento';
              const needsClientAction = ticket.status === 'aguardando_cliente';

              return (
              <tr 
                key={ticket.id}
                onClick={() => onSelectTicket(ticket.id)}
                className={cn(
                  "group hover:bg-slate-50/60 transition-all cursor-pointer relative",
                  isSelected && "bg-blue-50/30",
                  sla.status === 'vencido' && "bg-red-50/10 hover:bg-red-50/30"
                )}
              >
                {canSelectBulk && (
                  <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      checked={isSelected}
                      onChange={() => toggleSelectTicket(ticket.id)}
                    />
                  </td>
                )}
                <td className="px-3 py-2">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[9px] font-black text-blue-600 tracking-tighter bg-blue-50/50 px-1 py-0.5 rounded border border-blue-100/30">#{ticket.id}</span>
                      {isAbertoESemResp && (
                        <span className="text-[8px] font-black text-white bg-amber-500 px-1 rounded border border-amber-500 uppercase tracking-tighter">Novo</span>
                      )}
                      {needsAgentAction && ticket.responsavel_id === currentUser.id && (
                        <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-1 rounded border border-blue-100 uppercase tracking-tighter shrink-0">Sua Vez</span>
                      )}
                      <span className="text-[11px] font-bold text-slate-700 truncate group-hover:text-blue-700 transition-colors uppercase">{ticket.titulo}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight flex items-center gap-1">
                        <Clock size={8} className="text-slate-300" /> {formatRelativeTime(ticket.updated_at).replace('há ', '')}
                      </span>
                      {needsClientAction && (
                        <span className="text-[8px] font-bold text-amber-600 uppercase tracking-tighter flex items-center gap-1 shrink-0">
                          <History size={8} /> Aguard. Cliente
                        </span>
                      )}
                      {ticket.tags && ticket.tags.length > 0 && (
                        <div className="flex gap-0.5">
                          {ticket.tags.slice(0, 1).map(tag => (
                            <span key={tag} className="text-[8px] font-black text-slate-300 bg-slate-50/50 border border-slate-100/50 rounded px-1 uppercase tracking-tighter">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2 hidden md:table-cell">
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-slate-600 truncate uppercase">{ticket.cliente_nome?.split(' ')[0] || 'Cliente'}</span>
                    <span className="text-[9px] font-bold text-slate-400 truncate opacity-70 uppercase">{ticket.empresa_nome}</span>
                  </div>
                </td>
                <td className="px-3 py-2 hidden sm:table-cell">
                   <div className={cn(
                     "inline-flex px-1.5 py-px rounded-full text-[8px] font-black uppercase tracking-widest border",
                     statusColors[ticket.status]
                   )}>
                     {ticket.status.replace('_', ' ')}
                   </div>
                </td>
                <td className="px-3 py-2 hidden lg:table-cell text-center">
                   <div className={cn(
                     "inline-flex px-1.5 py-px rounded-[4px] text-[8px] font-black uppercase tracking-widest border",
                     priority.color
                   )}>
                     {priority.label}
                   </div>
                </td>
                <td className="px-3 py-2 hidden xl:table-cell text-center">
                   <div className={cn(
                     "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] border text-[8px] font-black uppercase tracking-tighter",
                     sla.color
                   )}>
                     <Clock size={8} />
                     {sla.compactText || sla.label}
                   </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    {ticket.responsavel_id ? (
                      <>
                        <div className="w-5 h-5 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-[8px] font-black text-blue-700 uppercase">
                          {ticket.responsavel_nome?.[0]}
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 truncate hidden xl:inline uppercase">
                          {ticket.responsavel_nome?.split(' ')[0]}
                        </span>
                      </>
                    ) : (
                      <div className="flex items-center gap-1 text-amber-500">
                        <ShieldAlert size={10} />
                        <span className="text-[8px] font-black uppercase tracking-tighter opacity-80">Pendente</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      {canManage && isAbertoESemResp && (
                        <button onClick={(e) => handleAssumirTicket(e, ticket.id)} title="Assumir" className="p-1 hover:bg-blue-50 text-blue-600 rounded">
                          <UserPlus size={12} />
                        </button>
                      )}
                      {canManage && ticket.status === 'aberto' && ticket.responsavel_id === currentUser.id && (
                        <button onClick={(e) => handleMudarStatus(e, ticket.id, 'em_andamento')} title="Iniciar" className="p-1 hover:bg-indigo-50 text-indigo-600 rounded">
                          <Play size={12} />
                        </button>
                      )}
                      <button onClick={(e) => handleCopyId(e, ticket.id)} title="Copiar ID" className="p-1 hover:bg-slate-50 text-slate-400 rounded">
                        <Copy size={12} />
                      </button>
                    </div>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors ml-1" />
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
