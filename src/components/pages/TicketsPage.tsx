import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Ticket, User, TicketListResponse, TicketKanbanResponse, TicketStatus, Empresa } from '../../types';
import { 
  Plus, 
  Loader2,
  Kanban,
  List as ListIcon,
  RefreshCw,
  Building,
  Layers,
  User as UserIcon,
  UserMinus,
  AlertCircle,
  Clock,
  History,
  MessageSquare,
  Download
} from 'lucide-react';
import { Button } from '../ui/Button';
import { TicketFilters } from '../tickets/TicketFilters';
import { TicketSummaryCards } from '../tickets/TicketSummaryCards';
import { TicketList } from '../tickets/TicketList';
import { TicketKanban } from '../tickets/TicketKanban';
import { CreateTicketModal } from '../tickets/CreateTicketModal';
import { TeamSidebar } from '../tickets/TeamSidebar';
import { PageHeader } from '../ui/PageHeader';
import { TicketAdvancedFilters as IAdvancedFilters, TicketView } from '../../types';
import { TicketAdvancedFilters } from '../tickets/TicketAdvancedFilters';
import { TicketSavedViews } from '../tickets/TicketSavedViews';
import { TicketQueue } from '../../types';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';
import { TicketBulkActions } from '../tickets/TicketBulkActions';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TicketsPageProps {
  onSelectTicket: (id: number) => void;
  currentUser: User;
}

const QUEUES: { id: TicketQueue; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'todos', label: 'Todos', icon: Layers },
  { id: 'meus', label: 'Meus tickets', icon: UserIcon },
  { id: 'sem_responsavel', label: 'Sem resp.', icon: UserMinus },
  { id: 'urgentes', label: 'Urgentes', icon: AlertCircle },
  { id: 'sla_vencido', label: 'SLA vencido', icon: Clock },
  { id: 'vence_em_breve', label: 'Vence breve', icon: History },
  { id: 'aguardando_cliente', label: 'Aguardando', icon: MessageSquare },
];

const EMPTY_KANBAN_COLUMNS = [
  { id: 'aberto' as TicketStatus, title: 'Aberto', count: 0, tickets: [] },
  { id: 'em_andamento' as TicketStatus, title: 'Em andamento', count: 0, tickets: [] },
  { id: 'aguardando_cliente' as TicketStatus, title: 'Aguardando resposta', count: 0, tickets: [] },
  { id: 'resolvido' as TicketStatus, title: 'Finalizado', count: 0, tickets: [] }
];

