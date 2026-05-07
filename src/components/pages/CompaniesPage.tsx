import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Empresa, User } from '../../types';
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
  Trash2,
  Target
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { MetricCard } from '../ui/MetricCard';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950 tracking-tight">Workspaces</h2>
          <p className="text-sm text-slate-500">Gerencie empresas clientes e instâncias do sistema.</p>
        </div>
        <Button onClick={() => { setSelectedCompany(null); setSaveError(null); setIsModalOpen(true); }}>
          <Plus size={18} className="mr-2" /> Novo Workspace
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         <MetricCard 
          label="Total de Empresas"
          value={stats.total.toString()}
          icon={<Building2 size={20} />}
          loading={loading && companies.length === 0}
         />
         <MetricCard 
          label="Empresas Ativas"
          value={stats.ativas.toString()}
          icon={<CheckCircle2 size={20} />}
          loading={loading && companies.length === 0}
         />
         <MetricCard 
          label="Empresas Inativas"
          value={stats.inativas.toString()}
          icon={<AlertCircle size={20} />}
          loading={loading && companies.length === 0}
         />
         <MetricCard 
          label="Total de Usuários"
          value={stats.usuarios.toString()}
          icon={<Users size={20} />}
          loading={loading && companies.length === 0}
         />
      </div>

      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1 group">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
             <input 
               type="text" 
               placeholder="Buscar por nome, CNPJ ou e-mail..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all" 
             />
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg w-full lg:w-auto">
             <button 
              onClick={() => setStatusFilter('todos')}
              className={cn(
                "h-7 px-4 rounded-md text-xs font-semibold transition-all",
                statusFilter === 'todos' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
             >
              Todas
             </button>
             <button 
              onClick={() => setStatusFilter('ativo')}
              className={cn(
                "h-7 px-4 rounded-md text-xs font-semibold transition-all",
                statusFilter === 'ativo' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
             >
              Ativas
             </button>
             <button 
              onClick={() => setStatusFilter('inativo')}
              className={cn(
                "h-7 px-4 rounded-md text-xs font-semibold transition-all",
                statusFilter === 'inativo' ? "bg-white text-red-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
             >
              Inativas
             </button>
          </div>
        </div>
      </Card>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600 text-sm font-medium animate-in fade-in slide-in-from-top-2">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && companies.length === 0 ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 bg-white rounded-xl border border-slate-100 shadow-sm animate-pulse" />
          ))
        ) : error ? (
           <div className="md:col-span-3 p-20 text-center flex flex-col items-center">
             <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
             <p className="text-sm text-slate-500">{error}</p>
             <Button variant="outline" size="sm" onClick={fetchCompanies} className="mt-4">Tentar novamente</Button>
           </div>
        ) : companies.length === 0 ? (
           <div className="md:col-span-3 p-20 text-center flex flex-col items-center">
             <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mb-4">
                <Building2 size={32} />
             </div>
             <h3 className="text-base font-semibold text-slate-900 mb-1">Nenhum workspace encontrado</h3>
             <p className="text-xs text-slate-500 max-w-xs mx-auto mb-6">Crie uma nova empresa para começar a gerenciar instâncias do sistema.</p>
             <Button 
               onClick={() => { setSelectedCompany(null); setSaveError(null); setIsModalOpen(true); }}
               size="sm"
             >
                <Plus size={16} className="mr-2" /> Novo Workspace
             </Button>
           </div>
        ) : companies.map((company) => (
          <Card 
            key={company.id}
            className="group relative hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
          >
             <div className="p-6">
               <div className="flex items-start justify-between mb-6">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105",
                    company.ativo ? "bg-slate-900" : "bg-slate-200"
                  )}>
                     <Building2 size={24} />
                  </div>
                  <div className="flex items-center gap-1">
                     <Button 
                       variant="ghost"
                       size="icon"
                       onClick={() => { setSelectedCompany(company); setSaveError(null); setIsModalOpen(true); }}
                       className="h-8 w-8 text-slate-400 hover:text-blue-600"
                     >
                        <Edit2 size={14} />
                     </Button>
                     <Button 
                       variant="ghost"
                       size="icon"
                       onClick={() => { setSelectedCompany(company); setIsStatusConfirmOpen(true); }}
                       className={cn(
                         "h-8 w-8",
                         company.ativo ? "text-slate-400 hover:text-red-600" : "text-slate-400 hover:text-emerald-600"
                       )}
                     >
                        <CheckCircle2 size={14} />
                     </Button>
                  </div>
               </div>

               <div className="space-y-1 mb-6">
                  <h3 className="text-lg font-semibold text-slate-950 leading-tight">{company.nome}</h3>
                  <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500 tracking-tight">
                     <Target size={12} className="text-slate-400" /> CNPJ: {company.cnpj || '----------'}
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                     <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        <Users size={12} className="text-indigo-500" /> Usuários
                     </div>
                     <div className="text-xl font-semibold text-slate-950">{company.total_usuarios || 0}</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                     <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        <Ticket size={12} className="text-amber-500" /> Chamados
                     </div>
                     <div className="text-xl font-semibold text-slate-950">{company.total_tickets || 0}</div>
                  </div>
               </div>

               <div className="pt-4 border-t border-slate-50 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                     <Mail size={14} className="text-slate-400" /> 
                     <span className="truncate">{company.email || 'Email não informado'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                     <Phone size={14} className="text-slate-400" /> 
                     <span>{company.telefone || 'Telefone não informado'}</span>
                  </div>
               </div>
               
               {!company.ativo && (
                 <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] rounded-xl flex items-center justify-center p-6 pointer-events-none">
                    <div className="bg-white px-4 py-2 rounded-lg shadow-md border border-slate-200 transform -rotate-1">
                       <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Workspace Inativo</span>
                    </div>
                 </div>
               )}
             </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedCompany ? 'Configurar Workspace' : 'Novo Workspace'}
        size="lg"
      >
        <form onSubmit={handleSaveCompany} className="space-y-4">
           {saveError && (
             <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs font-semibold mb-4">
                {saveError}
             </div>
           )}
           
           <Input 
             label="Nome Fantasia / Razão Social"
             name="nome" 
             defaultValue={selectedCompany?.nome} 
             required 
             placeholder="Ex: Minha Empresa LTDA"
           />

           <div className="grid md:grid-cols-2 gap-4">
              <Input 
                label="CNPJ"
                name="cnpj" 
                defaultValue={selectedCompany?.cnpj || ''} 
                placeholder="00.000.000/0000-00"
              />
              <Input 
                label="E-mail de Contato"
                name="email" 
                type="email" 
                defaultValue={selectedCompany?.email || ''} 
                placeholder="contato@empresa.com"
              />
           </div>

           <Input 
             label="Telefone Principal"
             name="telefone" 
             defaultValue={selectedCompany?.telefone || ''} 
             placeholder="(00) 00000-0000"
           />

           <div className="grid md:grid-cols-2 gap-4">
              <Input 
                label="Cor Principal (Hex)"
                name="cor_principal" 
                defaultValue={selectedCompany?.cor_principal || '#2563eb'} 
                placeholder="#000000"
              />
              <Input 
                label="URL da Logo"
                name="logo" 
                defaultValue={selectedCompany?.logo || ''} 
                placeholder="https://exemplo.com/logo.png"
              />
           </div>

           <div className="pt-4 flex justify-end gap-2">
              <Button 
                variant="ghost"
                type="button" 
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                loading={loadingSave}
              >
                {selectedCompany ? 'Salvar Alterações' : 'Criar Workspace'}
              </Button>
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
        variant={selectedCompany?.ativo ? 'danger' : 'info'}
      />
    </div>
  );
};

