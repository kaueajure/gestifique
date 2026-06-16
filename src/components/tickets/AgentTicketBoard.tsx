import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Clock, Loader2, Mail, Search, UserRound } from 'lucide-react';
import { Ticket, TicketPriority, TicketStatus, User } from '../../types';
import { api } from '../../lib/api';
import { cn, getSlaInfo } from '../../lib/utils';

interface TeamMember extends Pick<User, 'id' | 'nome' | 'email' | 'cargo'> {
  ticket_count?: number;
}

interface AgentTicketBoardProps {
  currentUser: User;
  devCompanyId?: string;
  onSelectTicket: (id: number) => void;
  filters: {
    searchTerm?: string;
    status?: string;
    prioridade?: string;
    categoria?: string;
    servico?: string;
  };
}

const priorityColors: Record<TicketPriority, string> = {
  baixa: 'bg-blue-400',
  media: 'bg-yellow-400',
  alta: 'bg-orange-500',
  urgente: 'bg-red-500',
};

const statusLabels: Record<TicketStatus, string> = {
  aberto: 'Aberto',
  em_andamento: 'Em andamento',
  aguardando_cliente: 'Aguardando cliente',
  resolvido: 'Resolvido',
  fechado: 'Fechado',
};

const getTicketsFromResponse = (response: any): Ticket[] => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

