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
import { motion, AnimatePresence } from 'motion/react';
import { Select } from '../ui/Select';

interface Props {
  filters: IFilters;
  onFilterChange: (filters: IFilters) => void;
  status: string;
  onStatusChange: (v: string) => void;
  priority: string;
  onPriorityChange: (v: string) => void;
  category: string;
  onCategoryChange: (v: string) => void;
  onClear: () => void;
  agents: any[];
  isOpen: boolean;
  onClose: () => void;
}

export const TicketAdvancedFilters: React.FC<Props> = ({ 
  filters, onFilterChange, 
  status, onStatusChange,
  priority, onPriorityChange,
  category, onCategoryChange,
  onClear, agents, isOpen, onClose 
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
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl z-[101] flex flex-col"
          >
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Search size={18} className="text-blue-600" />
                <h2 className="text-lg font-bold text-slate-900">Filtros</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Status */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Status</label>
                <Select
                  value={status}
                  onChange={onStatusChange}
                  options={[
                    { value: 'todos', label: 'Todos os Status' },
                    { value: 'aberto', label: 'Aberto' },
                    { value: 'em_andamento', label: 'Em andamento' },
                    { value: 'aguardando_cliente', label: 'Aguardando resposta' },
                    { value: 'resolvido', label: 'Resolvido' },
                    { value: 'fechado', label: 'Fechado' }
                  ]}
                />
              </div>

              {/* Prioridade */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Prioridade</label>
                <Select
                  value={priority}
                  onChange={onPriorityChange}
                  options={[
                    { value: 'todas', label: 'Todas as Prioridades' },
                    { value: 'urgente', label: 'Urgente' },
                    { value: 'alta', label: 'Alta' },
                    { value: 'media', label: 'Média' },
                    { value: 'baixa', label: 'Baixa' }
                  ]}
                />
              </div>

              {/* Categoria */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Categoria</label>
                <Select
                  value={category}
                  onChange={onCategoryChange}
                  options={[
                    { value: 'todas', label: 'Todas as Categorias' },
                    { value: 'suporte_tecnico', label: 'Suporte Técnico' },
                    { value: 'financeiro', label: 'Financeiro' },
                    { value: 'recursos_humanos', label: 'RH' },
                    { value: 'comercial', label: 'Comercial' },
                    { value: 'outros', label: 'Outros' }
                  ]}
                />
              </div>

              <div className="h-px bg-slate-100" />

              {/* Responsável */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Responsável</label>
                <Select
                  value={filters.responsavel_id || ''}
                  onChange={(value) => handleChange('responsavel_id', value ? parseInt(value) : undefined)}
                  options={[
                    { value: '', label: 'Todos os Responsáveis' },
                    ...agents.map(agent => ({
                      value: String(agent.id),
                      label: agent.nome
                    }))
                  ]}
                />
              </div>

              {/* Tag */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Tag</label>
                <input
                  type="text"
                  value={filters.tag || ''}
                  onChange={(e) => handleChange('tag', e.target.value)}
                  placeholder="Ex: financeiro"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 outline-none focus:ring-4 focus:ring-blue-100/50 focus:border-blue-500/50 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* SLA Status */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Status do SLA</label>
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
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Criado em</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={filters.created_from || ''}
                    onChange={(e) => handleChange('created_from', e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 outline-none focus:ring-4 focus:ring-blue-100/50 focus:border-blue-300 transition-all"
                  />
                  <input
                    type="date"
                    value={filters.created_to || ''}
                    onChange={(e) => handleChange('created_to', e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 outline-none focus:ring-4 focus:ring-blue-100/50 focus:border-blue-300 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={onClear}
                className="flex-1 rounded-xl bg-white border-slate-200 text-slate-500 font-bold uppercase tracking-tight text-xs h-12"
              >
                Limpar
              </Button>
              <Button 
                onClick={onClose}
                className="flex-1 rounded-xl bg-blue-600 text-white font-bold uppercase tracking-tight text-xs h-12 shadow-lg shadow-blue-100"
              >
                Aplicar Filtros
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
