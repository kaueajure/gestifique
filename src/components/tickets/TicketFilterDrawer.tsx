import React from 'react';
import { X, Calendar, Tag as TagIcon, User, Globe, Clock, Search } from 'lucide-react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { TicketAdvancedFilters as IFilters } from '../../types';
import { AnimatePresence, motion } from 'motion/react';

interface TicketFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  priorityFilter: string;
  setPriorityFilter: (v: string) => void;
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  filters: IFilters;
  onFilterChange: (filters: IFilters) => void;
  onClear: () => void;
  agents: any[];
}

export const TicketFilterDrawer: React.FC<TicketFilterDrawerProps> = ({
  isOpen,
  onClose,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  categoryFilter,
  setCategoryFilter,
  filters,
  onFilterChange,
  onClear,
  agents
}) => {
  const handleChange = (field: keyof IFilters, value: any) => {
    onFilterChange({ ...filters, [field]: value });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-[400px] max-w-full bg-white shadow-2xl z-[110] flex flex-col border-l border-slate-200"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-none">Filtros</h2>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 pb-20 space-y-6">
              {/* Status */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Status</label>
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={[
                    { value: 'todos', label: 'Todos' },
                    { value: 'aberto', label: 'Aberto' },
                    { value: 'em_andamento', label: 'Em Andamento' },
                    { value: 'aguardando_cliente', label: 'Aguardando' },
                    { value: 'resolvido', label: 'Resolvido' },
                    { value: 'fechado', label: 'Fechado' }
                  ]}
                  className="w-full"
                />
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Prioridade</label>
                <Select
                  value={priorityFilter}
                  onChange={setPriorityFilter}
                  options={[
                    { value: 'todas', label: 'Todas' },
                    { value: 'urgente', label: 'Urgente' },
                    { value: 'alta', label: 'Alta' },
                    { value: 'media', label: 'Média' },
                    { value: 'baixa', label: 'Baixa' }
                  ]}
                  className="w-full"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Categoria</label>
                <Select
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  options={[
                    { value: 'todas', label: 'Todas' },
                    { value: 'suporte_tecnico', label: 'Suporte' },
                    { value: 'financeiro', label: 'Financeiro' },
                    { value: 'recursos_humanos', label: 'RH' },
                    { value: 'comercial', label: 'Comercial' },
                    { value: 'outros', label: 'Outros' }
                  ]}
                  className="w-full"
                />
              </div>

              {/* Responsável */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 border-t border-slate-100 pt-6">
                  <User size={14} className="text-slate-400" /> Responsável
                </label>
                <Select
                  value={filters.responsavel_id ? String(filters.responsavel_id) : ''}
                  onChange={(value) => handleChange('responsavel_id', value ? parseInt(value) : undefined)}
                  options={[
                    { value: '', label: 'Todos' },
                    ...agents.map(agent => ({
                      value: String(agent.id),
                      label: agent.nome
                    }))
                  ]}
                  className="w-full"
                />
              </div>

              {/* SLA Status */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock size={14} className="text-slate-400" /> Status do SLA
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
                  className="w-full"
                />
              </div>

              {/* Tag */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <TagIcon size={14} className="text-slate-400" /> Tag
                </label>
                <input
                  type="text"
                  value={filters.tag || ''}
                  onChange={(e) => handleChange('tag', e.target.value)}
                  placeholder="Ex: login, urgente..."
                  className="w-full bg-white border border-slate-200 rounded-lg h-9 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors placeholder:text-slate-400"
                />
              </div>

              {/* Criado Em */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar size={14} className="text-slate-400" /> Data de criação
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={filters.created_from || ''}
                    onChange={(e) => handleChange('created_from', e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg h-9 px-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors"
                  />
                  <input
                    type="date"
                    value={filters.created_to || ''}
                    onChange={(e) => handleChange('created_to', e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg h-9 px-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 flex items-center gap-3">
              <Button 
                variant="outline" 
                className="flex-[0.5]"
                onClick={() => {
                  setStatusFilter('todos');
                  setPriorityFilter('todas');
                  setCategoryFilter('todas');
                  onClear();
                }}
              >
                Limpar
              </Button>
              <Button 
                className="flex-[1.5] bg-blue-600 hover:bg-blue-700 text-white"
                onClick={onClose}
              >
                Aplicar filtros
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
