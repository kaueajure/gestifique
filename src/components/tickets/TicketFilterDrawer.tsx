import React from 'react';
import { X, Calendar, Tag as TagIcon, User, Globe, Clock, Search, Layers, ShieldAlert } from 'lucide-react';
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
  serviceFilter: string;
  setServiceFilter: (v: string) => void;
  filters: IFilters;
  onFilterChange: (filters: IFilters) => void;
  onClear: () => void;
  agents: any[];
  categoryOptions?: {value: string; label: string}[];
  serviceOptions?: {value: string; label: string}[];
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
  serviceFilter,
  setServiceFilter,
  filters,
  onFilterChange,
  onClear,
  agents,
  categoryOptions,
  serviceOptions
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
            className="fixed top-0 right-0 bottom-0 w-[360px] max-w-full bg-white shadow-xl z-[110] flex flex-col border-l border-slate-200"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Filtros Avançados</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Refine sua busca por atendimentos</p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pb-24 space-y-6 no-scrollbar">
              {/* Status */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Globe size={12} /> Status do Ticket
                </label>
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  buttonClassName="h-10 text-xs font-black uppercase tracking-widest bg-slate-50 border-slate-200 rounded-xl px-4"
                  options={[
                    { value: 'todos', label: 'Todos os Status' },
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
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Clock size={12} /> Prioridade
                </label>
                <Select
                  value={priorityFilter}
                  onChange={setPriorityFilter}
                  buttonClassName="h-10 text-xs font-black uppercase tracking-widest bg-slate-50 border-slate-200 rounded-xl px-4"
                  options={[
                    { value: 'todas', label: 'Todas as Prioridades' },
                    { value: 'urgente', label: 'Urgente' },
                    { value: 'alta', label: 'Alta' },
                    { value: 'media', label: 'Média' },
                    { value: 'baixa', label: 'Baixa' }
                  ]}
                  className="w-full"
                />
              </div>

              <div className="h-px bg-slate-100 my-2" />

              {/* Category */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Layers size={12} /> Categoria
                </label>
                <Select
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  buttonClassName="h-10 text-xs font-black uppercase tracking-widest bg-slate-50 border-slate-200 rounded-xl px-4"
                  options={categoryOptions || [
                    { value: 'todas', label: 'Todas as Categorias' }
                  ]}
                  className="w-full"
                />
              </div>

              {/* Service */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Search size={12} /> Serviço / Produto
                </label>
                <Select
                  value={serviceFilter}
                  onChange={setServiceFilter}
                  buttonClassName="h-10 text-xs font-black uppercase tracking-widest bg-slate-50 border-slate-200 rounded-xl px-4"
                  options={serviceOptions || [
                    { value: 'todos', label: 'Todos os Serviços' }
                  ]}
                  className="w-full"
                />
              </div>

              {/* Responsável */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <User size={12} /> Atendente Responsável
                </label>
                <Select
                  value={filters.responsavel_id ? String(filters.responsavel_id) : ''}
                  onChange={(value) => handleChange('responsavel_id', value ? parseInt(value) : undefined)}
                  buttonClassName="h-10 text-xs font-black uppercase tracking-widest bg-slate-50 border-slate-200 rounded-xl px-4"
                  options={[
                    { value: '', label: 'Qualquer Atendente' },
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
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ShieldAlert size={12} /> Condição do SLA
                </label>
                <Select
                  value={filters.sla_status || 'todos'}
                  onChange={(value) => handleChange('sla_status', value)}
                  buttonClassName="h-10 text-xs font-black uppercase tracking-widest bg-slate-50 border-slate-200 rounded-xl px-4"
                  options={[
                    { value: 'todos', label: 'Todos (Com e Sem SLA)' },
                    { value: 'dentro_sla', label: 'Dentro do Prazo' },
                    { value: 'vencendo', label: 'Vencendo em breve' },
                    { value: 'vencido', label: 'SLA Vencido' },
                    { value: 'sem_sla', label: 'Sem SLA definido' }
                  ]}
                  className="w-full"
                />
              </div>

              {/* Tag */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <TagIcon size={12} /> Filtrar por Tag
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    value={filters.tag || ''}
                    onChange={(e) => handleChange('tag', e.target.value)}
                    placeholder="Ex: login, urgente..."
                    className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-black uppercase tracking-widest focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all placeholder:text-slate-400/60 placeholder:font-medium"
                  />
                </div>
              </div>

              {/* Criado Em */}
              <div className="space-y-2 pb-6">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={12} /> Intervalo de Criação
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={filters.created_from || ''}
                    onChange={(e) => handleChange('created_from', e.target.value)}
                    className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-[10px] font-black uppercase tracking-tight focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                  />
                  <input
                    type="date"
                    value={filters.created_to || ''}
                    onChange={(e) => handleChange('created_to', e.target.value)}
                    className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-[10px] font-black uppercase tracking-tight focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-100 flex items-center gap-4 bg-white/80 backdrop-blur-lg">
              <Button 
                variant="outline" 
                className="flex-[0.4] h-11 text-[10px] font-black uppercase tracking-widest border-slate-200 rounded-xl hover:bg-slate-50"
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
                className="flex-[0.6] h-11 text-[10px] font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 rounded-xl border-b-4 border-blue-800 active:translate-y-0.5 active:border-b-0"
                onClick={onClose}
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