export const AgentTicketBoard = ({
  currentUser,
  devCompanyId,
  onSelectTicket,
  filters,
}: AgentTicketBoardProps) => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [ticketsByAgent, setTicketsByAgent] = useState<Record<number, Ticket[]>>({});
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [loadingTicketsFor, setLoadingTicketsFor] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canLoad = !currentUser.desenvolvedor || !!devCompanyId;

  useEffect(() => {
    const fetchTeam = async () => {
      if (!canLoad) {
        setTeam([]);
        setLoadingTeam(false);
        return;
      }

      try {
        setLoadingTeam(true);
        setError(null);
        const endpoint = currentUser.desenvolvedor && devCompanyId
          ? `/users/team?empresa_id=${devCompanyId}`
          : '/users/team';
        const data = await api.get<TeamMember[]>(endpoint);
        setTeam(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao carregar atendentes.';
        setError(message);
      } finally {
        setLoadingTeam(false);
      }
    };

    fetchTeam();
  }, [canLoad, currentUser.desenvolvedor, devCompanyId]);

  useEffect(() => {
    setTicketsByAgent({});
    setExpandedId(null);
  }, [filters.searchTerm, filters.status, filters.prioridade, filters.categoria, filters.servico, devCompanyId]);

  const sortedTeam = useMemo(
    () => [...team].sort((a, b) => (b.ticket_count || 0) - (a.ticket_count || 0) || a.nome.localeCompare(b.nome)),
    [team]
  );

  const buildTicketQuery = (agentId: number) => {
    const query = new URLSearchParams();
    query.append('responsavel_id', String(agentId));
    query.append('page', '1');
    query.append('limit', '100');

    if (currentUser.desenvolvedor && devCompanyId) query.append('empresa_id', devCompanyId);
    if (filters.searchTerm) query.append('search', filters.searchTerm);
    if (filters.status && filters.status !== 'todos') query.append('status', filters.status);
    if (filters.prioridade && filters.prioridade !== 'todas') query.append('prioridade', filters.prioridade);
    if (filters.categoria && filters.categoria !== 'todas') query.append('categoria', filters.categoria);
    if (filters.servico && filters.servico !== 'todos') query.append('servico', filters.servico);

    return query;
  };

  const toggleAgent = async (agentId: number) => {
    if (expandedId === agentId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(agentId);
    if (ticketsByAgent[agentId]) return;

    try {
      setLoadingTicketsFor(agentId);
      const response = await api.get(`/tickets?${buildTicketQuery(agentId).toString()}`);
      setTicketsByAgent(prev => ({ ...prev, [agentId]: getTicketsFromResponse(response) }));
    } catch (err) {
      console.error('Erro ao carregar tickets do atendente:', err);
      setTicketsByAgent(prev => ({ ...prev, [agentId]: [] }));
    } finally {
      setLoadingTicketsFor(null);
    }
  };

  if (!canLoad) {
    return (
      <div className="flex h-full items-center justify-center bg-white p-8 text-center">
        <div>
          <UserRound className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <h3 className="text-sm font-semibold text-slate-900">Selecione uma empresa</h3>
          <p className="mt-1 text-xs text-slate-500">Escolha a empresa para visualizar os atendentes.</p>
        </div>
      </div>
    );
  }

  if (loadingTeam) {
    return (
      <div className="flex h-full items-center justify-center bg-white">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          Carregando atendentes...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-white p-8 text-center">
        <div className="rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
          {error}
        </div>
      </div>
    );
  }

  if (sortedTeam.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-white p-8 text-center">
        <div>
          <UserRound className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <h3 className="text-sm font-semibold text-slate-900">Nenhum atendente encontrado</h3>
          <p className="mt-1 text-xs text-slate-500">Não há usuários ativos nesta empresa.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-white p-3 custom-scrollbar sm:p-4">
      <div className="min-w-[980px] space-y-2">
        {sortedTeam.map(member => {
          const isOpen = expandedId === member.id;
          const tickets = ticketsByAgent[member.id] || [];
          const isLoadingTickets = loadingTicketsFor === member.id;

          return (
            <section key={member.id} className="rounded-md border border-transparent">
              <button
                type="button"
                onClick={() => toggleAgent(member.id)}
                className="flex items-center gap-2 rounded-md px-1 py-1 text-left transition-colors hover:bg-slate-50"
              >
                <span className="text-sm font-semibold text-slate-800">
                  {member.nome}
                </span>
                <span className="text-sm font-semibold text-slate-500">
                  {member.ticket_count || 0}
                </span>
                <ChevronDown
                  size={15}
                  className={cn('text-slate-500 transition-transform', isOpen && 'rotate-180')}
                />
              </button>

              {isOpen && (
                <div className="mt-2 grid grid-cols-10 gap-1.5">
                  {Array.from({ length: 10 }).map((_, index) => {
                    const ticket = tickets[index];

                    if (isLoadingTickets) {
                      return (
                        <div key={`loading-${index}`} className="h-[104px] rounded bg-slate-100" />
                      );
                    }

                    if (!ticket) {
                      return (
                        <div key={`empty-${index}`} className="h-[104px] rounded bg-slate-100" />
                      );
                    }

                    const sla = getSlaInfo(ticket.prazo_sla, ticket.status, ticket.sla_status_operacional);
                    const priorityColor = priorityColors[ticket.prioridade] || 'bg-slate-300';

                    return (
                      <button
                        key={ticket.id}
                        type="button"
                        onClick={() => onSelectTicket(ticket.id)}
                        className="group relative h-[104px] overflow-hidden rounded border border-slate-200 bg-white p-2 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                      >
                        <div className={cn('absolute bottom-0 left-0 top-0 w-1', priorityColor)} />
                        <div className="absolute right-2 top-2 h-3.5 w-3.5 rounded bg-yellow-300" />

                        <div className="pl-1.5 pr-4">
                          <div className="mb-1 flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-slate-800">{ticket.id}</span>
                            {ticket.origem === 'email' && <Mail size={11} className="text-slate-400" />}
                          </div>

                          <h4 className="line-clamp-3 text-[11px] font-medium leading-snug text-slate-700 group-hover:text-blue-700">
                            {ticket.titulo || 'Sem título'}
                          </h4>

                          <div className="mt-2 space-y-0.5">
                            <p className="truncate text-[10px] text-slate-500">
                              {ticket.empresa_nome || 'Empresa'} &gt; {ticket.cliente_nome || 'Cliente'}
                            </p>
                            <p className="truncate text-[10px] text-slate-500">
                              {member.nome}
                            </p>
                          </div>
                        </div>

                        <div className="absolute bottom-1.5 right-2 flex items-center gap-1 text-[9px] font-medium text-slate-400">
                          <Clock size={9} />
                          <span className="max-w-[52px] truncate">{sla.compactText || statusLabels[ticket.status]}</span>
                        </div>
                      </button>
                    );
                  })}

                  {!isLoadingTickets && tickets.length === 0 && (
                    <div className="col-span-10 flex h-[104px] items-center justify-center rounded bg-slate-50 text-xs font-medium text-slate-400">
                      Nenhum ticket direcionado para este atendente.
                    </div>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
};
