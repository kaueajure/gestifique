import React from 'react';
import { Ticket } from '../../types';
import { MessageSquare, ChevronRight, User as UserIcon, Tag, Calendar, Search } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';
import { Card } from '../ui/Card';

interface TicketListProps {
  tickets: Ticket[];
  onSelectTicket: (id: number) => void;
  searchTerm?: string;
  hasFilters?: boolean;
}

export const TicketList = ({ tickets, onSelectTicket, searchTerm, hasFilters }: TicketListProps) => {

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
      <div className="divide-y divide-slate-100">
        {tickets.map((ticket) => (
          <div 
            key={ticket.id}
            onClick={() => onSelectTicket(ticket.id)}
            className="p-3 px-5 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-slate-50/50 transition-colors cursor-pointer group"
          >
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center border transition-colors shadow-sm bg-white shrink-0",
              ticket.status === 'resolvido' ? "text-emerald-500 border-emerald-50" : "text-slate-400 group-hover:text-blue-600 border-slate-100 group-hover:border-blue-100"
            )}>
              <MessageSquare size={14} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <span className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-700 transition-colors leading-tight">{ticket.titulo}</span>
                <Badge variant={statusMap[ticket.status || 'aberto']} className="text-[9px] py-0 px-1.5 font-bold uppercase tracking-tighter">{(ticket.status || 'aberto').replace('_', ' ')}</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-bold text-slate-400">
                <span className="text-blue-600 tracking-tighter">#{ticket.id}</span>
                <span className="flex items-center gap-1.5 tracking-tight uppercase"><UserIcon size={10} className="text-slate-300" /> {ticket.cliente_nome || 'Usuário'}</span>
                <span className="flex items-center gap-1.5 tracking-tight uppercase italic"><Tag size={10} className="text-slate-300" /> {(ticket.categoria || 'suporte').replace('_', ' ')}</span>
                <span className="flex items-center gap-1.5 tracking-tight uppercase"><Calendar size={10} className="text-slate-300" /> {new Date(ticket.created_at).toLocaleDateString()}</span>
                {ticket.responsavel_nome && (
                   <span className="flex items-center gap-1.5 tracking-tight uppercase text-indigo-500"><UserIcon size={10} className="text-indigo-300" /> {ticket.responsavel_nome}</span>
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
        ))}
      </div>
    </Card>
  );
};
