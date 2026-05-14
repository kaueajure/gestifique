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
    <div className="flex flex-col lg:flex-row gap-2 items-center">
      <div className="relative flex-1 group w-full">
         <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={14} />
         <input 
           type="text" 
           placeholder="Buscar por ID ou assunto..." 
           className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all font-sans"
           value={searchTerm}
           onChange={(e) => setSearchTerm(e.target.value)}
         />
      </div>
      
      <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
         <Select 
          size="sm"
          value={categoryFilter}
          onChange={setCategoryFilter}
          className="w-auto"
          buttonClassName="min-w-[110px] h-9 text-[10px] uppercase font-bold tracking-tight"
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
          buttonClassName="min-w-[100px] h-9 text-[10px] uppercase font-bold tracking-tight"
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
          buttonClassName="min-w-[110px] h-9 text-[10px] uppercase font-bold tracking-tight"
          options={[
            { value: 'todas', label: 'Prioridades' },
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
            "h-9 gap-2 text-[10px] font-bold uppercase tracking-tight px-3",
            showAdvanced ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-white text-slate-600",
            hasAdvancedFilters && !showAdvanced && "ring-2 ring-blue-100 border-blue-300"
          )}
        >
          <Filter size={14} className={hasAdvancedFilters ? "text-blue-500" : ""} />
          Filtros
        </Button>

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
            className="h-9 w-9 p-0 text-slate-400 hover:text-red-600"
            title="Limpar Filtros"
          >
            <X size={14} />
          </Button>
        )}
      </div>
    </div>
  );
};
