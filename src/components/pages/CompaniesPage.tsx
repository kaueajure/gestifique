import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Empresa } from '../../types';
import { 
  Building2, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  Mail, 
  Phone, 
  Globe, 
  Ticket, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

export const CompaniesPage = () => {
  const [companies, setCompanies] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Empresa | null>(null);
  const [loadingSave, setLoadingSave] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Empresa[]>('/companies');
      setCompanies(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar empresas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleSaveCompany = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoadingSave(true);
    setSaveError(null);
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());

    try {
      if (selectedCompany?.id) {
        await api.patch(`/companies/${selectedCompany.id}`, data);
      } else {
        await api.post('/companies', data);
      }
      setIsModalOpen(false);
      fetchCompanies();
    } catch (err: any) { 
      setSaveError(err.message || 'Erro ao salvar empresa.');
    } finally {
      setLoadingSave(false);
    }
  };

  const handleToggleStatus = async (company: Empresa) => {
    if (!confirm(`Tem certeza que deseja ${company.ativa ? 'desativar' : 'ativar'} esta empresa?`)) return;
    try {
      await api.patch(`/companies/${company.id}`, { ativa: !company.ativa });
      fetchCompanies();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Workspaces</h2>
          <p className="text-slate-500 font-medium text-lg">Gerencie empresas clientes e instâncias do sistema.</p>
        </div>
        <button 
          onClick={() => { setSelectedCompany(null); setSaveError(null); setIsModalOpen(true); }}
          className="h-14 px-10 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-3 w-full md:w-auto justify-center"
        >
          <Plus size={24} /> Novo Workspace
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading && companies.length === 0 ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 bg-white rounded-[40px] border border-slate-100 shadow-sm animate-pulse" />
          ))
        ) : error ? (
           <div className="md:col-span-3 p-20 text-center flex flex-col items-center">
             <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
             <p className="text-slate-500">{error}</p>
           </div>
        ) : companies.map((company) => (
          <motion.div 
            key={company.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative bg-white rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-8"
          >
             <div className="flex items-start justify-between mb-8">
                <div className={cn(
                  "w-16 h-16 rounded-[24px] flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110",
                  company.ativa ? "bg-slate-900" : "bg-slate-200"
                )}>
                   <Building2 size={32} />
                </div>
                <div className="flex items-center gap-2">
                   <button 
                     onClick={() => { setSelectedCompany(company); setIsModalOpen(true); }}
                     className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all"
                   >
                      <Edit2 size={18} />
                   </button>
                   <button 
                     onClick={() => handleToggleStatus(company)}
                     className={cn(
                       "w-10 h-10 flex items-center justify-center rounded-xl transition-all",
                       company.ativa ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                     )}
                   >
                      <CheckCircle2 size={18} />
                   </button>
                </div>
             </div>

             <div className="space-y-1 mb-8">
                <h3 className="text-xl font-black text-slate-900 leading-tight">{company.nome}</h3>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                   <Globe size={12} className="text-blue-500" /> CNPJ: {company.cnpj || '----------'}
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                   <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      <Users size={12} className="text-indigo-500" /> Usuários
                   </div>
                   <div className="text-2xl font-black text-slate-900">--</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                   <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      <Ticket size={12} className="text-amber-500" /> Chamados
                   </div>
                   <div className="text-2xl font-black text-slate-900">--</div>
                </div>
             </div>

             <div className="pt-6 border-t border-slate-50 space-y-3">
                <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                   <Mail size={14} className="text-blue-400" /> {company.email || 'Email não informado'}
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                   <Phone size={14} className="text-blue-400" /> {company.telefone || 'Telefone não informado'}
                </div>
             </div>
             
             {!company.ativa && (
               <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] rounded-[40px] flex items-center justify-center p-8 pointer-events-none">
                  <div className="bg-white px-6 py-3 rounded-2xl shadow-xl shadow-slate-200 border border-slate-100 transform -rotate-2">
                     <span className="text-xs font-black text-red-600 uppercase tracking-widest">Workspace Inativo</span>
                  </div>
               </div>
             )}
          </motion.div>
        ))}
      </div>

      {/* Company Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedCompany ? 'Configurar Workspace' : 'Novo Workspace'}
        size="lg"
      >
        <form onSubmit={handleSaveCompany} className="space-y-6">
           {saveError && (
             <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold mb-4">
                {saveError}
             </div>
           )}
           <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nome Fantasia / Razão Social</label>
              <input 
                name="nome" 
                defaultValue={selectedCompany?.nome} 
                required 
                className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all outline-none" 
              />
           </div>

           <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">CNPJ</label>
                <input 
                  name="cnpj" 
                  defaultValue={selectedCompany?.cnpj || ''} 
                  className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all outline-none" 
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">E-mail de Contato</label>
                <input 
                  name="email" 
                  type="email" 
                  defaultValue={selectedCompany?.email || ''} 
                  className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all outline-none" 
                  placeholder="contato@empresa.com"
                />
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Telefone Principal</label>
              <input 
                name="telefone" 
                defaultValue={selectedCompany?.telefone || ''} 
                className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all outline-none" 
                placeholder="(00) 00000-0000"
              />
           </div>

           <div className="pt-6 flex justify-end gap-3 font-black text-sm uppercase tracking-widest">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="h-14 px-8 text-slate-400 hover:text-slate-600"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={loadingSave}
                className="h-14 px-12 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center gap-3"
              >
                {loadingSave ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                {selectedCompany ? 'Salvar Configurações' : 'Criar Workspace'}
              </button>
           </div>
        </form>
      </Modal>
    </div>
  );
};
