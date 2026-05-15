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
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors group"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
            <ArrowLeft size={16} />
          </div>
          Voltar para a Base
        </button>
        
        <div className="bg-white p-8 md:p-12 border border-slate-200 rounded-[2.5rem] shadow-sm">
          <div className="mb-10 border-b border-slate-100 pb-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-full">
                {selectedArticle.categoria || 'Geral'}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <Clock size={12} />
                Publicado em {new Date(selectedArticle.created_at).toLocaleDateString()}
              </div>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-tight">{selectedArticle.titulo}</h1>
          </div>
          
          <div className="prose prose-slate max-w-none prose-headings:font-black prose-p:font-medium prose-p:text-slate-600" data-color-mode="light">
            <MDEditor.Markdown source={selectedArticle.conteudo} />
          </div>
          
          <div className="mt-16 pt-10 border-t border-slate-100 text-center">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.15em] mb-6">Ainda precisa de ajuda?</p>
            <button 
              onClick={() => onNavigate('new-ticket')}
              className="px-8 h-14 bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-blue-100 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              Abrir um Novo Chamado
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-12 bg-white rounded-[3rem] border border-slate-200 p-8 md:p-16 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-blue-600" />
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-6 lowercase">
            Como podemos te <span className="text-blue-600 underline decoration-blue-100 decoration-8 underline-offset-8">ajudar hoje?</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs mb-10">Central de autoatendimento gestifique</p>
          
          <div className="max-w-2xl mx-auto relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={24} />
            <input 
              type="text"
              placeholder="Pesquisar por assunto, dúvida ou erro..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-16 pl-16 pr-6 bg-slate-50 border-2 border-slate-100 shadow-inner rounded-3xl text-lg focus:bg-white focus:border-blue-500 focus:ring-8 focus:ring-blue-50/50 outline-none transition-all placeholder:text-slate-400 font-bold"
            />
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-50 rounded-full blur-3xl opacity-50" />
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Sidebar categories */}
        <div className="lg:col-span-3 space-y-6">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2 px-2">
            <Tag size={14} /> Categorias
          </h2>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "w-full text-left px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                selectedCategory === null 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-100" 
                  : "text-slate-500 hover:bg-slate-100"
              )}
            >
              Todos os Artigos
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                  selectedCategory === category 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-100" 
                    : "text-slate-500 hover:bg-slate-100"
                )}
              >
                {category}
              </button>
            ))}
          </div>
          
          <div className="p-6 bg-slate-900 rounded-3xl text-white">
            <BookOpen className="text-blue-400 mb-4" size={32} />
            <h3 className="font-black text-lg leading-tight mb-2">Manual do Gestifique</h3>
            <p className="text-xs font-medium text-slate-400 leading-relaxed mb-4">Aprenda a utilizar todos os recursos da nossa plataforma.</p>
            <button className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300">Acessar Guia →</button>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-9 space-y-8">
          <div className="flex items-center justify-between px-2">
            <h2 className="font-black text-2xl text-slate-900 lowercase italic">
              {selectedCategory ? `Artigos em ${selectedCategory}` : 'Todos os Artigos'}
            </h2>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {filtered.length} resultados
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={40}/></div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map(article => (
                <button
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className="text-left bg-white border border-slate-200 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-50 p-8 rounded-[2.5rem] transition-all group group relative overflow-hidden"
                >
                  <div className="flex items-start gap-5 relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white group-hover:rotate-6 transition-all shrink-0 shadow-sm">
                      <FileText size={24} />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-2">{article.categoria || 'Geral'}</div>
                      <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight mb-3">{article.titulo}</h3>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Ler Artigo <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem]">
              <div className="w-20 h-20 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search size={40} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2 lowercase">Nenhum artigo encontrado</h3>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-8">Tente usar termos mais genéricos ou procure por categoria</p>
              <button 
                onClick={() => {setSearch(''); setSelectedCategory(null);}}
                className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-900 hover:bg-slate-50 shadow-sm transition-all"
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
