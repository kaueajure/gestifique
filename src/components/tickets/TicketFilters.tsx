import React from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { cn } from '../../lib/utils';

interface TicketFiltersProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  priorityFilter: string;
  setPriorityFilter: (v: string) => void;
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  hasAdvancedFilters: boolean;
}

export const TicketFilters = ({
  searchTerm, setSearchTerm,
  statusFilter, setStatusFilter,
  priorityFilter, setPriorityFilter,
  categoryFilter, setCategoryFilter,
  showAdvanced, onToggleAdvanced,
  hasAdvancedFilters
}: TicketFiltersProps) => {

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'todos' || priorityFilter !== 'todas' || categoryFilter !== 'todas';

  return (
    <div className="flex flex-col lg:flex-row gap-2 items-center flex-1">
      <div className="relative flex-1 group w-full max-w-sm">
         <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={13} />
         <input 
           type="text" 
           placeholder="Filtrar por nome ou ID..." 
           className="w-full h-8.5 bg-slate-50/50 border border-slate-200/60 rounded-xl pl-9 pr-4 text-[11px] font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all font-sans placeholder:text-slate-400"
           value={searchTerm}
           onChange={(e) => setSearchTerm(e.target.value)}
         />
      </div>
      
      <div className="flex items-center gap-1.5 w-full lg:w-auto">
         <Select 
          size="sm"
          value={categoryFilter}
          onChange={setCategoryFilter}
          className="w-auto"
          buttonClassName="min-w-[100px] h-8.5 text-[10px] font-bold uppercase tracking-widest border-slate-200/60 transition-all hover:bg-slate-50"
          options={[
            { value: 'todas', label: 'Categorias' },
            { value: 'suporte_tecnico', label: 'Suporte' },
            { value: 'financeiro', label: 'Financeiro' },
            { value: 'recursos_humanos', label: 'RH' },
            { value: 'comercial', label: 'Comercial' },
            { value: 'outros', label: 'Outros' }
          ]}
        />
        <Select 
          size="sm"
          value={statusFilter}
          onChange={setStatusFilter}
          className="w-auto"
          buttonClassName="min-w-[90px] h-8.5 text-[10px] font-bold uppercase tracking-widest border-slate-200/60 transition-all hover:bg-slate-50"
          options={[
            { value: 'todos', label: 'Status' },
            { value: 'aberto', label: 'Aberto' },
            { value: 'em_andamento', label: 'Andamento' },
            { value: 'aguardando_cliente', label: 'Aguardando' },
            { value: 'resolvido', label: 'Resolvido' },
            { value: 'fechado', label: 'Fechado' }
          ]}
        />
        <Select 
          size="sm"
          value={priorityFilter}
          onChange={setPriorityFilter}
          className="w-auto"
          buttonClassName="min-w-[100px] h-8.5 text-[10px] font-bold uppercase tracking-widest border-slate-200/60 transition-all hover:bg-slate-50"
          options={[
            { value: 'todas', label: 'Prioridade' },
            { value: 'urgente', label: 'Urgente' },
            { value: 'alta', label: 'Alta' },
            { value: 'media', label: 'Média' },
            { value: 'baixa', label: 'Baixa' }
          ]}
        />

        <Button 
          variant="outline" 
          size="sm" 
          onClick={onToggleAdvanced}
          className={cn(
            "h-8.5 gap-2 text-[10px] font-black uppercase tracking-widest px-3.5 transition-all rounded-xl",
            showAdvanced ? "bg-blue-50 border-blue-200 text-blue-600 shadow-sm" : "bg-white text-slate-500 border-slate-200/60 hover:bg-slate-50",
            hasAdvancedFilters && !showAdvanced && "ring-2 ring-blue-50 border-blue-200"
          )}
        >
          <Filter size={12} className={hasAdvancedFilters ? "text-blue-500" : ""} />
          <span className="hidden sm:inline">Mais filtros</span>
        </Button>
      </div>
    </div>
  );
};
