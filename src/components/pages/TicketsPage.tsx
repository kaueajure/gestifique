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
import { Select } from '../ui/Select';
import { TicketQueue } from '../../types';
import { cn } from '../../lib/utils';
import { FilterChip } from '../ui/FilterChip';
import { motion, AnimatePresence } from 'motion/react';
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
  { id: 'precisa_resposta', label: 'Precisa resposta', icon: AlertCircle },
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
  aguardando_cliente: 0,
  precisa_resposta: 0
};

export const TicketsPage = ({ onSelectTicket, currentUser }: TicketsPageProps) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  const [ticketsResponse, setTicketsResponse] = useState<TicketListResponse | null>(null);
  const [kanbanResponse, setKanbanResponse] = useState<TicketKanbanResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' | 'info' }[]>([]);
  
  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };
  
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
      const msg = `${result.updated} tickets atualizados.`;
      if (result.errors && result.errors.length > 0) {
        console.warn('Erros na ação em massa:', result.errors);
        addToast(`${msg} Alguns erros ocorreram.`, 'error');
      } else {
        addToast(msg, 'success');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao processar ação em massa.';
      addToast(message, 'error');
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
      addToast('Selecione uma empresa antes de salvar uma view.', 'error');
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
      addToast('Visualização salva com sucesso!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar view';
      addToast(message, 'error');
    }
  };

  const handleDeleteView = async (id: number) => {
    if (!confirm('Deseja excluir esta view?')) return;
    try {
      await api.delete(`/tickets/views/${id}`);
      setSavedViews(prev => prev.filter(v => v.id !== id));
      if (currentViewId === id) setCurrentViewId(null);
      addToast('Visualização excluída.');
    } catch (err) {
      addToast('Erro ao excluir view', 'error');
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
      addToast('Nenhum dado para exportar', 'info');
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
    addToast('Arquivo exportado!');
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

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('todos');
    setPriorityFilter('todas');
    setCategoryFilter('todas');
    setSelectedQueue('todos');
    setAdvancedFilters({ sla_status: 'todos' });
    setCurrentViewId(null);
  };

  const removeFilter = (key: string) => {
    if (key === 'search') setSearchTerm('');
    else if (key === 'status') setStatusFilter('todos');
    else if (key === 'priority') setPriorityFilter('todas');
    else if (key === 'category') setCategoryFilter('todas');
    else if (key === 'queue') setSelectedQueue('todos');
    else if (key.startsWith('adv:')) {
      const advKey = key.replace('adv:', '') as keyof IAdvancedFilters;
      setAdvancedFilters(prev => ({ ...prev, [advKey]: undefined }));
    }
  };

  const getActiveFilterChips = () => {
    const chips: { id: string; label: string; value: string }[] = [];
    
    if (searchTerm) chips.push({ id: 'search', label: 'Busca', value: searchTerm });
    if (statusFilter !== 'todos') chips.push({ id: 'status', label: 'Status', value: statusFilter.replace('_', ' ') });
    if (priorityFilter !== 'todas') chips.push({ id: 'priority', label: 'Prioridade', value: priorityFilter });
    if (categoryFilter !== 'todas') chips.push({ id: 'category', label: 'Categoria', value: categoryFilter.replace('_', ' ') });
    if (selectedQueue !== 'todos') {
      const queueLabel = QUEUES.find(q => q.id === selectedQueue)?.label || selectedQueue;
      chips.push({ id: 'queue', label: 'Fila', value: queueLabel });
    }

    if (advancedFilters.sla_status && advancedFilters.sla_status !== 'todos') {
      chips.push({ id: 'adv:sla_status', label: 'SLA', value: advancedFilters.sla_status.replace('_', ' ') });
    }
    if (advancedFilters.tag) chips.push({ id: 'adv:tag', label: 'Tag', value: advancedFilters.tag });
    if (advancedFilters.origem) chips.push({ id: 'adv:origem', label: 'Origem', value: advancedFilters.origem });
    if (advancedFilters.responsavel_id) {
      const agent = agents.find(a => a.id === advancedFilters.responsavel_id);
      chips.push({ id: 'adv:responsavel_id', label: 'Responsável', value: agent?.nome || String(advancedFilters.responsavel_id) });
    }

    return chips;
  };

  const queueCounts = viewMode === 'list' ? ticketsResponse?.queues : kanbanResponse?.queues;

  return (
    <div className="space-y-3">
      {/* Toast System */}
      <div className="fixed bottom-6 right-6 z-[10000] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={cn(
                "px-4 py-2.5 rounded-xl shadow-2xl border text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 pointer-events-auto",
                toast.type === 'success' && "bg-emerald-600 border-emerald-500 text-white",
                toast.type === 'error' && "bg-red-600 border-red-500 text-white",
                toast.type === 'info' && "bg-blue-600 border-blue-500 text-white"
              )}
            >
              <AlertCircle size={14} />
              <span>{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <PageHeader 
        title="Atendimentos" 
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {!!currentUser.desenvolvedor && (
              <div className="relative w-40 sm:w-48">
                <Building className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={12} />
                <Select 
                  value={devCompanyId}
                  onChange={setDevCompanyId}
                  placeholder="Empresa..."
                  buttonClassName="pl-8 h-8 text-[11px] font-bold uppercase tracking-tight"
                  options={[
                    { value: '', label: 'Selecione a empresa' },
                    ...companies.map(emp => ({
                      value: String(emp.id),
                      label: emp.nome
                    }))
                  ]}
                />
              </div>
            )}

            <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
              <button 
                onClick={() => setViewMode('kanban')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all",
                  viewMode === 'kanban' ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                <Kanban size={14} />
                <span className="hidden sm:inline">Kanban</span>
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all",
                  viewMode === 'list' ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                <ListIcon size={14} />
                <span className="hidden sm:inline">Lista</span>
              </button>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-8 w-8 p-0 bg-white border-slate-200 text-slate-500 hover:bg-slate-50",
                  showTeamSidebar && "bg-blue-50 border-blue-200 text-blue-600"
                )}
                onClick={() => setShowTeamSidebar(!showTeamSidebar)}
                title="Equipe"
              >
                <UserIcon size={16} />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0 bg-white border-slate-200 text-slate-500 hover:bg-slate-50" 
                onClick={fetchData}
                title="Atualizar"
              >
                <RefreshCw size={14} className={loading ? "animate-spin text-blue-600" : ""} />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0 bg-white border-slate-200 text-slate-500 hover:bg-slate-50" 
                onClick={exportToCSV}
                title="Exportar CSV"
              >
                <Download size={14} />
              </Button>
            </div>

            <Button className="h-8 pr-4 shadow-lg shadow-blue-100" onClick={() => setIsModalOpen(true)}>
              <Plus size={16} className="mr-1.5" /> 
              <span className="text-[11px] font-bold uppercase tracking-tight">Novo Atendimento</span>
            </Button>
          </div>
        }
      />

      <div className="flex flex-col lg:flex-row gap-3 items-start">
        <div className="flex-1 w-full space-y-2">
          {/* Smart Queues Tabs - More Compact Refined */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
            {QUEUES.map((q) => {
              const Icon = q.icon;
              const isActive = selectedQueue === q.id;
              const count = queueCounts?.[q.id] || 0;
              
              // Special colors for critical queues
              const isUrgent = q.id === 'urgentes' || q.id === 'sla_vencido';
              const isWarning = q.id === 'sem_responsavel' || q.id === 'vence_em_breve';
              const isInfo = q.id === 'precisa_resposta';

              return (
                <button
                  key={q.id}
                  onClick={() => setSelectedQueue(q.id)}
                  className={cn(
                    "relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all border shrink-0",
                    isActive 
                      ? "bg-blue-600 border-blue-600 text-white shadow-md translate-y-[-1px]" 
                      : cn(
                          "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50",
                          isUrgent && count > 0 && "text-red-500 border-red-100 bg-red-50/20",
                          isWarning && count > 0 && "text-amber-600 border-amber-100 bg-amber-50/20",
                          isInfo && count > 0 && "text-blue-600 border-blue-100 bg-blue-50/20"
                        )
                  )}
                >
                  <Icon size={12} className={cn(
                    "shrink-0",
                    isActive ? "text-blue-100" : (
                      isUrgent && count > 0 ? "text-red-400" : (
                        isInfo && count > 0 ? "text-blue-400" : "text-slate-400"
                      )
                    )
                  )} />
                  <span>{q.label}</span>
                  {count > 0 && (
                    <span 
                      className={cn(
                        "ml-0.5 px-1 py-0.5 rounded text-[8px] font-black tracking-tight",
                        isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500",
                        !isActive && isUrgent && "bg-red-100 text-red-600",
                        !isActive && isWarning && "bg-amber-100 text-amber-700"
                      )}
                    >
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="relative z-[200] overflow-visible bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-col xl:flex-row xl:items-center gap-2 p-2 group">
              <div className="flex flex-wrap items-center gap-2">
                <TicketSavedViews 
                  views={savedViews}
                  currentViewId={currentViewId}
                  onSelectView={handleSelectView}
                  onSaveCurrent={handleSaveView}
                  onDeleteView={handleDeleteView}
                />
                
                <div className="hidden xl:block w-px h-5 bg-slate-100" />
                
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

            {/* Active Filter Chips */}
            <AnimatePresence>
              {hasAnyFilters && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-2 pb-2 pt-1 border-t border-slate-50 flex flex-wrap items-center gap-1.5"
                >
                  {getActiveFilterChips().map((chip) => {
                    const props = {
                      label: chip.label,
                      value: chip.value,
                      onRemove: () => removeFilter(chip.id)
                    };
                    return (
                      <FilterChip 
                        key={chip.id}
                        {...props}
                      />
                    );
                  })}
                  <button 
                    onClick={clearFilters}
                    className="text-[9px] font-bold text-red-500 hover:text-red-600 px-1.5 py-1 rounded hover:bg-red-50 transition-colors uppercase tracking-tight"
                  >
                    Limpar tudo
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {viewMode === 'list' && ticketsResponse && <TicketSummaryCards summary={ticketsResponse.summary} />}
          {viewMode === 'kanban' && kanbanResponse && <TicketSummaryCards summary={kanbanResponse.totals} />}

          <div className={cn(
            "relative z-0 transition-all duration-300",
            viewMode === 'kanban' ? "h-[calc(100vh-200px)] min-h-[400px]" : ""
          )}>
            {!!currentUser.desenvolvedor && !devCompanyId ? (
              <div className="h-full flex flex-col items-center justify-center space-y-2 bg-white rounded-xl border border-slate-200 py-8">
                 <Building className="w-6 h-6 text-slate-300" />
                 <p className="text-xs text-slate-500 font-bold tracking-tight uppercase">Selecione uma empresa.</p>
              </div>
            ) : loading && (!kanbanResponse && !ticketsResponse) ? (
              <div className="h-full flex flex-col items-center justify-center space-y-2 bg-white rounded-xl border border-slate-200 py-8">
                 <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                 <p className="text-[9px] text-slate-500 font-bold tracking-tight uppercase">Carregando...</p>
              </div>
            ) : error ? (
              <div className="p-8 bg-red-50 border border-red-100 text-red-600 text-center rounded-xl text-xs font-bold uppercase">
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
                currentUser={currentUser}
                onStatusChange={() => fetchData()}
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
            className="w-full lg:w-56 shrink-0"
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
