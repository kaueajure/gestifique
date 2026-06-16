import React, { useEffect, useMemo, useState } from 'react';
import { Ticket, TicketKanbanResponse, User } from '../../types';
import {
  AlertCircle,
  ChevronDown,
  Clock,
  Mail,
  ShieldAlert,
  UserRound
} from 'lucide-react';
import { cn, getSlaInfo } from '../../lib/utils';
import { getSocket } from '../../lib/socket';

interface TicketKanbanProps {
  kanbanData: TicketKanbanResponse;
  onSelectTicket: (id: number) => void;
  currentUser: User;
  onStatusChange: () => void;
}

interface ResponsibleGroup {
  key: string;
  id: number | null;
  name: string;
  tickets: Ticket[];
}

const priorityColors: Record<string, string> = {
  urgente: 'bg-red-500',
  alta: 'bg-orange-500',
  media: 'bg-yellow-400',
  baixa: 'bg-blue-500',
};

const getStatusDot = (status: string) =>
  cn(
    'h-1.5 w-1.5 rounded-full',
    status === 'aberto' && 'bg-blue-500',
    status === 'em_andamento' && 'bg-indigo-500',
    status === 'aguardando_cliente' && 'bg-amber-500',
    status === 'resolvido' && 'bg-emerald-500',
    status === 'fechado' && 'bg-slate-500'
  );

const groupTicketsByResponsible = (tickets: Ticket[]): ResponsibleGroup[] => {
  const grouped = tickets.reduce<Record<string, ResponsibleGroup>>((acc, ticket) => {
    const key = ticket.responsavel_id ? String(ticket.responsavel_id) : 'sem-responsavel';

    if (!acc[key]) {
      acc[key] = {
        key,
        id: ticket.responsavel_id,
        name: ticket.responsavel_nome || 'Sem responsável',
        tickets: [],
      };
    }

    acc[key].tickets.push(ticket);
    return acc;
  }, {});

  return Object.values(grouped).sort((a, b) => {
    if (a.id === null && b.id !== null) return -1;
    if (a.id !== null && b.id === null) return 1;
    return b.tickets.length - a.tickets.length || a.name.localeCompare(b.name);
  });
};

