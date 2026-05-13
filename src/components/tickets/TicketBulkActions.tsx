import React, { useState } from 'react';
import { 
  CheckCircle2, 
  UserPlus, 
  Tag as TagIcon, 
  Archive, 
  AlertCircle,
  X,
  ChevronDown
} from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { TicketStatus, TicketPriority, User } from '../../types';

interface TicketBulkActionsProps {
  selectedCount: number;
  onAction: (action: string, value?: any) => void;
  onClear: () => void;
  agents: User[];
}

export const TicketBulkActions = ({ selectedCount, onAction, onClear, agents }: TicketBulkActionsProps) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  if (selectedCount === 0) return null;

  const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
    { value: 'aberto', label: 'Aberto' },
    { value: 'em_andamento', label: 'Em Andamento' },
    { value: 'aguardando_cliente', label: 'Aguardando Cliente' },
    { value: 'resolvido', label: 'Resolvido' },
    { value: 'fechado', label: 'Fechado' },
  ];

  const PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
    { value: 'baixa', label: 'Baixa' },
    { value: 'media', label: 'Média' },
    { value: 'alta', label: 'Alta' },
    { value: 'urgente', label: 'Urgente' },
  ];

  const handleAction = (action: string, value?: any) => {
    onAction(action, value);
    setOpenMenu(null);
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 p-2 pr-4 flex items-center gap-2 min-w-[500px]">
        {/* Count Indicator */}
        <div className="bg-blue-600 h-10 px-4 rounded-xl flex items-center gap-2 mr-2">
            <span className="text-sm font-black">{selectedCount}</span>
            <span className="text-[10px] font-medium uppercase tracking-widest opacity-80">Selecionados</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Status */}
          <div className="relative">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setOpenMenu(openMenu === 'status' ? null : 'status')}
              className={cn(
                "text-slate-300 hover:text-white hover:bg-slate-800 text-[10px] uppercase font-bold tracking-widest gap-2",
                openMenu === 'status' && "bg-slate-800 text-white"
              )}
            >
              <CheckCircle2 size={14} />
              Status
              <ChevronDown size={10} className={cn("transition-transform", openMenu === 'status' && "rotate-180")} />
            </Button>
            {openMenu === 'status' && (
              <div className="absolute bottom-full mb-2 left-0 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden min-w-[160px]">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleAction('status', opt.value)}
                    className="w-full text-left px-4 py-2.5 text-[10px] uppercase font-black tracking-widest text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Priority */}
          <div className="relative">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setOpenMenu(openMenu === 'priority' ? null : 'priority')}
              className={cn(
                "text-slate-300 hover:text-white hover:bg-slate-800 text-[10px] uppercase font-bold tracking-widest gap-2",
                openMenu === 'priority' && "bg-slate-800 text-white"
              )}
            >
              <AlertCircle size={14} />
              Prioridade
              <ChevronDown size={10} className={cn("transition-transform", openMenu === 'priority' && "rotate-180")} />
            </Button>
            {openMenu === 'priority' && (
              <div className="absolute bottom-full mb-2 left-0 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden min-w-[160px]">
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleAction('prioridade', opt.value)}
                    className="w-full text-left px-4 py-2.5 text-[10px] uppercase font-black tracking-widest text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Agent */}
          <div className="relative">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setOpenMenu(openMenu === 'agent' ? null : 'agent')}
              className={cn(
                "text-slate-300 hover:text-white hover:bg-slate-800 text-[10px] uppercase font-bold tracking-widest gap-2",
                openMenu === 'agent' && "bg-slate-800 text-white"
              )}
            >
              <UserPlus size={14} />
              Atribuir
              <ChevronDown size={10} className={cn("transition-transform", openMenu === 'agent' && "rotate-180")} />
            </Button>
            {openMenu === 'agent' && (
              <div className="absolute bottom-full mb-2 left-0 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden min-w-[200px] max-h-[300px] overflow-y-auto custom-scrollbar">
                <button
                  onClick={() => handleAction('responsavel', null)}
                  className="w-full text-left px-4 py-2.5 text-[10px] uppercase font-black tracking-widest text-red-500 hover:bg-red-50 transition-colors border-b border-slate-100"
                >
                  Remover Responsável
                </button>
                {agents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => handleAction('responsavel', agent.id)}
                    className="w-full text-left px-4 py-2.5 text-[10px] uppercase font-black tracking-widest text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    {agent.nome}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tag */}
          <div className="relative">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setOpenMenu(openMenu === 'tag' ? null : 'tag')}
              className={cn(
                "text-slate-300 hover:text-white hover:bg-slate-800 text-[10px] uppercase font-bold tracking-widest gap-2",
                openMenu === 'tag' && "bg-slate-800 text-white"
              )}
            >
              <TagIcon size={14} />
              Tag
            </Button>
            {openMenu === 'tag' && (
              <div className="absolute bottom-full mb-2 left-0 bg-white border border-slate-200 rounded-xl shadow-xl p-3 min-w-[200px]">
                 <input 
                   autoFocus
                   type="text" 
                   placeholder="Nova tag..."
                   className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-100"
                   onKeyDown={(e) => {
                     if (e.key === 'Enter') {
                       handleAction('add_tag', (e.target as HTMLInputElement).value);
                     }
                   }}
                 />
                 <p className="mt-2 text-[8px] text-slate-400 font-bold uppercase tracking-widest text-center">Pressione Enter para adicionar</p>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-slate-800 mx-1" />

          {/* Close */}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleAction('fechar')}
            className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/30 text-[10px] uppercase font-bold tracking-widest gap-2"
          >
            <Archive size={14} />
            Fechar
          </Button>
        </div>

        {/* Clear */}
        <button 
          onClick={onClear}
          className="ml-auto w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
          title="Limpar seleção"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
