import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { BookOpen, Plus, Search, Edit2, Trash2, ShieldCheck, Globe, List, AlertCircle, X, Check, Save, Filter, Tag, LayoutGrid, LayoutList } from 'lucide-react';
import { User } from '../../types';
import MDEditor from '@uiw/react-md-editor';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

interface KnowledgeManagerProps {
  currentUser: User;
}

interface Article {
  id: number;
  titulo: string;
  conteudo: string;
  categoria: string | null;
  publico: boolean;
  ativo: boolean;
  created_at: string;
}

export const KnowledgePage = ({ currentUser }: KnowledgeManagerProps) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [companies, setCompanies] = useState<{id: number, nome: string}[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    titulo: '',
    categoria: '',
    conteudo: '',
    publico: false,
    ativo: true,
  });

  const loadCompanies = async () => {
    if (!currentUser.desenvolvedor) return;
    try {
      const data = await api.get<any[]>('/companies?status=ativo');
      setCompanies(data);
    } catch {}
  };

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const qs = currentUser.desenvolvedor && selectedCompanyId ? `?empresa_id=${selectedCompanyId}` : '';
      const data = await api.get<any[]>(`/knowledge${qs}`);
      setArticles(data.map(d => ({
        ...d,
        publico: Boolean(Number(d.publico)),
        ativo: Boolean(Number(d.ativo)),
      })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const qs = currentUser.desenvolvedor && selectedCompanyId ? `?empresa_id=${selectedCompanyId}` : '';
      const data = await api.get<string[]>(`/knowledge/categories${qs}`);
      setCategories(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    fetchArticles();
    fetchCategories();
  }, [selectedCompanyId]);

  const openNew = () => {
    setEditingArticle(null);
    setFormData({ titulo: '', categoria: '', conteudo: '', publico: false, ativo: true });
    setIsModalOpen(true);
    setError(null);
  };

  const openEdit = (a: Article) => {
    setEditingArticle(a);
    setFormData({
      titulo: a.titulo,
      categoria: a.categoria || '',
      conteudo: a.conteudo,
      publico: a.publico,
      ativo: a.ativo
    });
    setIsModalOpen(true);
    setError(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza? Essa ação não pode ser desfeita.')) return;
    try {
      await api.delete(`/knowledge/${id}`);
      setArticles(prev => prev.filter(a => a.id !== id));
      fetchCategories();
    } catch (err) {
      alert('Erro ao excluir artigo');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo || !formData.conteudo) {
      setError('Título e conteúdo são obrigatórios.');
      return;
    }
    if (!editingArticle && currentUser.desenvolvedor && !selectedCompanyId) {
       setError('Selecione uma empresa antes de criar o artigo.');
       return;
    }
    
    setError(null);
    try {
      if (editingArticle) {
        await api.patch(`/knowledge/${editingArticle.id}`, { ...formData, empresa_id: selectedCompanyId || undefined });
      } else {
        await api.post('/knowledge', { ...formData, empresa_id: selectedCompanyId || undefined });
      }
      setIsModalOpen(false);
      fetchArticles();
      fetchCategories();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar artigo.');
    }
  };

  const filtered = articles.filter(a => {
    const matchesSearch = a.titulo.toLowerCase().includes(search.toLowerCase()) || 
                         (a.categoria || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory ? a.categoria === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header Centralizado */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3 lowercase italic">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <BookOpen size={24} />
              </div>
              Base de Conhecimento
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Documentação técnica para equipe e autoatendimento para clientes</p>
          </div>
          <Button onClick={openNew} className="shrink-0 h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-blue-100 transition-all hover:-translate-y-0.5 active:translate-y-0">
            <Plus size={16} className="mr-2" /> Novo Artigo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Filtros e Busca */}
        <div className="lg:col-span-3 space-y-6">
           <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Busca</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text"
                    placeholder="Título ou termo..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                  />
                </div>
              </div>

              {currentUser.desenvolvedor && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Empresa</label>
                  <Select
                    value={selectedCompanyId}
                    onChange={setSelectedCompanyId}
                    placeholder="Selecione..."
                    options={[
                      { value: '', label: 'Gestifique Central' },
                      ...companies.map(c => ({ value: String(c.id), label: c.nome }))
                    ]}
                    buttonClassName="h-10 bg-slate-50 border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Categoria</label>
                <Select
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  placeholder="Todas as categorias"
                  options={[
                    { value: '', label: 'Todas as categorias' },
                    ...categories.map(c => ({ value: c, label: c }))
                  ]}
                  buttonClassName="h-10 bg-slate-50 border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest"
                />
              </div>

              <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visualização</span>
                 <div className="bg-slate-50 p-1 rounded-lg flex gap-1">
                    <button 
                      onClick={() => setViewMode('list')}
                      className={cn("p-1.5 rounded transition-all", viewMode === 'list' ? "bg-white shadow-sm text-blue-600" : "text-slate-400 hover:text-slate-600")}
                    >
                      <LayoutList size={16} />
                    </button>
                    <button 
                      onClick={() => setViewMode('grid')}
                      className={cn("p-1.5 rounded transition-all", viewMode === 'grid' ? "bg-white shadow-sm text-blue-600" : "text-slate-400 hover:text-slate-600")}
                    >
                      <LayoutGrid size={16} />
                    </button>
                 </div>
              </div>
           </div>
        </div>

        {/* Listagem */}
        <div className="lg:col-span-9">
          {loading ? (
            <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
               <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Carregando Acervo...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white p-20 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center">
              <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-6" />
              <h3 className="text-xl font-black text-slate-900 mb-2 lowercase">nenhum artigo por aqui</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ajuste os filtros ou crie um novo artigo agora mesmo</p>
              <Button onClick={openNew} variant="outline" className="mt-8 h-10 px-6 border-slate-200 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all">
                 <Plus size={14} className="mr-2" /> começar agora
              </Button>
            </div>
          ) : (
            <div className={cn(
              "grid gap-4",
              viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
            )}>
              {filtered.map(article => (
                <div key={article.id} className="group bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:shadow-blue-50 transition-all flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center gap-2">
                          {article.publico ? (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-[0.2em] rounded-full border border-emerald-100">
                               <Globe size={10} strokeWidth={3} /> Público
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] rounded-full border border-slate-200">
                               <ShieldCheck size={10} strokeWidth={3} /> Interno
                            </div>
                          )}
                          {!article.ativo && (
                            <div className="px-2.5 py-1 bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-[0.2em] rounded-full border border-red-100">Inativo</div>
                          )}
                       </div>
                       <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <button 
                            onClick={() => openEdit(article)}
                            className="w-8 h-8 rounded-lg bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => handleDelete(article.id)}
                            className="w-8 h-8 rounded-lg bg-slate-50 text-slate-600 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                       </div>
                    </div>
                    
                    <h4 className="font-black text-slate-900 leading-tight mb-2 group-hover:text-blue-600 transition-colors uppercase text-[11px] tracking-widest">{article.titulo}</h4>
                    
                    {article.categoria && (
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                         <Tag size={10} /> {article.categoria}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editor Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 sm:p-12">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
              onClick={() => setIsModalOpen(false)}
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl max-h-full overflow-hidden flex flex-col relative z-10 border border-white/20"
            >
              <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-900 text-2xl lowercase italic flex items-center gap-3">
                    <BookOpen size={24} className="text-blue-600"/>
                    {editingArticle ? 'Editar Artigo' : 'Novo Artigo'}
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Configure o conteúdo e visibilidade da documentação</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-500 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-10 overflow-y-auto flex-1 custom-scrollbar bg-slate-50/30">
                <form id="knowledge-form" onSubmit={handleSave} className="space-y-8">
                  {error && (
                    <div className="p-4 bg-red-50 text-red-600 text-[11px] font-black uppercase tracking-widest rounded-2xl flex items-center gap-3 border border-red-100">
                      <AlertCircle size={18} /> {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Título do Artigo</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ex: Como configurar seu e-mail..."
                        className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 text-xs font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
                        value={formData.titulo}
                        onChange={e => setFormData(f => ({ ...f, titulo: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-3 relative">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Categoria</label>
                      <input 
                        type="text" 
                        placeholder="Selecione ou digite uma nova..."
                        className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 text-xs font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
                        value={formData.categoria}
                        onChange={e => setFormData(f => ({ ...f, categoria: e.target.value }))}
                        list="category-suggestions"
                      />
                      <datalist id="category-suggestions">
                        {categories.map(c => <option key={c} value={c} />)}
                      </datalist>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Conteúdo (Markdown)</label>
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" data-color-mode="light">
                      <MDEditor
                        value={formData.conteudo}
                        onChange={(val) => setFormData(f => ({ ...f, conteudo: val || '' }))}
                        height={400}
                        preview="edit"
                        className="border-none shadow-none"
                        textareaProps={{
                          placeholder: 'Utilize markdown para formatar seu texto...'
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-10 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <label className="flex items-center gap-4 cursor-pointer group">
                      <div className="relative flex items-center justify-center w-6 h-6">
                        <input 
                          type="checkbox" 
                          className="peer appearance-none w-6 h-6 border-2 border-slate-200 rounded-lg checked:bg-blue-600 checked:border-blue-600 transition-all hover:border-blue-300"
                          checked={formData.publico}
                          onChange={e => setFormData(f => ({ ...f, publico: e.target.checked }))}
                        />
                        <Check size={14} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none" strokeWidth={4} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none">Artigo Público</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Clientes poderão acessar</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-4 cursor-pointer group">
                      <div className="relative flex items-center justify-center w-6 h-6">
                        <input 
                          type="checkbox" 
                          className="peer appearance-none w-6 h-6 border-2 border-slate-200 rounded-lg checked:bg-emerald-600 checked:border-emerald-600 transition-all hover:border-emerald-300"
                          checked={formData.ativo}
                          onChange={e => setFormData(f => ({ ...f, ativo: e.target.checked }))}
                        />
                        <Check size={14} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none" strokeWidth={4} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none">Página Ativa</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Disponível para visualização</span>
                      </div>
                    </label>
                  </div>
                </form>
              </div>

              <div className="px-10 py-8 border-t border-slate-100 flex items-center justify-end gap-3 bg-white">
                <Button variant="ghost" className="h-12 px-8 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600" onClick={() => setIsModalOpen(false)}>Descartar</Button>
                <Button type="submit" form="knowledge-form" className="h-12 px-12 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-xl shadow-blue-100 transition-all">
                  <Save size={16} className="mr-2" /> {editingArticle ? 'Atualizar Artigo' : 'Publicar Agora'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
