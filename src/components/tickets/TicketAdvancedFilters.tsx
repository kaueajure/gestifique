import React, { useState } from 'react';
import { 
  Filter, 
  X, 
  Calendar, 
  Tag as TagIcon, 
  User, 
  Globe, 
  Clock, 
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '../ui/Button';
import { TicketAdvancedFilters as IFilters } from '../../types';

interface Props {
  filters: IFilters;
  onFilterChange: (filters: IFilters) => void;
  onClear: () => void;
  agents: any[];
}

export const TicketAdvancedFilters: React.FC<Props> = ({ filters, onFilterChange, onClear, agents }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (field: keyof IFilters, value: any) => {
    onFilterChange({ ...filters, [field]: value });
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden mb-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-slate-300">
          <Filter size={16} />
          <span className="text-sm font-medium">Filtros Avançados</span>
        </div>
        {isOpen ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
      </button>

      {isOpen && (
        <div className="p-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Responsável */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
              <User size={12} /> Responsável
            </label>
            <select
              value={filters.responsavel_id || ''}
              onChange={(e) => handleChange('responsavel_id', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500/50"
            >
              <option value="">Todos</option>
              {agents.map(agent => (
                <option key={agent.id} value={agent.id}>{agent.nome}</option>
              ))}
            </select>
          </div>

          {/* Tag */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
              <TagIcon size={12} /> Tag
            </label>
            <input
              type="text"
              value={filters.tag || ''}
              onChange={(e) => handleChange('tag', e.target.value)}
              placeholder="Ex: financeiro"
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500/50 placeholder:text-slate-700"
            />
          </div>

          {/* Origem */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
              <Globe size={12} /> Origem
            </label>
            <select
              value={filters.origem || ''}
              onChange={(e) => handleChange('origem', e.target.value || undefined)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500/50"
            >
              <option value="">Todas</option>
              <option value="portal">Portal</option>
              <option value="email">E-mail</option>
              <option value="api">API</option>
              <option value="sistema">Sistema</option>
            </select>
          </div>

          {/* SLA Status */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
              <Clock size={12} /> Status do SLA
            </label>
            <select
              value={filters.sla_status || 'todos'}
              onChange={(e) => handleChange('sla_status', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500/50"
            >
              <option value="todos">Todos</option>
              <option value="dentro_sla">Dentro do SLA</option>
              <option value="vencendo">Vencendo em breve</option>
              <option value="vencido">SLA Vencido</option>
              <option value="sem_sla">Sem SLA definido</option>
            </select>
          </div>

          {/* Criado Em */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
              <Calendar size={12} /> Criado entre
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={filters.created_from || ''}
                onChange={(e) => handleChange('created_from', e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50"
              />
              <input
                type="date"
                value={filters.created_to || ''}
                onChange={(e) => handleChange('created_to', e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>

          {/* Atualizado Em */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
              <Calendar size={12} /> Atualizado entre
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={filters.updated_from || ''}
                onChange={(e) => handleChange('updated_from', e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50"
              />
              <input
                type="date"
                value={filters.updated_to || ''}
                onChange={(e) => handleChange('updated_to', e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>

          {/* Busca em Campos Personalizados */}
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
              <Search size={12} /> Buscar em Campos Personalizados
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={filters.custom_field_search || ''}
                onChange={(e) => handleChange('custom_field_search', e.target.value)}
                placeholder="Valor ou nome do campo..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500/50 placeholder:text-slate-700"
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onClear}
                className="text-slate-400 hover:text-slate-200 gap-2 border-slate-700"
              >
                <X size={14} />
                Limpar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
