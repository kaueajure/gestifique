import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Ticket } from '../../types';
import { 
  Search, 
  Plus, 
  MessageSquare, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Filter, 
  ChevronRight,
  Calendar,
  User as UserIcon,
  Loader2,
  Tag,
  X
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';

interface TicketsPageProps {
  onSelectTicket: (id: number) => void;
}

export const TicketsPage = ({ onSelectTicket }: TicketsPageProps) => {
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
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar chamados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTickets();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, priorityFilter, categoryFilter]);

  const handleCreateTicket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoadingCreate(true);
    setCreateError(null);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      await api.post('/tickets', data);
      setIsModalOpen(false);
      fetchTickets();
    } catch (err: any) {
      setCreateError(err.message || 'Erro ao criar chamado.');
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
          <h2 className="text-2xl font-semibold text-slate-950 tracking-tight">Atendimentos</h2>
          <p className="text-sm text-slate-500">Gerencie e acompanhe todas as solicitações de suporte.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={18} className="mr-2" /> Novo Atendimento
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1 group">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
             <input 
               type="text" 
               placeholder="Buscar ticket..." 
               className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          <div className="grid grid-cols-2 lg:flex items-center gap-2">
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
            >
              <option value="todas">Todas Categorias</option>
              <option value="suporte_tecnico">Suporte Técnico</option>
              <option value="financeiro">Financeiro</option>
              <option value="recursos_humanos">Recursos Humanos</option>
              <option value="comercial">Comercial</option>
              <option value="outros">Outros</option>
            </select>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
            >
              <option value="todos">Todos Status</option>
              <option value="aberto">Aberto</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="aguardando_cliente">Aguardando Cliente</option>
              <option value="resolvido">Resolvido</option>
            </select>
            <select 
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer col-span-2 lg:col-span-1"
            >
              <option value="todas">Todas Prioridades</option>
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
                className="h-9 px-2"
              >
                <X size={14} className="mr-1" /> Limpar
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading && tickets.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-3">
             <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
             <p className="text-sm text-slate-500 font-medium tracking-tight">Carregando chamados...</p>
          </div>
        ) : error ? (
          <div className="p-20 text-center flex flex-col items-center">
             <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center mb-4 border border-red-100">
                <AlertCircle size={24} />
             </div>
             <h4 className="text-base font-semibold text-slate-900 mb-1">Falha na listagem</h4>
             <p className="text-xs text-slate-500 mb-6">{error}</p>
             <Button variant="outline" size="sm" onClick={fetchTickets}>Tentar novamente</Button>
          </div>
        ) : tickets.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {tickets.map((ticket) => (
              <div 
                key={ticket.id}
                onClick={() => onSelectTicket(ticket.id)}
                className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center border transition-colors",
                  ticket.status === 'resolvido' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-blue-50 text-blue-700 border-blue-100"
                )}>
                  <MessageSquare size={20} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-700 transition-colors">{ticket.titulo}</span>
                    <Badge variant={statusMap[ticket.status || 'aberto']}>{ticket.status.replace('_', ' ')}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium text-slate-500">
                    <span className="text-blue-700 font-bold">#{ticket.id}</span>
                    <span className="flex items-center gap-1.5"><UserIcon size={12} className="text-slate-400" /> {ticket.cliente_nome}</span>
                    <span className="flex items-center gap-1.5"><Tag size={12} className="text-slate-400" /> {ticket.categoria?.replace('_', ' ')}</span>
                    <span className="flex items-center gap-1.5"><Calendar size={12} className="text-slate-400" /> {new Date(ticket.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 ml-auto sm:ml-0">
                  <Badge variant={getPriorityVariant(ticket.prioridade)} className="font-semibold uppercase text-[10px]">
                    {ticket.prioridade}
                  </Badge>
                  <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-blue-700 group-hover:text-white group-hover:border-blue-700 transition-all">
                    <ChevronRight size={16} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-24 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
              <Search size={32} />
            </div>
            <h4 className="text-base font-semibold text-slate-900 mb-1">Nenhum resultado</h4>
            <p className="text-xs text-slate-500 max-w-[240px] mx-auto">Tente ajustar seus filtros ou termos de pesquisa para encontrar o que procura.</p>
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
               Criar Ticket
             </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
