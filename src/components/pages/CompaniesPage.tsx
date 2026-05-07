import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Empresa, User } from '../../types';
import { 
  Building2, 
  Plus, 
  Search, 
  Edit2, 
  Phone, 
  Ticket, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Target,
  XCircle
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { MetricCard } from '../ui/MetricCard';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

import { AccessDenied } from '../ui/AccessDenied';

type CompanyPayload = {
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  cor_principal: string;
  logo: string;
};

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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar empresas.';
      setError(message);
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
    const formData = new FormData(e.currentTarget);

    try {
      const payload: CompanyPayload = {
        nome: String(formData.get('nome') || ''),
        cnpj: String(formData.get('cnpj') || ''),
        email: String(formData.get('email') || ''),
        telefone: String(formData.get('telefone') || ''),
        cor_principal: String(formData.get('cor_principal') || '#2563eb'),
        logo: String(formData.get('logo') || ''),
      };

      if (!payload.nome) {
        setSaveError('O nome da empresa é obrigatório.');
        setLoadingSave(false);
        return;
      }

      if (selectedCompany?.id) {
        await api.patch(`/companies/${selectedCompany.id}`, payload);
      } else {
        await api.post('/companies', payload);
      }
      showSuccess(`Empresa ${selectedCompany?.id ? 'atualizada' : 'criada'} com sucesso!`);
      setIsModalOpen(false);
      fetchCompanies();
    } catch (err) { 
      const message = err instanceof Error ? err.message : 'Erro ao salvar empresa.';
      setSaveError(message);
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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao alterar status.';
      setError(message);
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
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Empresas</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Gestão de Workspaces</p>
        </div>
        <Button size="sm" onClick={() => { setSelectedCompany(null); setSaveError(null); setIsModalOpen(true); }} className="font-bold text-[10px] uppercase tracking-widest px-4 h-9">
          <Plus size={14} className="mr-2" /> Nova Empresa
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         <MetricCard 
          label="Total de Empresas"
          value={stats.total.toString()}
          icon={<Building2 size={16} />}
          loading={loading && companies.length === 0}
          className="border-slate-50"
         />
         <MetricCard 
          label="Empresas Ativas"
          value={stats.ativas.toString()}
          icon={<CheckCircle2 size={16} />}
          loading={loading && companies.length === 0}
          className="border-slate-50"
         />
         <MetricCard 
          label="Empresas Inativas"
          value={stats.inativas.toString()}
          icon={<AlertCircle size={16} />}
          loading={loading && companies.length === 0}
          className="border-slate-50"
         />
         <MetricCard 
          label="Total de Usuários"
          value={stats.usuarios.toString()}
          icon={<Users size={16} />}
          loading={loading && companies.length === 0}
          className="border-slate-50"
         />
      </div>

      <Card>
        <div className="p-4 border-b border-slate-50 flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
             <input 
               type="text" 
               placeholder="Buscar por nome ou CNPJ..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full h-9 bg-slate-50 border border-slate-100 rounded-lg pl-9 pr-4 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400 placeholder:font-medium transition-all" 
             />
          </div>
          <div className="flex bg-slate-100/50 p-1 rounded-lg">
             {[
               { id: 'todos', label: 'Todas' },
               { id: 'ativo', label: 'Ativas' },
               { id: 'inativo', label: 'Inativas' }
             ].map((f) => (
               <button 
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={cn(
                  "h-7 px-4 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all",
                  statusFilter === f.id 
                    ? "bg-white text-slate-900 shadow-sm" 
                    : "text-slate-400 hover:text-slate-600"
                )}
               >
                {f.label}
               </button>
             ))}
          </div>
        </div>

        {successMsg && (
          <div className="mx-4 mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600 text-xs font-bold animate-in fade-in slide-in-from-top-2">
            {successMsg}
          </div>
        )}

        {loading && companies.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-3">
             <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
             <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Carregando empresas...</p>
          </div>
        ) : error ? (
           <div className="p-20 text-center flex flex-col items-center">
             <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
             <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{error}</p>
             <Button variant="outline" size="sm" onClick={fetchCompanies} className="mt-4 text-[10px] font-bold uppercase tracking-widest">Tentar novamente</Button>
           </div>
        ) : companies.length === 0 ? (
           <div className="p-20 text-center flex flex-col items-center">
             <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mb-4">
                <Building2 size={32} />
             </div>
             <h3 className="text-sm font-bold text-slate-900">Nenhuma empresa encontrada</h3>
             <p className="text-xs font-medium text-slate-500 max-w-xs mx-auto mt-1">Crie sua primeira empresa cliente para começar.</p>
           </div>
        ) : (
          <div className="overflow-x-auto">
             <table className="w-full">
               <thead>
                 <tr className="bg-slate-50/30">
                   <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Empresa</th>
                   <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Metadados</th>
                   <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Engajamento</th>
                   <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100/50">
                 {companies.map((company) => (
                   <tr key={company.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                           <div className={cn(
                             "w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm border",
                             company.ativo ? "bg-slate-900 border-slate-950" : "bg-white text-slate-300 border-slate-100"
                           )}>
                              <Building2 size={20} />
                           </div>
                           <div className="min-w-0">
                              <div className="text-sm font-bold text-slate-900 truncate tracking-tight">{company.nome || "Empresa"}</div>
                              <div className="text-[10px] font-bold text-slate-400 truncate tracking-tighter uppercase">{company.email || 'Email não informado'}</div>
                           </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                         <div className="space-y-1">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                               <Target size={10} className="text-slate-300" /> {company.cnpj || 'CNPJ não informado'}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-300 uppercase tracking-tight">
                               <Phone size={10} className="text-slate-300" /> {company.telefone || 'Telefone não informado'}
                            </div>
                         </div>
                      </td>
                      <td className="px-5 py-4">
                         <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 min-w-[60px]">
                               <Users size={12} className="text-indigo-400" />
                               <span className="text-xs font-bold text-slate-600">{company.total_usuarios || 0}</span>
                            </div>
                            <div className="flex items-center gap-1.5 min-w-[60px]">
                               <Ticket size={12} className="text-amber-400" />
                               <span className="text-xs font-bold text-slate-600">{company.total_tickets || 0}</span>
                            </div>
                            <Badge 
                              variant={company.ativo ? 'emerald' : 'slate'} 
                              className="text-[8px] py-0 px-1.5 font-bold uppercase border-none"
                            >
                              {company.ativo ? 'Ativa' : 'Inativa'}
                            </Badge>
                         </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                         <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => { setSelectedCompany(company); setSaveError(null); setIsModalOpen(true); }}
                              className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all font-sans"
                            >
                               <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => { setSelectedCompany(company); setIsStatusConfirmOpen(true); }}
                              className={cn(
                                "h-8 w-8 flex items-center justify-center rounded-lg transition-all",
                                company.ativo ? "text-slate-400 hover:bg-red-50 hover:text-red-500" : "text-slate-400 hover:bg-emerald-50 hover:text-emerald-500"
                              )}
                            >
                               {company.ativo ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                            </button>
                         </div>
                      </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedCompany ? 'Configurar Empresa' : 'Nova Empresa'}
        size="lg"
      >
        <form onSubmit={handleSaveCompany} className="space-y-6">
           {saveError && (
             <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs font-bold mb-4">
                {saveError}
             </div>
           )}
           
           <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500 px-1">Nome Fantasia / Razão Social</label>
              <Input 
                name="nome" 
                defaultValue={selectedCompany?.nome} 
                required 
                placeholder="Ex: Minha Empresa LTDA"
                className="h-10 bg-slate-50/50 border-slate-100 font-bold text-xs"
              />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                 <label className="text-xs font-medium text-slate-500 px-1">CNPJ</label>
                 <Input 
                   name="cnpj" 
                   defaultValue={selectedCompany?.cnpj || ''} 
                   placeholder="00.000.000/0000-00"
                   className="h-10 bg-slate-50/50 border-slate-100 font-bold text-xs"
                 />
              </div>
              <div className="space-y-1.5">
                 <label className="text-xs font-medium text-slate-500 px-1">E-mail de Contato</label>
                 <Input 
                   name="email" 
                   type="email" 
                   defaultValue={selectedCompany?.email || ''} 
                   placeholder="contato@empresa.com"
                   className="h-10 bg-slate-50/50 border-slate-100 font-bold text-xs"
                 />
              </div>
           </div>

           <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500 px-1">Telefone Principal</label>
              <Input 
                name="telefone" 
                defaultValue={selectedCompany?.telefone || ''} 
                placeholder="(00) 00000-0000"
                className="h-10 bg-slate-50/50 border-slate-100 font-bold text-xs"
              />
           </div>

           <div className="pt-4 border-t border-slate-50">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 text-center">Visual & Identidade</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 px-1">Cor Principal (Hex)</label>
                    <Input 
                      name="cor_principal" 
                      defaultValue={selectedCompany?.cor_principal || '#2563eb'} 
                      placeholder="#000000"
                      className="h-10 bg-slate-50/50 border-slate-100 font-bold text-xs"
                    />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 px-1">URL da Logo</label>
                    <Input 
                      name="logo" 
                      defaultValue={selectedCompany?.logo || ''} 
                      placeholder="https://exemplo.com/logo.png"
                      className="h-10 bg-slate-50/50 border-slate-100 font-bold text-xs"
                    />
                 </div>
              </div>
           </div>

           <div className="pt-6 flex items-center justify-end gap-3 border-t border-slate-50">
              <Button variant="ghost" size="sm" type="button" onClick={() => setIsModalOpen(false)} className="font-bold text-[10px] uppercase tracking-widest text-slate-400">
                Cancelar
              </Button>
              <Button type="submit" loading={loadingSave} size="sm" className="font-bold text-[10px] uppercase tracking-widest px-6 h-9">
                {selectedCompany ? 'Salvar Alterações' : 'Criar Empresa'}
              </Button>
           </div>
        </form>
      </Modal>

      <ConfirmDialog 
        isOpen={isStatusConfirmOpen}
        onClose={() => setIsStatusConfirmOpen(false)}
        onConfirm={handleToggleStatus}
        title={selectedCompany?.ativo ? 'Desativar Empresa?' : 'Ativar Empresa?'}
        description={`Ao ${selectedCompany?.ativo ? 'desativar' : 'ativar'}, a empresa ${selectedCompany?.nome || 'selecionada'} e todos os seus usuários ${selectedCompany?.ativo ? 'perderão' : 'recuperarão'} o acesso.`}
        confirmLabel={selectedCompany?.ativo ? 'Desativar' : 'Ativar'}
        variant={selectedCompany?.ativo ? 'danger' : 'info'}
      />
    </div>
  );
};

