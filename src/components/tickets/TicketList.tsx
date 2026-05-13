import React from 'react';
import { Ticket } from '../../types';
import { MessageSquare, ChevronRight, User as UserIcon, Tag, Search, Clock, ShieldAlert } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { cn, formatRelativeTime, getSlaInfo } from '../../lib/utils';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface TicketListProps {
  tickets: Ticket[];
  onSelectTicket: (id: number) => void;
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

export const TicketList = ({ 
  tickets, onSelectTicket, searchTerm, hasFilters, meta, 
  onPageChange, selectedTicketIds = [], onSelectionChange, canSelectBulk 
}: TicketListProps) => {

  const getPriorityInfo = (prio: string) => {
    switch (prio) {
      case 'urgente': return { color: 'text-red-600 bg-red-50 border-red-100', label: 'Urgente' };
      case 'alta': return { color: 'text-orange-600 bg-orange-50 border-orange-100', label: 'Alta' };
      case 'media': return { color: 'text-amber-600 bg-amber-50 border-amber-100', label: 'Média' };
      case 'baixa': return { color: 'text-blue-600 bg-blue-50 border-blue-100', label: 'Baixa' };
      default: return { color: 'text-slate-500 bg-slate-50 border-slate-200', label: prio };
    }
  };

  const statusColors: Record<string, string> = {
    aberto: 'text-blue-600 bg-blue-50 border-blue-100',
    em_andamento: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    aguardando_cliente: 'text-amber-600 bg-amber-50 border-amber-100',
    resolvido: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    fechado: 'text-slate-500 bg-slate-50 border-slate-200'
  };

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

  const toggleSelectTicket = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
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
        <div className="p-20 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mb-6 border border-slate-100/50">
            <Search size={32} />
          </div>
          {hasFilters ? (
            <>
              <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">Nenhum resultado</h4>
              <p className="text-sm text-slate-500 max-w-[300px] mx-auto mt-2 font-medium">Ajuste os filtros ou tente outro termo de busca para encontrar o que precisa.</p>
            </>
          ) : (
            <>
              <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">Fila vazia</h4>
              <p className="text-sm text-slate-500 max-w-[300px] mx-auto mt-2 font-medium">Não há atendimentos registrados nesta visualização.</p>
            </>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              {canSelectBulk && (
                <th className="w-10 px-5 py-4">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    onChange={toggleSelectAll}
                    checked={isAllSelected}
                  />
                </th>
              )}
              <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Atendimento</th>
              <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hidden md:table-cell">Solicitante</th>
              <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hidden sm:table-cell">Status</th>
              <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hidden lg:table-cell">Prioridade</th>
              <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hidden xl:table-cell">SLA</th>
              <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Responsável</th>
              <th className="w-10 px-5 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tickets.map((ticket) => {
              const sla = getSlaInfo(ticket.prazo_sla, ticket.status);
              const isAbertoESemResp = ticket.status === 'aberto' && !ticket.responsavel_id;
              const isSelected = selectedTicketIds.includes(ticket.id);
              const priority = getPriorityInfo(ticket.prioridade);

              return (
              <tr 
                key={ticket.id}
                onClick={() => onSelectTicket(ticket.id)}
                className={cn(
                  "group hover:bg-slate-50/80 transition-all cursor-pointer relative",
                  isSelected && "bg-blue-50/30 hover:bg-blue-50/50",
                  sla.status === 'vencido' && "bg-red-50/10 hover:bg-red-50/20"
                )}
              >
                {canSelectBulk && (
                  <td className="px-5 py-4">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      checked={isSelected}
                      onClick={(e) => toggleSelectTicket(e, ticket.id)}
                      onChange={() => {}}
                    />
                  </td>
                )}
                <td className="px-5 py-4">
                  <div className="flex flex-col gap-1 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-blue-600 tracking-tighter bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100/50">#{ticket.id}</span>
                      {isAbertoESemResp && (
                        <span className="text-[9px] font-black text-amber-600 uppercase tracking-tighter">Novo</span>
                      )}
                      <span className="text-xs font-bold text-slate-700 truncate group-hover:text-blue-700 transition-colors">{ticket.titulo}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight flex items-center gap-1">
                        <Clock size={10} className="text-slate-300" /> {formatRelativeTime(ticket.updated_at)}
                      </span>
                      {ticket.tags && ticket.tags.length > 0 && (
                        <div className="flex gap-1">
                          {ticket.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="text-[8px] font-black text-slate-400 border border-slate-100 rounded px-1 uppercase">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 hidden md:table-cell">
                  <div className="flex flex-col gap-1 min-w-[120px]">
                    <span className="text-xs font-bold text-slate-700 truncate">{ticket.cliente_nome || 'Solicitante'}</span>
                    <span className="text-[10px] font-bold text-slate-400 truncate opacity-80">{ticket.empresa_nome}</span>
                  </div>
                </td>
                <td className="px-5 py-4 hidden sm:table-cell">
                   <div className={cn(
                     "inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                     statusColors[ticket.status]
                   )}>
                     {ticket.status.replace('_', ' ')}
                   </div>
                </td>
                <td className="px-5 py-4 hidden lg:table-cell">
                   <div className={cn(
                     "inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border",
                     priority.color
                   )}>
                     {priority.label}
                   </div>
                </td>
                <td className="px-5 py-4 hidden xl:table-cell">
                   <div className={cn(
                     "inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-black uppercase tracking-tight",
                     sla.color
                   )}>
                     <Clock size={12} />
                     {sla.remainingText || sla.label}
                   </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    {ticket.responsavel_id ? (
                      <>
                        <div className="w-6 h-6 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center text-[10px] font-black text-blue-700 uppercase">
                          {ticket.responsavel_nome?.[0]}
                        </div>
                        <span className="text-xs font-bold text-slate-700 truncate hidden xl:inline">
                          {ticket.responsavel_nome?.split(' ')[0]}
                        </span>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5 text-amber-600">
                        <ShieldAlert size={14} />
                        <span className="text-[10px] font-black uppercase tracking-tight">Pendente</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-blue-600 hover:text-white transition-all transform translate-x-2 group-hover:translate-x-0">
                    <ChevronRight size={18} />
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/30">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Página {meta.page} / {meta.totalPages}</span>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 px-4 font-black uppercase text-[10px] tracking-widest border-slate-200"
              disabled={meta.page <= 1} 
              onClick={(e) => { e.stopPropagation(); onPageChange?.(meta.page - 1); }}
            >
              Anterior
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 px-4 font-black uppercase text-[10px] tracking-widest border-slate-200"
              disabled={meta.page >= meta.totalPages} 
              onClick={(e) => { e.stopPropagation(); onPageChange?.(meta.page + 1); }}
            >
              Próximo
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
