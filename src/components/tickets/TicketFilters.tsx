import React from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface TicketFiltersProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  priorityFilter: string;
  setPriorityFilter: (v: string) => void;
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
}

export const TicketFilters = ({
  searchTerm, setSearchTerm,
  statusFilter, setStatusFilter,
  priorityFilter, setPriorityFilter,
  categoryFilter, setCategoryFilter
}: TicketFiltersProps) => {

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'todos' || priorityFilter !== 'todas' || categoryFilter !== 'todas';

  return (
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
          <option value="fechado">Fechado</option>
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
        {hasActiveFilters && (
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
  );
};
