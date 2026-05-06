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
  MoreVertical,
  Calendar,
  User as UserIcon,
  Loader2,
  Tag
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

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
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      // API supports searching and filtering via query params
      const query = new URLSearchParams();
      if (searchTerm) query.append('search', searchTerm);
      if (statusFilter !== 'todos') query.append('status', statusFilter);
      if (priorityFilter !== 'todas') query.append('prioridade', priorityFilter);

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
  }, [searchTerm, statusFilter, priorityFilter]);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aberto': return <AlertCircle size={16} className="text-amber-500" />;
      case 'em_andamento': return <Clock size={16} className="text-blue-500" />;
      case 'resolvido': return <CheckCircle2 size={16} className="text-emerald-500" />;
      default: return <Clock size={16} className="text-slate-400" />;
    }
  };

  const getPriorityColor = (prio: string) => {
    switch (prio) {
      case 'urgente': return 'text-red-600 bg-red-50 border-red-100';
      case 'alta': return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'media': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'baixa': return 'text-blue-600 bg-blue-50 border-blue-100';
      default: return 'text-slate-500 bg-slate-50 border-slate-100';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Atendimentos</h2>
          <p className="text-slate-500 font-medium text-lg">Gerencie e acompanhe todas as solicitações de suporte.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="h-14 px-10 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-3 w-full md:w-auto justify-center"
        >
          <Plus size={24} /> Novo Chamado
        </button>
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 group w-full">
           <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
           <input 
             type="text" 
             placeholder="Buscar por título, ID ou cliente..." 
             className="w-full h-14 bg-slate-50 border-none rounded-2xl pl-14 pr-6 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-14 px-6 bg-slate-50 border-none rounded-2xl text-sm font-black text-slate-600 outline-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none cursor-pointer flex-1 lg:flex-none"
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
            className="h-14 px-6 bg-slate-50 border-none rounded-2xl text-sm font-black text-slate-600 outline-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none cursor-pointer flex-1 lg:flex-none"
          >
            <option value="todas">Todas Prioridades</option>
            <option value="urgente">Urgente</option>
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        {loading && tickets.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-4">
             <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
             <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Sincronizando Chamados...</p>
          </div>
        ) : error ? (
          <div className="p-20 text-center flex flex-col items-center">
             <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-6">
                <AlertCircle size={40} />
             </div>
             <h4 className="text-xl font-black text-slate-800">Falha na conexão</h4>
             <p className="text-slate-500 font-medium mb-8 max-w-xs">{error}</p>
             <button onClick={fetchTickets} className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline">Tentar novamente</button>
          </div>
        ) : tickets.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {tickets.map((ticket) => (
              <motion.div 
                key={ticket.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => onSelectTicket(ticket.id)}
                className="p-8 flex flex-col lg:flex-row lg:items-center gap-6 hover:bg-slate-50/50 transition-all cursor-pointer group"
              >
                <div className={cn(
                  "w-16 h-16 rounded-[28px] flex items-center justify-center transition-all group-hover:scale-110 shadow-sm",
                  ticket.status === 'resolvido' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                )}>
                  <MessageSquare size={28} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span className="text-xl font-black text-slate-900 truncate group-hover:text-blue-600 transition-colors">{ticket.titulo}</span>
                    <Badge variant={ticket.status === 'resolvido' ? 'emerald' : 'blue'}>{ticket.status.replace('_', ' ')}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <span className="flex items-center gap-2 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">#{ticket.id}</span>
                    <span className="flex items-center gap-2"><UserIcon size={14} className="text-slate-300" /> {ticket.cliente_nome}</span>
                    <span className="flex items-center gap-2 font-mono"><Tag size={14} className="text-slate-300" /> {ticket.categoria}</span>
                    <span className="flex items-center gap-2"><Calendar size={14} className="text-slate-300" /> {new Date(ticket.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6 self-end lg:self-center">
                  <div className={cn(
                    "px-6 py-2.5 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all",
                    getPriorityColor(ticket.prioridade)
                  )}>
                    {ticket.prioridade}
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                    <ChevronRight size={20} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-32 text-center flex flex-col items-center">
            <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-[36px] flex items-center justify-center mb-6">
              <Search size={48} />
            </div>
            <h4 className="text-2xl font-black text-slate-900 mb-2">Nenhum resultado encontrado</h4>
            <p className="text-slate-500 font-medium max-w-sm mx-auto">Tente ajustar seus filtros ou termos de pesquisa para encontrar o que procura.</p>
          </div>
        )}
      </div>

      {/* New Ticket Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Abrir Novo Atendimento"
        size="lg"
      >
        <form onSubmit={handleCreateTicket} className="space-y-6">
          {createError && (
             <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold mb-4">
                {createError}
             </div>
           )}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Assunto do Chamado</label>
            <input 
              name="titulo" 
              required 
              placeholder="Ex: Não consigo acessar o painel financeiro"
              className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all outline-none" 
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Categoria</label>
              <select name="categoria" className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all outline-none appearance-none">
                <option value="suporte_tecnico">Suporte Técnico</option>
                <option value="financeiro">Financeiro</option>
                <option value="recursos_humanos">Recursos Humanos</option>
                <option value="comercial">Comercial</option>
                <option value="outros">Outros</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Prioridade</label>
              <select name="prioridade" className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all outline-none appearance-none">
                <option value="urgente">Urgente</option>
                <option value="alta">Alta</option>
                <option value="media">Média</option>
                <option value="baixa">Baixa</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Descrição Detalhada</label>
            <textarea 
              name="descricao" 
              required 
              rows={5}
              placeholder="Descreva o problema com o máximo de detalhes possível..."
              className="w-full bg-slate-50 border-none rounded-2xl p-6 text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all outline-none resize-none"
            ></textarea>
          </div>

          <div className="pt-4 flex justify-end gap-3">
             <button 
               type="button"
               onClick={() => setIsModalOpen(false)}
               className="h-14 px-8 text-slate-400 font-black text-sm uppercase tracking-widest hover:text-slate-600 transition-colors"
             >
               Cancelar
             </button>
             <button 
               type="submit"
               disabled={loadingCreate}
               className="h-14 px-10 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
             >
               {loadingCreate ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
               Abrir Ticket
             </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
