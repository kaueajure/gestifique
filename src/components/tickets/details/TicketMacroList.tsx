import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { TicketMacro, Ticket, User } from '../../../types';
import { Search, Loader2, MessageSquare, X } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface TicketMacroListProps {
  ticket: Ticket;
  currentUser: User;
  onSelect: (content: string) => void;
  onClose: () => void;
}

export const TicketMacroList = ({ ticket, currentUser, onSelect, onClose }: TicketMacroListProps) => {
  const [macros, setMacros] = useState<TicketMacro[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchMacros = async () => {
      setLoading(true);
      try {
        const data = await api.get<TicketMacro[]>('/macros');
        setMacros(data.filter(m => m.ativo !== false));
      } catch (err) {
        console.error('Erro ao carregar macros:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMacros();
  }, []);

  const replaceVariables = (content: string) => {
    return content
      .replace(/{{cliente_nome}}/g, ticket.cliente_nome || 'cliente')
      .replace(/{{ticket_id}}/g, ticket.id.toString())
      .replace(/{{titulo}}/g, ticket.titulo || '')
      .replace(/{{responsavel_nome}}/g, ticket.responsavel_nome || 'nossa equipe')
      .replace(/{{empresa_nome}}/g, ticket.empresa_nome || 'empresa');
  };

  const handleSelect = (macro: TicketMacro) => {
    const processed = replaceVariables(macro.conteudo);
    onSelect(processed);
  };

  const filteredMacros = macros.filter(m => 
    m.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.conteudo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by category
  const groupedMacros = filteredMacros.reduce((acc: Record<string, TicketMacro[]>, macro) => {
    const cat = macro.categoria || 'Geral';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(macro);
    return acc;
  }, {});

  const canManage = currentUser.administrador || currentUser.desenvolvedor;

  return (
    <div className="flex flex-col h-[400px] w-[340px] bg-white shadow-2xl rounded-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
          <MessageSquare size={13} className="text-blue-500" /> Respostas Prontas
        </h3>
        <button onClick={onClose} className="p-1.5 hover:bg-slate-200/50 rounded-lg text-slate-400 transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="p-3 border-b border-slate-100">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            autoFocus
            type="text" 
            placeholder="Buscar por título, categoria ou conteúdo..." 
            className="w-full h-9 pl-9 pr-3 text-[11px] bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all font-medium text-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar bg-white">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-2">
            <Loader2 size={24} className="text-blue-500 animate-spin" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Carregando...</span>
          </div>
        ) : filteredMacros.length > 0 ? (
          <div className="space-y-4 py-1">
            {(Object.entries(groupedMacros) as [string, TicketMacro[]][]).map(([category, items]) => (
              <div key={category} className="space-y-1">
                <div className="px-2 pb-1">
                  <span className="text-[9px] font-black uppercase tracking-[0.1em] text-blue-500/60 bg-blue-50 px-1.5 py-0.5 rounded">
                    {category}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  {items.map((macro) => (
                    <button
                      key={macro.id}
                      onClick={() => handleSelect(macro)}
                      className="w-full text-left p-3 hover:bg-slate-50 rounded-xl transition-all group border border-transparent hover:border-slate-100 active:scale-[0.98]"
                    >
                      <div className="font-bold text-[12px] text-slate-800 mb-0.5 group-hover:text-blue-700 transition-colors">
                        {macro.titulo}
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-medium">
                        {macro.conteudo}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-3">
              <MessageSquare size={24} className="text-slate-200" />
            </div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Nada encontrado</p>
            <p className="text-[10px] font-medium text-slate-400 mt-1">Experimente outros termos</p>
          </div>
        )}
      </div>

      <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">
          {macros.length} Respostas cadastradas
        </span>
        {canManage && (
          <button 
            type="button"
            className="text-[9px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 underline underline-offset-2"
          >
            Gerenciar
          </button>
        )}
      </div>
    </div>
  );
};
