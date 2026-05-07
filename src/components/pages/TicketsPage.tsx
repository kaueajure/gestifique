import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Ticket, User, Empresa as Company } from '../../types';
import { 
  Search, 
  Plus, 
  MessageSquare, 
  ChevronRight,
  Calendar,
  User as UserIcon,
  Loader2,
  Tag,
  X,
  Building
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';

interface TicketsPageProps {
  onSelectTicket: (id: number) => void;
  currentUser: User;
}

export const TicketsPage = ({ onSelectTicket, currentUser }: TicketsPageProps) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [priorityFilter, setPriorityFilter] = useState('todas');
  const [categoryFilter, setCategoryFilter] = useState('todas');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      if (searchTerm) query.append('search', searchTerm);
      if (statusFilter !== 'todos') query.append('status', statusFilter);
      if (priorityFilter !== 'todas') query.append('prioridade', priorityFilter);
      if (categoryFilter !== 'todas') query.append('categoria', categoryFilter);

      const data = await api.get<Ticket[]>(`/tickets?${query.toString()}`);
      setTickets(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar atendimentos.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    if (!currentUser.desenvolvedor || currentUser.empresa_id) return;
    
    setLoadingCompanies(true);
    try {
      const data = await api.get<Company[]>('/companies');
      setCompanies(data);
    } catch (err) {
      console.error('Erro ao buscar empresas:', err);
    } finally {
      setLoadingCompanies(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTickets();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, priorityFilter, categoryFilter]);

  useEffect(() => {
    if (isModalOpen && currentUser.desenvolvedor && !currentUser.empresa_id) {
      fetchCompanies();
    }
  }, [isModalOpen, currentUser]);

  const handleCreateTicket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoadingCreate(true);
    setCreateError(null);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    if (currentUser.desenvolvedor && !currentUser.empresa_id && !data.empresa_id) {
       setCreateError('Selecione uma empresa para abrir o atendimento.');
       setLoadingCreate(false);
       return;
    }

    try {
      await api.post('/tickets', data);
      setIsModalOpen(false);
      fetchTickets();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar atendimento.';
      setCreateError(message);
    } finally {
      setLoadingCreate(false);
    }
  };

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Atendimentos</h2>
          <p className="text-sm text-slate-500 font-medium tracking-tight">Gerencie e acompanhe todas as solicitações de suporte.</p>
        </div>
        <Button size="sm" className="h-9" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} className="mr-2" /> Novo Atendimento
        </Button>
      </div>

      <Card className="p-3">
        <div className="flex flex-col lg:flex-row gap-2">
          <div className="relative flex-1 group">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={14} />
             <input 
               type="text" 
               placeholder="Buscar por ID ou assunto..." 
               className="w-full h-8 bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all font-sans"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-8 px-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 uppercase tracking-tight outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
            >
              <option value="todas">Categorias</option>
              <option value="suporte_tecnico">Suporte</option>
              <option value="financeiro">Financeiro</option>
              <option value="recursos_humanos">RH</option>
              <option value="comercial">Comercial</option>
              <option value="outros">Outros</option>
            </select>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 px-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 uppercase tracking-tight outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
            >
              <option value="todos">Status</option>
              <option value="aberto">Aberto</option>
              <option value="em_andamento">Andamento</option>
              <option value="aguardando_cliente">Aguardando</option>
              <option value="resolvido">Resolvido</option>
            </select>
            <select 
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-8 px-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 uppercase tracking-tight outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
            >
              <option value="todas">Prioridades</option>
              <option value="urgente">Urgente</option>
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </select>
            {(searchTerm || statusFilter !== 'todos' || priorityFilter !== 'todas' || categoryFilter !== 'todas') && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('todos');
                  setPriorityFilter('todas');
                  setCategoryFilter('todas');
                }}
                className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                title="Limpar Filtros"
              >
                <X size={14} />
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading && tickets.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-3">
             <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
             <p className="text-xs text-slate-500 font-bold tracking-tight uppercase">Carregando...</p>
          </div>
        ) : tickets.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {tickets.map((ticket) => (
              <div 
                key={ticket.id}
                onClick={() => onSelectTicket(ticket.id)}
                className="p-3 px-5 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-slate-50/50 transition-colors cursor-pointer group"
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center border transition-colors shadow-sm bg-white",
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
                  </div>
                </div>

                <div className="flex items-center gap-4 ml-auto sm:ml-0">
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
        ) : (
          <div className="p-20 text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-xl flex items-center justify-center mb-4 border border-slate-100">
              <Search size={24} />
            </div>
            {searchTerm || statusFilter !== 'todos' || priorityFilter !== 'todas' || categoryFilter !== 'todas' ? (
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
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Novo Atendimento"
        size="lg"
      >
        <form onSubmit={handleCreateTicket} className="space-y-5">
          {createError && (
             <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs font-semibold mb-4">
                {createError}
             </div>
           )}
          
          <Input 
            label="Assunto do Atendimento"
            name="titulo" 
            required 
            placeholder="Descreva o assunto brevemente" 
          />

          {currentUser.desenvolvedor && !currentUser.empresa_id && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Empresa Solicitante</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <select 
                  name="empresa_id" 
                  required
                  className="w-full h-10 bg-white border border-slate-200 rounded-lg pl-9 pr-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none"
                >
                  <option value="">Selecione uma empresa...</option>
                  {companies.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.nome}</option>
                  ))}
                </select>
                {loadingCompanies && (
                  <div className="absolute right-8 top-1/2 -translate-y-1/2">
                    <Loader2 size={14} className="animate-spin text-blue-600" />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Categoria</label>
              <select name="categoria" className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none">
                <option value="suporte_tecnico">Suporte Técnico</option>
                <option value="financeiro">Financeiro</option>
                <option value="recursos_humanos">Recursos Humanos</option>
                <option value="comercial">Comercial</option>
                <option value="outros">Outros</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Prioridade</label>
              <select name="prioridade" className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none">
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Descrição</label>
            <textarea 
              name="descricao" 
              required 
              rows={5}
              placeholder="Descreva os detalhes da sua solicitação..."
              className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none"
            ></textarea>
          </div>

          <div className="pt-4 flex justify-end gap-2">
             <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
               Cancelar
             </Button>
             <Button type="submit" loading={loadingCreate}>
               Criar Atendimento
             </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
