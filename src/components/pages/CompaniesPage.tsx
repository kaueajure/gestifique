import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Empresa } from '../../types';
import { 
  Building2, 
  Plus, 
  Search, 
  Edit2, 
  Mail, 
  Phone, 
  Ticket, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Target
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { MetricCard } from '../ui/MetricCard';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

import { AccessDenied } from '../ui/AccessDenied';

interface CompaniesPageProps {
  currentUser: User | null;
}

export const CompaniesPage = ({ currentUser }: CompaniesPageProps) => {
  if (!currentUser?.desenvolvedor) {
    return <AccessDenied />;
  }

  const [companies, setCompanies] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Empresa | null>(null);
  const [loadingSave, setLoadingSave] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');

  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      if (searchTerm) query.append('search', searchTerm);
      if (statusFilter !== 'todos') query.append('status', statusFilter);
      
      const data = await api.get<Empresa[]>(`/companies?${query.toString()}`);
      setCompanies(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar empresas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCompanies();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

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
      showSuccess(`Empresa ${selectedCompany?.id ? 'atualizada' : 'criada'} com sucesso!`);
      setIsModalOpen(false);
      fetchCompanies();
    } catch (err: any) { 
      setSaveError(err.message || 'Erro ao salvar empresa.');
    } finally {
      setLoadingSave(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedCompany) return;
    try {
      await api.patch(`/companies/${selectedCompany.id}/status`, { ativo: !selectedCompany.ativo });
      showSuccess(`Empresa ${!selectedCompany.ativo ? 'ativada' : 'desativada'} com sucesso!`);
      fetchCompanies();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const stats = {
    total: companies.length,
    ativas: companies.filter(c => c.ativo).length,
    inativas: companies.filter(c => !c.ativo).length,
    usuarios: companies.reduce((acc, c) => acc + Number(c.total_usuarios || 0), 0)
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

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
         <MetricCard 
          label="Total de Empresas"
          value={stats.total.toString()}
          icon={<Building2 />}
          color="slate"
          loading={loading && companies.length === 0}
         />
         <MetricCard 
          label="Empresas Ativas"
          value={stats.ativas.toString()}
          icon={<CheckCircle2 />}
          color="emerald"
          loading={loading && companies.length === 0}
         />
         <MetricCard 
          label="Empresas Inativas"
          value={stats.inativas.toString()}
          icon={<AlertCircle />}
          color="red"
          loading={loading && companies.length === 0}
         />
         <MetricCard 
          label="Total de Usuários"
          value={stats.usuarios.toString()}
          icon={<Users />}
          color="indigo"
          loading={loading && companies.length === 0}
         />
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 group w-full">
           <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
           <input 
            type="text" 
            placeholder="Buscar por nome, CNPJ ou e-mail..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-14 bg-slate-50 border-none rounded-2xl pl-14 pr-6 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all" 
           />
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-[20px] w-full lg:w-auto">
           <button 
            onClick={() => setStatusFilter('todos')}
            className={cn(
              "h-11 px-6 rounded-[14px] font-black text-xs transition-all",
              statusFilter === 'todos' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
           >
            Todas
           </button>
           <button 
            onClick={() => setStatusFilter('ativo')}
            className={cn(
              "h-11 px-6 rounded-[14px] font-black text-xs transition-all",
              statusFilter === 'ativo' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
           >
            Ativas
           </button>
           <button 
            onClick={() => setStatusFilter('inativo')}
            className={cn(
              "h-11 px-6 rounded-[14px] font-black text-xs transition-all",
              statusFilter === 'inativo' ? "bg-white text-red-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
           >
            Inativas
           </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600 text-sm font-bold shadow-sm animate-in fade-in slide-in-from-top-2">
          {successMsg}
        </div>
      )}

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
        ) : companies.length === 0 ? (
           <div className="md:col-span-3 p-20 text-center flex flex-col items-center">
             <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-6">
                <Building2 size={40} />
             </div>
             <h3 className="text-xl font-black text-slate-900 mb-2">Nenhum workspace encontrado</h3>
             <p className="text-slate-500 max-w-xs mx-auto mb-8">Crie uma nova empresa para começar a gerenciar instâncias do sistema.</p>
             <button 
               onClick={() => { setSelectedCompany(null); setSaveError(null); setIsModalOpen(true); }}
               className="h-12 px-8 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2"
             >
                <Plus size={18} /> Novo Workspace
             </button>
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
                  company.ativo ? "bg-slate-900" : "bg-slate-200"
                )}>
                   <Building2 size={32} />
                </div>
                <div className="flex items-center gap-2">
                   <button 
                     onClick={() => { setSelectedCompany(company); setSaveError(null); setIsModalOpen(true); }}
                     className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all"
                   >
                      <Edit2 size={18} />
                   </button>
                   <button 
                     onClick={() => { setSelectedCompany(company); setIsStatusConfirmOpen(true); }}
                     className={cn(
                       "w-10 h-10 flex items-center justify-center rounded-xl transition-all",
                       company.ativo ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                     )}
                   >
                      <CheckCircle2 size={18} />
                   </button>
                </div>
             </div>

             <div className="space-y-1 mb-8">
                <h3 className="text-xl font-black text-slate-900 leading-tight">{company.nome}</h3>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                   <Target size={12} className="text-blue-500" /> CNPJ: {company.cnpj || '----------'}
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                   <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      <Users size={12} className="text-indigo-500" /> Usuários
                   </div>
                   <div className="text-2xl font-black text-slate-900">{company.total_usuarios || 0}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                   <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      <Ticket size={12} className="text-amber-500" /> Chamados
                   </div>
                   <div className="text-2xl font-black text-slate-900">{company.total_tickets || 0}</div>
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
             
             {!company.ativo && (
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

           <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Cor Principal (Hex)</label>
                <input 
                  name="cor_principal" 
                  defaultValue={selectedCompany?.cor_principal || '#2563eb'} 
                  className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all outline-none" 
                  placeholder="#000000"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">URL da Logo</label>
                <input 
                  name="logo" 
                  defaultValue={selectedCompany?.logo || ''} 
                  className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all outline-none" 
                  placeholder="https://exemplo.com/logo.png"
                />
              </div>
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
      <ConfirmDialog 
        isOpen={isStatusConfirmOpen}
        onClose={() => setIsStatusConfirmOpen(false)}
        onConfirm={handleToggleStatus}
        title={selectedCompany?.ativo ? 'Desativar Workspace' : 'Ativar Workspace'}
        description={`Tem certeza que deseja ${selectedCompany?.ativo ? 'desativar' : 'ativar'} o workspace: ${selectedCompany?.nome}? Todos os usuários da empresa perderão o acesso.`}
        confirmLabel={selectedCompany?.ativo ? 'Desativar' : 'Ativar'}
        cancelLabel="Cancelar"
        variant={selectedCompany?.ativo ? 'danger' : 'info'}
      />
    </div>
  );
};
