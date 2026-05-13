import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { TicketMacro, Ticket } from '../../../types';
import { Search, Loader2, MessageSquare, X } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface TicketMacroListProps {
  ticket: Ticket;
  onSelect: (content: string) => void;
  onClose: () => void;
}

export const TicketMacroList = ({ ticket, onSelect, onClose }: TicketMacroListProps) => {
  const [macros, setMacros] = useState<TicketMacro[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchMacros = async () => {
      setLoading(true);
      try {
        const data = await api.get<TicketMacro[]>('/macros');
        setMacros(data);
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
    m.atalho.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.conteudo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[350px] w-[320px] bg-white shadow-2xl rounded-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
      <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
          <MessageSquare size={12} className="text-blue-500" /> Respostas Prontas
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded text-slate-400">
          <X size={14} />
        </button>
      </div>

      <div className="p-2 border-b border-slate-100">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            autoFocus
            type="text" 
            placeholder="Buscar resposta..." 
            className="w-full h-8 pl-8 pr-3 text-xs bg-slate-50 border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-1 custom-scrollbar">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 size={20} className="text-blue-500 animate-spin" />
          </div>
        ) : filteredMacros.length > 0 ? (
          <div className="flex flex-col gap-0.5">
            {filteredMacros.map((macro) => (
              <button
                key={macro.id}
                onClick={() => handleSelect(macro)}
                className="w-full text-left p-2.5 hover:bg-blue-50/50 rounded-lg transition-colors group border border-transparent hover:border-blue-100"
              >
                <div className="font-bold text-[11px] text-slate-700 mb-0.5 group-hover:text-blue-700 capitalize">
                  {macro.atalho}
                </div>
                <div className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                  {macro.conteudo}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <MessageSquare size={24} className="text-slate-200 mb-2" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Nenhuma resposta encontrada</p>
          </div>
        )}
      </div>

      <div className="p-2 bg-slate-50 border-t border-slate-100 text-[9px] text-slate-400 font-medium text-center">
        DICA: Use macros para ganhar tempo
      </div>
    </div>
  );
};