const EMPTY_QUEUES = {
  todos: 0,
  meus: 0,
  sem_responsavel: 0,
  urgentes: 0,
  sla_vencido: 0,
  vence_em_breve: 0,
  aguardando_cliente: 0
};

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
  const [selectedQueue, setSelectedQueue] = useState<TicketQueue>('todos');
  
  // Advanced Filters
  const [advancedFilters, setAdvancedFilters] = useState<IAdvancedFilters>({
    sla_status: 'todos'
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showTeamSidebar, setShowTeamSidebar] = useState(false);

  // Saved Views
  const [savedViews, setSavedViews] = useState<TicketView[]>([]);
  const [currentViewId, setCurrentViewId] = useState<number | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [devCompanyId, setDevCompanyId] = useState<string>('');
  const [companies, setCompanies] = useState<Empresa[]>([]);
  const [agents, setAgents] = useState<User[]>([]);

  // Bulk Selection
  const [selectedTicketIds, setSelectedTicketIds] = useState<number[]>([]);

  useEffect(() => {
    if (!!(currentUser.administrador || currentUser.desenvolvedor)) {
      api.get<Empresa[]>('/companies').then(setCompanies).catch(console.error);
      
      // Fetch agents for bulk assignment
      api.get<User[]>('/users').then(users => {
        const filteredAgents = users.filter(u => 
          u.ativo && (u.administrador || u.cargo?.toLowerCase().includes('técnico') || u.cargo?.toLowerCase().includes('suporte'))
        );
        setAgents(filteredAgents);
      }).catch(console.error);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser.desenvolvedor) {
      if (devCompanyId) {
        fetchViews(devCompanyId);
      } else {
        setSavedViews([]);
      }
      setCurrentViewId(null);
    } else {
      fetchViews();
    }
  }, [currentUser, devCompanyId]);

  const fetchViews = async (empresaId?: string) => {
    try {
      const url = empresaId ? `/tickets/views?empresa_id=${empresaId}` : '/tickets/views';
      const views = await api.get<TicketView[]>(url);
      setSavedViews(views);
    } catch (err) {
      console.error('Erro ao carregar views:', err);
    }
  };

  const fetchData = async () => {
    if (!!currentUser.desenvolvedor && !devCompanyId) {
      setTicketsResponse({
        data: [],
        meta: { page: 1, limit: 15, total: 0, totalPages: 1 },
        summary: { total: 0, aberto: 0, em_andamento: 0, aguardando_cliente: 0, resolvido: 0, fechado: 0 },
        queues: EMPTY_QUEUES
      });
      setKanbanResponse({
        columns: EMPTY_KANBAN_COLUMNS,
        totals: { total: 0, aberto: 0, em_andamento: 0, aguardando_cliente: 0, resolvido: 0, fechado: 0 },
        queues: EMPTY_QUEUES
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      if (!!currentUser.desenvolvedor) query.append('empresa_id', devCompanyId);
      if (searchTerm) query.append('search', searchTerm);
      if (statusFilter !== 'todos') query.append('status', statusFilter);
      if (priorityFilter !== 'todas') query.append('prioridade', priorityFilter);
      if (categoryFilter !== 'todas') query.append('categoria', categoryFilter);
      if (selectedQueue !== 'todos') query.append('fila', selectedQueue);

      // Advanced Filters
      if (advancedFilters.responsavel_id) query.append('responsavel_id', advancedFilters.responsavel_id.toString());
      if (advancedFilters.tag) query.append('tag', advancedFilters.tag);
      if (advancedFilters.origem) query.append('origem', advancedFilters.origem);
      if (advancedFilters.created_from) query.append('created_from', advancedFilters.created_from);
      if (advancedFilters.created_to) query.append('created_to', advancedFilters.created_to);
      if (advancedFilters.updated_from) query.append('updated_from', advancedFilters.updated_from);
      if (advancedFilters.updated_to) query.append('updated_to', advancedFilters.updated_to);
      if (advancedFilters.sla_status && advancedFilters.sla_status !== 'todos') query.append('sla_status', advancedFilters.sla_status);
      if (advancedFilters.custom_field_search) query.append('custom_field_search', advancedFilters.custom_field_search);

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
      
      // Clear selection on refresh
      setSelectedTicketIds([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar atendimentos.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    setSelectedTicketIds([]);
  }, [searchTerm, statusFilter, priorityFilter, categoryFilter, viewMode, devCompanyId, selectedQueue, advancedFilters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, priorityFilter, categoryFilter, viewMode, currentPage, devCompanyId, selectedQueue, advancedFilters]);

  const handleBulkAction = async (action: string, value?: any) => {
    try {
      setLoading(true);
      const result: any = await api.patch('/tickets/bulk', {
        ticket_ids: selectedTicketIds,
        action,
        value
      });
      setSelectedTicketIds([]);
      fetchData();
      
      // Improved feedback
      const msg = `${result.updated} tickets atualizados. ${result.skipped} ignorados.`;
      if (result.errors && result.errors.length > 0) {
        console.warn('Erros na ação em massa:', result.errors);
      }
      alert(msg);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao processar ação em massa.';
      alert(message);
      setLoading(false);
    }
  };

  const handleSelectView = (view: TicketView | null) => {
    if (!view) {
      setCurrentViewId(null);
      // Reset filters (optional, but good for UX)
      setSearchTerm('');
      setStatusFilter('todos');
      setPriorityFilter('todas');
      setCategoryFilter('todas');
      setSelectedQueue('todos');
      setAdvancedFilters({ sla_status: 'todos' });
      return;
    }

    setCurrentViewId(view.id);
    const f = view.filtros_json;
    if (f.status) setStatusFilter(f.status);
    if (f.prioridade) setPriorityFilter(f.prioridade);
    if (f.categoria) setCategoryFilter(f.categoria);
    if (f.fila) setSelectedQueue(f.fila);
    if (f.search !== undefined) setSearchTerm(f.search);
    if (f.advanced) setAdvancedFilters(f.advanced);
    if (f.mode) setViewMode(f.mode);
  };

  const handleSaveView = async (nome: string) => {
    if (currentUser.desenvolvedor && !devCompanyId) {
      alert('Selecione uma empresa antes de salvar uma view.');
      return;
    }

    try {
      const filtros_json = {
        status: statusFilter as any,
        prioridade: priorityFilter as any,
        categoria: categoryFilter,
        fila: selectedQueue,
        search: searchTerm,
        advanced: advancedFilters,
        mode: viewMode
      };
      
      const empresa_id = currentUser.desenvolvedor ? Number(devCompanyId) : currentUser.empresa_id;

      const response = await api.post<{ id: number }>('/tickets/views', { 
        nome, 
        filtros_json,
        empresa_id
      });

      const newView: TicketView = {
        id: response.id,
        nome,
        filtros_json,
        empresa_id: empresa_id || 0,
        usuario_id: currentUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setSavedViews(prev => [...prev, newView]);
      setCurrentViewId(response.id);
      alert('View salva com sucesso!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar view';
      alert(message);
    }
  };

  const handleDeleteView = async (id: number) => {
    if (!confirm('Deseja excluir esta view?')) return;
    try {
      await api.delete(`/tickets/views/${id}`);
      setSavedViews(prev => prev.filter(v => v.id !== id));
      if (currentViewId === id) setCurrentViewId(null);
    } catch (err) {
      alert('Erro ao excluir view');
    }
  };
  const safeFormatDateTime = (value?: string | null) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (isNaN(date.getTime())) return 'N/A';
    return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
  };

  const exportToCSV = () => {
    const data = viewMode === 'list' 
      ? ticketsResponse?.data || [] 
      : (kanbanResponse?.columns || []).flatMap(c => c.tickets);

    if (data.length === 0) {
      alert('Nenhum dado para exportar');
      return;
    }

    const headers = [
      'ID', 'Título', 'Status', 'Prioridade', 'Categoria', 
      'Responsável', 'Solicitante', 'Empresa', 'Tags', 
      'Criado em', 'Atualizado em', 'Prazo SLA'
    ];

    const csvContent = [
      headers.join(';'),
      ...data.map(t => [
        t.id,
        `"${(t.titulo || '').replace(/"/g, '""')}"`,
        t.status || '',
        t.prioridade || '',
        t.categoria || '',
        t.responsavel_nome || 'N/A',
        t.cliente_nome || 'N/A',
        t.empresa_nome || 'N/A',
        `"${(t.tags || []).join(', ')}"`,
        safeFormatDateTime(t.created_at),
        safeFormatDateTime(t.updated_at),
        safeFormatDateTime(t.prazo_sla)
      ].join(';'))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `tickets_export_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasAdvancedFilters = Object.entries(advancedFilters).some(([key, value]) => {
    if (key === 'sla_status') return value && value !== 'todos';
    return value !== undefined && value !== null && value !== '';
  });

  const hasAnyFilters =
    searchTerm !== '' ||
    statusFilter !== 'todos' ||
    priorityFilter !== 'todas' ||
    categoryFilter !== 'todas' ||
    selectedQueue !== 'todos' ||
    hasAdvancedFilters;

  const queueCounts = viewMode === 'list' ? ticketsResponse?.queues : kanbanResponse?.queues;

  return (
    <div className="space-y-3">
      <PageHeader 
        title="Atendimentos" 
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 gap-2 bg-white text-slate-600 border-slate-200",
                showTeamSidebar && "bg-blue-50 border-blue-200 text-blue-600"
              )}
              onClick={() => setShowTeamSidebar(!showTeamSidebar)}
            >
              <UserIcon size={16} />
              <span className="hidden sm:inline">Equipe</span>
            </Button>
            {!!currentUser.desenvolvedor && (
              <div className="relative w-48">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <select 
                  value={devCompanyId}
                  onChange={(e) => setDevCompanyId(e.target.value)}
                  className="w-full h-9 bg-white border border-slate-200 rounded-lg pl-9 pr-3 text-[11px] font-bold uppercase tracking-tight outline-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none"
                >
                  <option value="">Empresa...</option>
                  {companies.map(emp => (
                     <option key={emp.id} value={emp.id}>{emp.nome}</option>
                  ))}
                </select>
              </div>
            )}
            <Button variant="outline" size="sm" className="h-9 w-9 p-0 bg-white" onClick={fetchData}>
              <RefreshCw size={16} className={loading ? "animate-spin text-blue-600" : "text-slate-600"} />
            </Button>
            <Button variant="outline" size="sm" className="h-9 gap-2 bg-white text-slate-600 border-slate-200" onClick={exportToCSV}>
              <Download size={16} />
              <span className="hidden sm:inline">CSV</span>
            </Button>
            <div className="bg-slate-100 p-0.5 rounded-lg flex items-center border border-slate-200">
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
              <Plus size={16} className="sm:mr-2" /> 
              <span className="hidden sm:inline">Novo Atendimento</span>
            </Button>
          </div>
        }
      />

      <div className="flex flex-col lg:flex-row gap-3 items-start">
        <div className="flex-1 w-full space-y-3">
          {/* Smart Queues Tabs - Compact */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
            {QUEUES.map((q) => {
              const Icon = q.icon;
              const isActive = selectedQueue === q.id;
              const count = queueCounts?.[q.id] || 0;

              return (
                <button
                  key={q.id}
                  onClick={() => setSelectedQueue(q.id)}
                  className={cn(
                    "relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border shrink-0",
                    isActive 
                      ? "bg-white border-blue-200 text-blue-600 shadow-sm ring-1 ring-blue-50" 
                      : "bg-slate-50/50 border-transparent text-slate-500 hover:bg-slate-100/80 hover:text-slate-700"
                  )}
                >
                  <Icon size={13} className={isActive ? "text-blue-500" : "text-slate-400"} />
                  <span>{q.label}</span>
                  {count > 0 && (
                    <span 
                      className={cn(
                        "ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] leading-none",
                        isActive ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-600"
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex flex-col xl:flex-row xl:items-center gap-3 p-2.5">
              <TicketSavedViews 
                views={savedViews}
                currentViewId={currentViewId}
                onSelectView={handleSelectView}
                onSaveCurrent={handleSaveView}
                onDeleteView={handleDeleteView}
              />
              
              <div className="hidden xl:block w-px h-6 bg-slate-100" />
              
              <div className="flex-1">
                <TicketFilters 
                  searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                  statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                  priorityFilter={priorityFilter} setPriorityFilter={setPriorityFilter}
                  categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter}
                  showAdvanced={showAdvanced}
                  onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
                  hasAdvancedFilters={hasAdvancedFilters}
                />
              </div>
            </div>
            
            <TicketAdvancedFilters 
              filters={advancedFilters}
              onFilterChange={setAdvancedFilters}
              onClear={() => setAdvancedFilters({ sla_status: 'todos' })}
              agents={agents}
              isOpen={showAdvanced}
            />
          </div>

          {viewMode === 'list' && ticketsResponse && <TicketSummaryCards summary={ticketsResponse.summary} />}
          {viewMode === 'kanban' && kanbanResponse && <TicketSummaryCards summary={kanbanResponse.totals} />}

          <div className={cn(
            "transition-all duration-300",
            viewMode === 'kanban' ? "h-[calc(100vh-220px)] min-h-[450px]" : ""
          )}>
            {!!currentUser.desenvolvedor && !devCompanyId ? (
              <div className="h-full flex flex-col items-center justify-center space-y-3 bg-white rounded-xl border border-slate-200 py-10">
                 <Building className="w-8 h-8 text-slate-300" />
                 <p className="text-sm text-slate-500 font-medium tracking-tight">Selecione uma empresa para visualizar atendimentos.</p>
              </div>
            ) : loading && (!kanbanResponse && !ticketsResponse) ? (
              <div className="h-full flex flex-col items-center justify-center space-y-3 bg-white rounded-xl border border-slate-200 py-10">
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
                hasFilters={hasAnyFilters}
                selectedTicketIds={selectedTicketIds}
                onSelectionChange={setSelectedTicketIds}
                canSelectBulk={!!(currentUser.administrador || currentUser.desenvolvedor)}
              />
            ) : null}
          </div>
        </div>
        
        {showTeamSidebar && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-full lg:w-64 shrink-0"
          >
            <TeamSidebar currentUser={currentUser} devCompanyId={devCompanyId} />
          </motion.div>
        )}
      </div>

      <TicketBulkActions 
        selectedCount={selectedTicketIds.length} 
        onAction={handleBulkAction}
        onClear={() => setSelectedTicketIds([])}
        agents={agents}
      />

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
