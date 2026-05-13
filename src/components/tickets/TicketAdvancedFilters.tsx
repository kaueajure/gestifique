import React from 'react';
import { 
  X, 
  Calendar, 
  Tag as TagIcon, 
  User, 
  Globe, 
  Clock, 
  Search
} from 'lucide-react';
import { Button } from '../ui/Button';
import { TicketAdvancedFilters as IFilters } from '../../types';

import { Select } from '../ui/Select';

interface Props {
  filters: IFilters;
  onFilterChange: (filters: IFilters) => void;
  onClear: () => void;
  agents: any[];
  isOpen: boolean;
}

export const TicketAdvancedFilters: React.FC<Props> = ({ filters, onFilterChange, onClear, agents, isOpen }) => {
  const handleChange = (field: keyof IFilters, value: any) => {
    onFilterChange({ ...filters, [field]: value });
  };

  if (!isOpen) return null;

  return (
    <div className="p-4 bg-white border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-top-2 duration-200">
      {/* Responsável */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
          <User size={12} /> Responsável
        </label>
        <Select
          value={filters.responsavel_id || ''}
          onChange={(value) => handleChange('responsavel_id', value ? parseInt(value) : undefined)}
          options={[
            { value: '', label: 'Todos' },
            ...agents.map(agent => ({
              value: String(agent.id),
              label: agent.nome
            }))
          ]}
        />
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
          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-colors placeholder:text-slate-400"
        />
      </div>

      {/* Origem */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
          <Globe size={12} /> Origem
        </label>
        <Select
          value={filters.origem || ''}
          onChange={(value) => handleChange('origem', value || undefined)}
          options={[
            { value: '', label: 'Todas' },
            { value: 'portal', label: 'Portal' },
            { value: 'email', label: 'E-mail' },
            { value: 'api', label: 'API' },
            { value: 'sistema', label: 'Sistema' }
          ]}
        />
      </div>

      {/* SLA Status */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
          <Clock size={12} /> Status do SLA
        </label>
        <Select
          value={filters.sla_status || 'todos'}
          onChange={(value) => handleChange('sla_status', value)}
          options={[
            { value: 'todos', label: 'Todos' },
            { value: 'dentro_sla', label: 'Dentro do SLA' },
            { value: 'vencendo', label: 'Vencendo em breve' },
            { value: 'vencido', label: 'SLA Vencido' },
            { value: 'sem_sla', label: 'Sem SLA definido' }
          ]}
        />
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
            className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-colors"
          />
          <input
            type="date"
            value={filters.created_to || ''}
            onChange={(e) => handleChange('created_to', e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-colors"
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
            className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-colors"
          />
          <input
            type="date"
            value={filters.updated_to || ''}
            onChange={(e) => handleChange('updated_to', e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-colors"
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
            className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all placeholder:text-slate-400"
          />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClear}
            className="text-slate-600 hover:text-blue-600 hover:bg-blue-50 gap-2 border-slate-200 bg-white"
          >
            <X size={14} />
            Limpar
          </Button>
        </div>
      </div>
    </div>
  );
};
