import React from 'react';
import { Ticket } from '../../types';
import { MessageSquare, ChevronRight, User as UserIcon, Tag, Search, Clock, ShieldAlert } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { cn, formatRelativeTime } from '../../lib/utils';
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

  const statusMap: Record<string, 'blue' | 'emerald' | 'amber' | 'red' | 'indigo' | 'slate'> = {
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

  const currentPageIds = tickets.map(t => t.id);
  const selectedOnPage = currentPageIds.filter(id => selectedTicketIds.includes(id));
  const isAllSelected = tickets.length > 0 && selectedOnPage.length === tickets.length;

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onSelectionChange) return;
    if (e.target.checked) {
      // Add all current page IDs that are not already selected
      const newSelections = [...new Set([...selectedTicketIds, ...currentPageIds])];
      onSelectionChange(newSelections);
    } else {
      // Remove current page IDs from selection
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
      <Card className="overflow-hidden">
        <div className="p-20 text-center flex flex-col items-center">
          <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-xl flex items-center justify-center mb-4 border border-slate-100">
            <Search size={24} />
          </div>
          {hasFilters ? (
            <>
              <h4 className="text-sm font-semibold text-slate-900">Nenhum resultado encontrado</h4>
              <p className="text-xs text-slate-500 max-w-[200px] mx-auto">Ajuste os filtros ou tente outro termo de busca.</p>
            </>
          ) : (
            <>
              <h4 className="text-sm font-semibold text-slate-900">Nenhum atendimento criado</h4>
              <p className="text-xs text-slate-500 max-w-[200px] mx-auto">Crie o primeiro atendimento para começar a organizar as solicitações.</p>
            </>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {canSelectBulk && (
        <div className="px-5 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
           <input 
             type="checkbox" 
             className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
             onChange={toggleSelectAll}
             checked={isAllSelected}
           />
           <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Selecionar Todos</span>
        </div>
      )}
      <div className="divide-y divide-slate-100">
        {tickets.map((ticket) => {
          const prazoSLA = ticket.prazo_sla ? new Date(ticket.prazo_sla) : null;
          const isFinalizado = ticket.status === 'resolvido' || ticket.status === 'fechado';
          const isAbertoESemResp = ticket.status === 'aberto' && !ticket.responsavel_id;
          const isSelected = selectedTicketIds.includes(ticket.id);
          let slaStatus: 'normal' | 'warning' | 'expired' = 'normal';

          if (prazoSLA && !isFinalizado) {
            const now = new Date();
            const diffHours = (prazoSLA.getTime() - now.getTime()) / (1000 * 60 * 60);
            if (diffHours < 0) slaStatus = 'expired';
            else if (diffHours <= 2) slaStatus = 'warning';
          }

          return (
          <div 
            key={ticket.id}
            onClick={() => onSelectTicket(ticket.id)}
            className={cn(
              "p-3 px-5 flex flex-col sm:items-center sm:flex-row gap-3 transition-colors cursor-pointer group",
              isSelected ? "bg-blue-50/50 hover:bg-blue-50 border-l-2 border-l-blue-500" :
              slaStatus === 'expired' ? "bg-red-50/50 hover:bg-red-50 border-l-2 border-l-red-500" : 
              slaStatus === 'warning' ? "bg-yellow-50/50 hover:bg-yellow-50 border-l-2 border-l-yellow-400" :
              isAbertoESemResp ? "bg-amber-50/30 hover:bg-amber-50/50 border-l-2 border-l-amber-300" :
              "hover:bg-slate-50/50 border-l-2 border-l-transparent"
            )}
          >
            <div className="flex items-center gap-3">
              {canSelectBulk && (
                 <input 
                   type="checkbox" 
                   className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                   checked={isSelected}
                   onClick={(e) => toggleSelectTicket(e, ticket.id)}
                   onChange={() => {}}
                 />
              )}
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center border transition-colors shadow-sm bg-white shrink-0",
                ticket.status === 'resolvido' ? "text-emerald-500 border-emerald-100" : 
                isAbertoESemResp ? "text-amber-500 border-amber-100" :
                "text-slate-400 group-hover:text-blue-600 border-slate-100 group-hover:border-blue-100"
              )}>
                {isAbertoESemResp ? <ShieldAlert size={14} /> : <MessageSquare size={14} />}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <span className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-700 transition-colors leading-tight">{ticket.titulo}</span>
                <Badge variant={statusMap[ticket.status || 'aberto']} className="text-[9px] py-0 px-1.5 font-bold uppercase tracking-tighter">{(ticket.status || 'aberto').replace('_', ' ')}</Badge>
                {slaStatus === 'expired' && (
                  <span className="text-[8px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-sm uppercase tracking-tight animate-pulse border border-red-200">
                    SLA Vencido
                  </span>
                )}
                {slaStatus === 'warning' && (
                  <span className="text-[8px] font-bold bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-sm uppercase tracking-tight border border-yellow-200">
                    Vence em breve
                  </span>
                )}
                {isAbertoESemResp && (
                  <span className="text-[8px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-sm uppercase tracking-tight border border-amber-200">
                    Aguardando Atribuição
                  </span>
                )}
                {/* Tags displayed discreetly */}
                <div className="flex gap-1 ml-1">
                  {ticket.tags?.slice(0, 3).map(tag => (
                    <span key={tag} className="text-[8px] font-bold text-slate-400 border border-slate-200 rounded px-1 group-hover:border-slate-300 group-hover:text-slate-500 transition-colors">{tag}</span>
                  ))}
                  {ticket.tags && ticket.tags.length > 3 && <span className="text-[8px] text-slate-400 mt-0.5">+{ticket.tags.length - 3}</span>}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-bold text-slate-400">
                <span className="text-blue-600 tracking-tighter">#{ticket.id}</span>
                <span className="flex items-center gap-1.5 tracking-tight uppercase"><UserIcon size={10} className="text-slate-300" /> {ticket.cliente_nome || 'Usuário'}</span>
                <span className="flex items-center gap-1.5 tracking-tight uppercase italic"><Tag size={10} className="text-slate-300" /> {(ticket.categoria || 'suporte').replace('_', ' ')}</span>
                <span className="flex items-center gap-1.5 tracking-tight uppercase"><Clock size={10} className="text-slate-300" title="Última atividade" /> {formatRelativeTime(ticket.updated_at)}</span>
                {ticket.responsavel_nome && ticket.responsavel_nome !== 'Não Atribuído' ? (
                   <span className="flex items-center gap-1.5 tracking-tight uppercase text-indigo-500 font-bold"><UserIcon size={10} className="text-indigo-300" /> {ticket.responsavel_nome}</span>
                ) : (
                   <span className="flex items-center gap-1.5 tracking-tight uppercase text-amber-600 italic font-medium">Sem responsável</span>
                )}
                {ticket.empresa_nome && (
                   <span className="flex items-center gap-1.5 tracking-tight uppercase text-rose-500 min-w-max ml-auto">{ticket.empresa_nome}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 ml-auto sm:ml-0 shrink-0">
              <Badge variant={getPriorityVariant(ticket.prioridade || 'media')} className="font-bold uppercase text-[9px] px-1.5 py-0 tracking-widest border-none">
                {ticket.prioridade || 'media'}
              </Badge>
              <div className="h-7 w-7 rounded-lg border border-slate-100 flex items-center justify-center text-slate-300 opacity-40 group-hover:opacity-100 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all">
                <ChevronRight size={14} />
              </div>
            </div>
          </div>
        );
      })}
      </div>
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
          <span className="text-xs text-slate-500 font-medium">Página {meta.page} de {meta.totalPages}</span>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8"
              disabled={meta.page <= 1} 
              onClick={(e) => { e.stopPropagation(); onPageChange?.(meta.page - 1); }}
            >
              Anterior
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8"
              disabled={meta.page >= meta.totalPages} 
              onClick={(e) => { e.stopPropagation(); onPageChange?.(meta.page + 1); }}
            >
              Seguinte
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
