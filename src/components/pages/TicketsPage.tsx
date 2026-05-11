import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Ticket, User, TicketListResponse, TicketKanbanResponse, TicketStatus, TicketPriority } from '../../types';
import { 
  Plus, 
  Loader2,
  Kanban,
  List as ListIcon,
  RefreshCw
} from 'lucide-react';
import { Button } from '../ui/Button';
import { TicketFilters } from '../tickets/TicketFilters';
import { TicketSummaryCards } from '../tickets/TicketSummaryCards';
import { TicketList } from '../tickets/TicketList';
import { TicketKanban } from '../tickets/TicketKanban';
import { CreateTicketModal } from '../tickets/CreateTicketModal';
import { TeamSidebar } from '../tickets/TeamSidebar';

interface TicketsPageProps {
  onSelectTicket: (id: number) => void;
  currentUser: User;
}

export const TicketsPage = ({ onSelectTicket, currentUser }: TicketsPageProps) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  const [ticketsResponse, setTicketsResponse] = useState<TicketListResponse | null>(null);
  const [kanbanResponse, setKanbanResponse] = useState<TicketKanbanResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [priorityFilter, setPriorityFilter] = useState('todas');
  const [categoryFilter, setCategoryFilter] = useState('todas');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      if (searchTerm) query.append('search', searchTerm);
      if (statusFilter !== 'todos') query.append('status', statusFilter);
      if (priorityFilter !== 'todas') query.append('prioridade', priorityFilter);
      if (categoryFilter !== 'todas') query.append('categoria', categoryFilter);

      if (viewMode === 'list') {
        query.append('page', currentPage.toString());
        query.append('limit', '15');
        // Compatibility check in case the backend hasn't been reloaded yet to return the new format
        const response = await api.get(`/tickets?${query.toString()}`);
        if (Array.isArray(response)) {
            setTicketsResponse({
                data: response as Ticket[],
                meta: { page: 1, limit: 15, total: response.length, totalPages: 1 },
                summary: { total: 0, aberto: 0, em_andamento:0, aguardando_cliente: 0, resolvido: 0, fechado: 0 }
            });
        } else {
            setTicketsResponse(response as TicketListResponse);
        }
      } else {
        query.append('limit', '100'); // Limit for Kanban API
        const kanbanData = await api.get<TicketKanbanResponse>(`/tickets/kanban?${query.toString()}`);
        setKanbanResponse(kanbanData);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar atendimentos.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, priorityFilter, categoryFilter, viewMode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, priorityFilter, categoryFilter, viewMode, currentPage]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Central de Atendimentos</h2>
          <p className="text-sm text-slate-500 font-medium tracking-tight">Acompanhe, priorize e resolva chamados da operação.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 bg-white" onClick={fetchData}>
            <RefreshCw size={16} className={loading ? "animate-spin text-blue-600" : "text-slate-600"} />
          </Button>
          <div className="bg-slate-100 p-0.5 rounded-lg flex items-center border border-slate-200 mr-2">
             <button 
               onClick={() => setViewMode('kanban')}
               className={`p-1.5 rounded-md text-slate-500 hover:text-slate-900 transition-all ${viewMode === 'kanban' ? 'bg-white shadow-sm font-semibold text-blue-600' : ''}`}
               title="Visualização Kanban"
             >
                <Kanban size={16} />
             </button>
             <button 
               onClick={() => setViewMode('list')}
               className={`p-1.5 rounded-md text-slate-500 hover:text-slate-900 transition-all ${viewMode === 'list' ? 'bg-white shadow-sm font-semibold text-blue-600' : ''}`}
               title="Visualização em Lista"
             >
                <ListIcon size={16} />
             </button>
          </div>
          <Button size="sm" className="h-9" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} className="mr-2" /> Novo Atendimento
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 w-full space-y-6">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <TicketFilters 
              searchTerm={searchTerm} setSearchTerm={setSearchTerm}
              statusFilter={statusFilter} setStatusFilter={setStatusFilter}
              priorityFilter={priorityFilter} setPriorityFilter={setPriorityFilter}
              categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter}
            />
          </div>

          {viewMode === 'list' && ticketsResponse && <TicketSummaryCards summary={ticketsResponse.summary} />}
          {viewMode === 'kanban' && kanbanResponse && <TicketSummaryCards summary={kanbanResponse.totals} />}

          {loading && (!kanbanResponse && !ticketsResponse) ? (
            <div className="p-20 flex flex-col items-center justify-center space-y-3 bg-white rounded-xl border border-slate-200">
               <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
               <p className="text-xs text-slate-500 font-bold tracking-tight uppercase">Carregando...</p>
            </div>
          ) : error ? (
            <div className="p-10 bg-red-50 border border-red-100 text-red-600 text-center rounded-xl text-sm font-semibold">
               {error}
            </div>
          ) : viewMode === 'kanban' && kanbanResponse ? (
            <TicketKanban kanbanData={kanbanResponse} onSelectTicket={onSelectTicket} currentUser={currentUser} onStatusChange={() => fetchData()} />
          ) : viewMode === 'list' && ticketsResponse ? (
            <TicketList 
              tickets={ticketsResponse.data} 
              meta={ticketsResponse.meta}
              onPageChange={setCurrentPage}
              onSelectTicket={onSelectTicket} 
              searchTerm={searchTerm} 
              hasFilters={searchTerm !== '' || statusFilter !== 'todos' || priorityFilter !== 'todas' || categoryFilter !== 'todas'} 
            />
          ) : null}
        </div>
        
        <TeamSidebar currentUser={currentUser} />
      </div>

      <CreateTicketModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        currentUser={currentUser} 
        onSuccess={() => {
           setIsModalOpen(false);
           fetchData();
        }}
      />
    </div>
  );
};
