import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Search, ChevronRight, FileText, Loader2, ArrowLeft, Tag, BookOpen, Clock } from 'lucide-react';
import MDEditor from '@uiw/react-md-editor';
import { PortalTab } from './PortalLayout';
import { cn } from '../../lib/utils';

interface PortalKnowledgePageProps {
  onNavigate: (tab: PortalTab) => void;
  initialArticleId?: number | null;
}

export const PortalKnowledgePage = ({ onNavigate, initialArticleId }: PortalKnowledgePageProps) => {
  const [articles, setArticles] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [articlesData, categoriesData] = await Promise.all([
          api.get<any[]>('/portal/knowledge'),
          api.get<string[]>('/portal/knowledge/categories')
        ]);
        setArticles(articlesData);
        setCategories(categoriesData);

        if (initialArticleId) {
          const article = articlesData.find(a => a.id === initialArticleId);
          if (article) {
            setSelectedArticle(article);
          } else {
            // Se não estiver na lista inicial (pode ser recente ou filtrado), busca no endpoint individual
            try {
              const specificArticle = await api.get<any>(`/portal/knowledge/article/${initialArticleId}`);
              setSelectedArticle(specificArticle);
            } catch (err) {
              console.error('Artigo não encontrado');
            }
          }
        }
      } catch (e) {
        console.error('Error fetching knowledge data:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [initialArticleId]);

  const filtered = articles.filter(a => {
    const matchesSearch = a.titulo.toLowerCase().includes(search.toLowerCase()) || 
                         (a.categoria && a.categoria.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory ? a.categoria === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  if (selectedArticle) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <button 
          onClick={() => setSelectedArticle(null)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors group"
        >
          <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
            <ArrowLeft size={16} />
          </div>
          Voltar para a Base
        </button>
        
        <div className="bg-white p-8 md:p-12 border border-slate-200 rounded-2xl shadow-sm">
          <div className="mb-10 border-b border-slate-100 pb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="px-2.5 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-md">
                {selectedArticle.categoria || 'Geral'}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <Clock size={14} />
                Publicado em {new Date(selectedArticle.created_at).toLocaleDateString()}
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-tight">{selectedArticle.titulo}</h1>
          </div>
          
          <div className="prose prose-slate max-w-none prose-headings:font-semibold prose-p:text-slate-600" data-color-mode="light">
            <MDEditor.Markdown source={selectedArticle.conteudo} />
          </div>
          
          <div className="mt-16 pt-10 border-t border-slate-100 text-center space-y-4">
            <p className="text-sm font-semibold text-slate-500 uppercase">Ainda precisa de ajuda?</p>
            <button 
              onClick={() => onNavigate('new-ticket')}
              className="px-6 h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-md shadow-sm transition-colors"
            >
              Abrir um Novo Chamado
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-10 bg-white rounded-xl border border-slate-200 p-8 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-blue-600" />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-4">
            Como podemos te ajudar hoje?
          </h1>
          <p className="text-slate-500 text-sm mb-8">Central de autoatendimento</p>
          
          <div className="max-w-2xl mx-auto relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input 
              type="text"
              placeholder="Pesquisar por assunto, dúvida ou erro..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-12 pl-12 pr-6 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar categories */}
        <div className="lg:col-span-3 space-y-6">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
            <Tag size={14} /> Categorias
          </h2>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors",
                selectedCategory === null 
                  ? "bg-blue-50 text-blue-700" 
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              Todos os Artigos
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  selectedCategory === category 
                    ? "bg-blue-50 text-blue-700" 
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                {category}
              </button>
            ))}
          </div>
          
          <div className="p-5 bg-slate-900 rounded-xl text-white">
            <BookOpen className="text-blue-400 mb-3" size={24} />
            <h3 className="font-semibold text-base mb-1">Manual do Gestifique</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">Aprenda a utilizar todos os recursos da nossa plataforma.</p>
            <button className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors">Acessar Guia →</button>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-9 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-xl text-slate-900">
              {selectedCategory ? `Artigos em ${selectedCategory}` : 'Todos os Artigos'}
            </h2>
            <span className="text-xs font-medium text-slate-500">
              {filtered.length} resultados
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={32}/></div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map(article => (
                <button
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className="text-left bg-white border border-slate-200 hover:border-blue-300 hover:shadow-sm p-5 rounded-xl transition-all group flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shrink-0">
                    <FileText size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-1">{article.categoria || 'Geral'}</div>
                    <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug mb-2">{article.titulo}</h3>
                    <div className="text-xs font-medium text-slate-500 flex items-center gap-1">
                      Ler Artigo <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
              <div className="w-16 h-16 bg-white border border-slate-100 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Search size={24} />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-1">Nenhum artigo encontrado</h3>
              <p className="text-slate-500 text-sm mb-6">Tente usar termos mais genéricos ou procure por categoria</p>
              <button 
                onClick={() => {setSearch(''); setSelectedCategory(null);}}
                className="px-5 py-2 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Limpar Filtros
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
