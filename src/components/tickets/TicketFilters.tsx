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
  onToggleAdvanced,
  hasAdvancedFilters
}: Partial<TicketFiltersProps>) => {

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="relative flex-1 group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
        <input 
          type="text" 
          placeholder="Buscar por ID, cliente ou assunto..." 
          className="w-full h-11 bg-slate-50/50 border border-slate-200/60 rounded-xl pl-11 pr-4 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-100/50 focus:border-blue-500/50 transition-all font-sans"
          value={searchTerm}
          onChange={(e) => setSearchTerm?.(e.target.value)}
        />
      </div>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onToggleAdvanced}
        className={cn(
          "h-11 gap-2 text-xs font-bold uppercase tracking-tight px-5 rounded-xl border-slate-200 transition-all shadow-sm",
          hasAdvancedFilters ? "bg-blue-50 border-blue-200 text-blue-600 ring-2 ring-blue-100/50" : "bg-white text-slate-600 hover:bg-slate-50"
        )}
      >
        <Filter size={16} className={hasAdvancedFilters ? "text-blue-500" : "text-slate-400"} />
        Filtros
      </Button>
    </div>
  );
};
