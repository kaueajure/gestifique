import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { BookOpen, Plus, Search, Edit2, Trash2, ShieldCheck, Globe, List, AlertCircle, X, Check, Save } from 'lucide-react';
import { User } from '../../types';
import MDEditor from '@uiw/react-md-editor';
import { motion, AnimatePresence } from 'motion/react';

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
  const [companies, setCompanies] = useState<{id: number, nome: string}[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
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

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    fetchArticles();
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
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar artigo.');
    }
  };

  const filtered = articles.filter(a => 
    a.titulo.toLowerCase().includes(search.toLowerCase()) || 
    (a.categoria || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen size={20} className="text-blue-600" />
            Base de Conhecimento
          </h3>
          <p className="text-sm text-slate-500 font-medium mt-1">Gerencie tutoriais e soluções para a equipe e clientes.</p>
        </div>
        <Button onClick={openNew} className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white">
          <Plus size={16} className="mr-2" /> Novo Artigo
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Buscar por título ou categoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-4 focus:ring-blue-100 outline-none"
          />
        </div>
        {currentUser.desenvolvedor && (
          <div className="w-full sm:w-64">
            <Select
              value={selectedCompanyId}
              onChange={setSelectedCompanyId}
              placeholder="Selecione uma empresa"
              options={[
                { value: '', label: 'Gestifique Central' },
                ...companies.map(c => ({ value: String(c.id), label: c.nome }))
              ]}
              buttonClassName="h-10"
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-8 flex justify-center"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Nenhum artigo encontrado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(article => (
            <div key={article.id} className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-slate-800">{article.titulo}</h4>
                  {article.publico ? (
                    <Badge variant="blue" className="text-[10px]"><Globe size={10} className="mr-1"/> Público</Badge>
                  ) : (
                    <Badge variant="slate" className="text-[10px] bg-slate-100 text-slate-600"><ShieldCheck size={10} className="mr-1"/> Interno</Badge>
                  )}
                  {!article.ativo && <Badge variant="red" className="text-[10px]">Inativo</Badge>}
                </div>
                {article.categoria && (
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded">
                    {article.categoria}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" onClick={() => openEdit(article)} className="h-8 px-2">
                  <Edit2 size={14} />
                </Button>
                <Button variant="outline" onClick={() => handleDelete(article.id)} className="h-8 px-2 text-red-600 hover:bg-red-50 hover:border-red-200 border-slate-200">
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative z-10"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <BookOpen size={18} className="text-blue-600"/>
                  {editingArticle ? 'Editar Artigo' : 'Novo Artigo'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200/50 rounded-full text-slate-500 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                <form id="knowledge-form" onSubmit={handleSave} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm font-semibold rounded-lg flex items-center gap-2 border border-red-100">
                      <AlertCircle size={16} /> {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Título do Artigo</label>
                      <input 
                        type="text" 
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-4 focus:ring-blue-100 outline-none"
                        value={formData.titulo}
                        onChange={e => setFormData(f => ({ ...f, titulo: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Categoria (opcional)</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Instalação, Faturamento..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-4 focus:ring-blue-100 outline-none"
                        value={formData.categoria}
                        onChange={e => setFormData(f => ({ ...f, categoria: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Conteúdo Markdown</label>
                    <div data-color-mode="light">
                      <MDEditor
                        value={formData.conteudo}
                        onChange={(val) => setFormData(f => ({ ...f, conteudo: val || '' }))}
                        height={350}
                        preview="edit"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className="relative flex items-center justify-center w-5 h-5">
                        <input 
                          type="checkbox" 
                          className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-md checked:bg-blue-600 checked:border-blue-600 transition-colors"
                          checked={formData.publico}
                          onChange={e => setFormData(f => ({ ...f, publico: e.target.checked }))}
                        />
                        <Check size={14} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none" strokeWidth={3} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 leading-none">Artigo Público</span>
                        <span className="text-[10px] font-medium text-slate-500 mt-0.5">Visível para clientes</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className="relative flex items-center justify-center w-5 h-5">
                        <input 
                          type="checkbox" 
                          className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-md checked:bg-emerald-600 checked:border-emerald-600 transition-colors"
                          checked={formData.ativo}
                          onChange={e => setFormData(f => ({ ...f, ativo: e.target.checked }))}
                        />
                        <Check size={14} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none" strokeWidth={3} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 leading-none">Ativo</span>
                        <span className="text-[10px] font-medium text-slate-500 mt-0.5">Disponível no sistema</span>
                      </div>
                    </label>
                  </div>
                </form>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit" form="knowledge-form" className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
                  <Save size={16} className="mr-2" /> Salvar
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Card>
  );
};
