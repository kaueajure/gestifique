import React, { useState, useEffect } from 'react';
import { Ticket } from '../../types';
import { api } from '../../lib/api';
import { Search, Filter, Plus, Clock, AlertTriangle, CheckCircle2, ChevronRight, User as UserIcon, Ticket as TicketIcon } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface TicketsPageProps {
  onSelectTicket: (id: number) => void;
}

export const TicketsPage = ({ onSelectTicket }: TicketsPageProps) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('prioridade', priorityFilter);
      if (searchTerm) params.append('busca', searchTerm);
      
      const data = await api.get<Ticket[]>(`/tickets?${params.toString()}`);
      setTickets(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, priorityFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTickets();
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'aberto': return 'blue';
      case 'em_andamento': return 'indigo';
      case 'aguardando_cliente': return 'orange';
      case 'resolvido': return 'emerald';
      case 'fechado': return 'slate';
      default: return 'slate';
    }
  };

  const getPriorityVariant = (prio: string) => {
    switch (prio) {
      case 'urgente': return 'red';
      case 'alta': return 'orange';
      case 'media': return 'amber';
      case 'baixa': return 'blue';
      default: return 'slate';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Gerenciamento de Chamados</h2>
          <p className="text-slate-500 font-medium">Visualize e controle todas as solicitações de suporte.</p>
        </div>
        <button className="h-12 px-6 rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-95">
          <Plus size={20} /> Abrir Novo Ticket
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <form onSubmit={handleSearch} className="relative flex-1 group w-full">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
           <input 
             type="text" 
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             placeholder="Buscar por título, descrição ou ID..."
             className="w-full h-12 bg-slate-50 border-none rounded-2xl pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-100 transition-all outline-none"
           />
        </form>
        <div className="flex gap-2 w-full md:w-auto">
           <select 
             value={statusFilter}
             onChange={(e) => setStatusFilter(e.target.value)}
             className="flex-1 md:flex-none h-12 px-4 bg-slate-50 border-none rounded-2xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
           >
              <option value="">Status: Todos</option>
              <option value="aberto">Aberto</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="aguardando_cliente">Aguardando Cliente</option>
              <option value="resolvido">Resolvido</option>
              <option value="fechado">Fechado</option>
           </select>
           <select 
             value={priorityFilter}
             onChange={(e) => setPriorityFilter(e.target.value)}
             className="flex-1 md:flex-none h-12 px-4 bg-slate-50 border-none rounded-2xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
           >
              <option value="">Prioridade: Todas</option>
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
           </select>
           <button className="h-12 w-12 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all">
              <Filter size={18} />
           </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 tracking-widest uppercase">ID / Chamado</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 tracking-widest uppercase">Status</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 tracking-widest uppercase">Solicitante</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 tracking-widest uppercase">Responsável</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 tracking-widest uppercase">Data</th>
                <th className="px-8 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence mode='wait'>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-8 py-6"><div className="w-32 h-4 bg-slate-100 rounded"></div></td>
                      <td className="px-8 py-6"><div className="w-20 h-4 bg-slate-100 rounded"></div></td>
                      <td className="px-8 py-6"><div className="w-24 h-4 bg-slate-100 rounded"></div></td>
                      <td className="px-8 py-6"><div className="w-24 h-4 bg-slate-100 rounded"></div></td>
                      <td className="px-8 py-6"><div className="w-full h-4 bg-slate-100 rounded"></div></td>
                    </tr>
                  ))
                ) : tickets.length > 0 ? (
                  tickets.map((ticket) => (
                    <motion.tr 
                      key={ticket.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => onSelectTicket(ticket.id)}
                      className="group hover:bg-slate-50 transition-all duration-300 cursor-pointer"
                    >
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black text-blue-600 mb-0.5">#{ticket.id}</span>
                           <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate max-w-xs">{ticket.titulo}</span>
                           <div className="flex items-center gap-2 mt-1">
                              <Badge variant={getPriorityVariant(ticket.prioridade)} className="scale-90 origin-left">
                                 {ticket.prioridade}
                              </Badge>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{ticket.categoria}</span>
                           </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <Badge variant={getStatusVariant(ticket.status)}>
                           {ticket.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                           <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                             {ticket.cliente_nome?.charAt(0)}
                           </div>
                           <span className="text-xs font-bold text-slate-700">{ticket.cliente_nome}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-xs text-slate-500 font-bold">
                        {ticket.responsavel_nome ? (
                          <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">
                               {ticket.responsavel_nome?.charAt(0)}
                             </div>
                             <span>{ticket.responsavel_nome}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 italic font-medium">Não atribuído</span>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                           <span className="text-xs font-bold text-slate-700">{new Date(ticket.created_at).toLocaleDateString()}</span>
                           <span className="text-[10px] font-medium text-slate-400">{new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-slate-300 group-hover:text-blue-600 transition-colors">
                        <ChevronRight size={20} />
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center justify-center grayscale opacity-50">
                        <TicketIcon size={40} className="mb-4 text-slate-300" />
                        <h4 className="font-bold text-slate-800">Nenhum chamado encontrado</h4>
                        <p className="text-sm text-slate-500">Tente ajustar seus filtros ou faça uma nova busca.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
