import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { PortalTab } from './PortalLayout';
import { User } from '../../types';
import { Send, Sparkles, BookOpen } from 'lucide-react';
import { useTicketOptions } from '../../hooks/useTicketOptions';

interface PortalNewTicketPageProps {
  onNavigate: (tab: PortalTab, ticketId?: number) => void;
  currentUser: User;
}

export const PortalNewTicketPage = ({ onNavigate, currentUser }: PortalNewTicketPageProps) => {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('');
  const [servico, setServico] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [suggestions, setSuggestions] = useState<any[]>([]);
  
  const { activeCategories, activeServices } = useTicketOptions(currentUser.empresa_id || undefined);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (titulo.length < 5 && descricao.length < 10) {
        setSuggestions([]);
        return;
      }
      try {
        const query = encodeURIComponent(`${titulo} ${descricao}`.trim());
        const result = await api.get<any[]>(`/portal/knowledge/search?q=${query}`);
        setSuggestions(result);
      } catch(e) {}
    };
    
    const timeout = setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(timeout);
  }, [titulo, descricao]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !descricao) {
      setError('Por favor, preencha o título e a descrição.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.post<{message: string, ticketId: number}>('/portal/tickets', {
        titulo,
        descricao,
        categoria,
        servico
      });
      onNavigate('tickets', data.ticketId);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar chamado');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Abrir Novo Chamado</h1>
          <p className="text-slate-500 font-medium">Preencha os detalhes abaixo para que possamos te ajudar da melhor forma.</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-md border border-red-100">
                {error}
              </div>
            )}
            
            <Input
              label="Assunto do Chamado"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ex: Problema de acesso, Dúvida sobre funcionalidade..."
              required
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 px-1">Categoria (Opcional)</label>
                <Select
                  value={categoria}
                  onChange={setCategoria}
                  options={[
                    { value: '', label: 'Selecione...' },
                    ...activeCategories.map(c => ({ value: c.valor, label: c.nome }))
                  ]}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 px-1">Serviço (Opcional)</label>
                <Select
                  value={servico}
                  onChange={setServico}
                  options={[
                    { value: '', label: 'Selecione...' },
                    ...activeServices.map(s => ({ value: s.valor, label: s.nome }))
                  ]}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 px-1">Descrição Detalhada</label>
              <textarea
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                required
                rows={6}
                placeholder="Descreva o máximo de detalhes possível para agilizarmos seu atendimento..."
                className="w-full resize-y p-3 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" disabled={loading} className="w-full sm:w-auto h-9 px-6 text-sm">
                {loading ? 'Criando...' : <span className="flex items-center"><Send size={16} className="mr-2" /> Enviar Chamado</span>}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <div className="lg:col-span-1">
        {suggestions.length > 0 && (
          <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-6 sticky top-24">
            <div className="flex items-center gap-2 text-blue-800 font-bold mb-4">
              <Sparkles size={20} className="text-blue-500" />
              Talvez isso ajude?
            </div>
            <p className="text-sm text-blue-600/80 mb-4 font-medium leading-relaxed">
              Encontramos alguns artigos que podem resolver sua dúvida antes mesmo de abrir o chamado:
            </p>
            <div className="space-y-3">
              {suggestions.map(article => (
                <button
                  key={article.id}
                  onClick={() => onNavigate('knowledge', article.id)}
                  className="w-full text-left bg-white border border-blue-100 hover:border-blue-300 hover:shadow-md p-4 rounded-xl transition-all group flex items-start gap-3"
                >
                  <BookOpen size={16} className="text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 group-hover:text-blue-700 transition-colors line-clamp-2 leading-snug">{article.titulo}</h4>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
