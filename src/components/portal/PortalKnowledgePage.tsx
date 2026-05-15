import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Search, ChevronRight, FileText, Loader2, ArrowLeft } from 'lucide-react';
import MDEditor from '@uiw/react-md-editor';
import { PortalTab } from './PortalLayout';

interface PortalKnowledgePageProps {
  onNavigate: (tab: PortalTab) => void;
}

export const PortalKnowledgePage = ({ onNavigate }: PortalKnowledgePageProps) => {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const data = await api.get<any[]>('/portal/knowledge');
        setArticles(data);
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  const filtered = articles.filter(a => 
    a.titulo.toLowerCase().includes(search.toLowerCase()) || 
    (a.categoria && a.categoria.toLowerCase().includes(search.toLowerCase()))
  );

  if (selectedArticle) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <button 
          onClick={() => setSelectedArticle(null)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} /> Voltar para artigos
        </button>
        
        <div className="bg-white p-8 md:p-12 border border-slate-200 rounded-3xl shadow-sm">
          <div className="mb-8 border-b border-slate-100 pb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">{selectedArticle.titulo}</h1>
            <div className="text-sm font-medium text-slate-500">{selectedArticle.categoria || 'Geral'}</div>
          </div>
          
          <div className="prose prose-slate max-w-none" data-color-mode="light">
            <MDEditor.Markdown source={selectedArticle.conteudo} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="text-center py-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-4">Central de Ajuda</h1>
        <p className="text-slate-500 font-medium mb-8">Encontre respostas rapidamente em nossa base de conhecimento.</p>
        
        <div className="max-w-2xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Pesquisar por assunto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-14 pl-12 pr-4 bg-white border border-slate-200 shadow-sm rounded-2xl text-base focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400 font-medium"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-300" size={32}/></div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(article => (
            <button
              key={article.id}
              onClick={() => setSelectedArticle(article)}
              className="text-left bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md hover:shadow-blue-100 p-6 rounded-2xl transition-all group flex items-start flex-col gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shrink-0">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2 leading-snug">{article.titulo}</h3>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-2">{article.categoria || 'Geral'}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 border border-slate-100 rounded-3xl">
          <FileText size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-500 font-medium">Nenhum artigo encontrado.</p>
        </div>
      )}
    </div>
  );
};