export const TicketKanban = ({ kanbanData, onSelectTicket, currentUser }: TicketKanbanProps) => {
  const [localData, setLocalData] = useState<TicketKanbanResponse>(kanbanData);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setLocalData(kanbanData);
    setExpandedGroups({});
  }, [kanbanData]);

  useEffect(() => {
    if (!currentUser?.empresa_id) return;
    
    const socket = getSocket(currentUser.empresa_id);

    const handleTicketUpdated = (updatedTicket: Ticket) => {
      setLocalData(currentData => {
        const newColumns = currentData.columns.map(col => ({
          ...col,
          tickets: col.tickets.filter(t => t.id !== updatedTicket.id),
        }));

        const targetColIndex = newColumns.findIndex(c => c.id === updatedTicket.status);
        if (targetColIndex !== -1) {
          newColumns[targetColIndex].tickets.unshift(updatedTicket);
        }

        newColumns.forEach(column => {
          column.count = column.tickets.length;
        });

        return { ...currentData, columns: newColumns };
      });
    };

    const handleTicketCreated = (newTicket: Ticket) => {
      setLocalData(currentData => {
        if (currentData.columns.some(column => column.tickets.some(ticket => ticket.id === newTicket.id))) {
          return currentData;
        }

        const newColumns = currentData.columns.map(column => ({ ...column, tickets: [...column.tickets] }));
        const targetColIndex = newColumns.findIndex(c => c.id === newTicket.status);

        if (targetColIndex !== -1) {
          newColumns[targetColIndex].tickets.unshift(newTicket);
          newColumns[targetColIndex].count = newColumns[targetColIndex].tickets.length;
        }

        return { ...currentData, columns: newColumns };
      });
    };

    socket.on('ticketUpdated', handleTicketUpdated);
    socket.on('ticketCreated', handleTicketCreated);

    return () => {
      socket.off('ticketUpdated', handleTicketUpdated);
      socket.off('ticketCreated', handleTicketCreated);
    };
  }, [currentUser]);

  const groupedColumns = useMemo(
    () => localData.columns.map(column => ({
      ...column,
      responsibleGroups: groupTicketsByResponsible(column.tickets),
    })),
    [localData.columns]
  );

  const toggleGroup = (columnId: string, groupKey: string) => {
    const key = `${columnId}:${groupKey}`;
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-200/60 bg-slate-50/50">
      {errorMsg && (
        <div className="mx-2 mt-2 flex items-center gap-2 rounded-md border border-red-100 bg-red-50 p-2 text-[10px] font-semibold text-red-600">
          <AlertCircle size={12} /> {errorMsg}
        </div>
      )}

      <div className="flex h-full gap-2 overflow-x-auto p-3 no-scrollbar">
        {groupedColumns.map(column => (
          <div key={column.id} className="flex h-full w-[280px] shrink-0 flex-col">
            <div className="mb-2 flex shrink-0 items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <div className={getStatusDot(column.id)} />
                <h3 className="text-xs font-semibold text-slate-700">{column.title}</h3>
              </div>
              <span className="rounded-sm bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                {column.count}
              </span>
            </div>

            <div className="flex flex-1 flex-col gap-2 overflow-y-auto pb-8 no-scrollbar">
              {column.responsibleGroups.map(group => {
                const expandKey = `${column.id}:${group.key}`;
                const isExpanded = !!expandedGroups[expandKey];
                const hasUnread = group.tickets.some(ticket => ticket.nao_lido);

                return (
                  <section
                    key={group.key}
                    className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => toggleGroup(column.id, group.key)}
                      className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-slate-50"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <div className={cn(
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
                          group.id ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-600'
                        )}>
                          {group.id ? group.name.charAt(0).toUpperCase() : <ShieldAlert size={13} />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-xs font-semibold text-slate-800">{group.name}</p>
                            {hasUnread && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                          </div>
                          <p className="text-[10px] font-medium text-slate-400">
                            {group.tickets.length} {group.tickets.length === 1 ? 'ticket' : 'tickets'}
                          </p>
                        </div>
                      </div>

                      <ChevronDown
                        size={14}
                        className={cn('shrink-0 text-slate-400 transition-transform', isExpanded && 'rotate-180')}
                      />
                    </button>

                    {isExpanded && (
                      <div className="space-y-1.5 border-t border-slate-100 bg-slate-50/60 p-2">
                        {group.tickets.map(ticket => {
                          const sla = getSlaInfo(ticket.prazo_sla, ticket.status, ticket.sla_status_operacional);
                          const priorityColor = priorityColors[ticket.prioridade] || 'bg-slate-300';

                          return (
                            <button
                              key={ticket.id}
                              type="button"
                              onClick={() => onSelectTicket(ticket.id)}
                              className="group relative w-full overflow-hidden rounded border border-slate-200 bg-white p-2 text-left shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
                            >
                              <div className={cn('absolute bottom-0 left-0 top-0 w-[3px]', priorityColor)} />

                              <div className="flex items-start justify-between gap-2 pl-1.5">
                                <div className="min-w-0">
                                  <div className="mb-1 flex items-center gap-1.5">
                                    <span className="text-[10px] font-semibold text-slate-500">#{ticket.id}</span>
                                    {ticket.origem === 'email' && <Mail size={11} className="text-slate-400" />}
                                    {ticket.nao_lido && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                                  </div>
                                  <h4 className="line-clamp-2 text-[12px] font-medium leading-snug text-slate-800 group-hover:text-blue-700">
                                    {ticket.titulo || 'Sem título'}
                                  </h4>
                                </div>

                                <div className={cn('flex shrink-0 items-center gap-1 rounded-sm px-1.5 py-0.5 text-[9px]', sla.color)}>
                                  <Clock size={10} />
                                  {sla.compactText || sla.label}
                                </div>
                              </div>

                              <div className="mt-2 flex items-center gap-1.5 pl-1.5 text-[10px] text-slate-500">
                                <UserRound size={10} className="shrink-0 text-slate-400" />
                                <span className="truncate">{ticket.cliente_nome || 'Cliente'}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              })}

              {column.responsibleGroups.length === 0 && (
                <div className="mt-1 flex h-10 items-center justify-center rounded border border-dashed border-slate-200 text-[10px] text-slate-400">
                  Vazio
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
