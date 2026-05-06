import React, { useState, useEffect } from 'react';
import { Empresa } from '../../types';
import { api } from '../../lib/api';
import { Building2, Plus, Edit2, Trash2, Shield, Search, Globe, Phone, Mail, CheckCircle2 } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { cn } from '../../lib/utils';

export const CompaniesPage = () => {
  const [companies, setCompanies] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Partial<Empresa> | null>(null);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const data = await api.get<Empresa[]>('/companies');
      setCompanies(data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCompanies(); }, []);

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
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
    } catch (error: any) { alert(error.message); }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Gestão de Empresas</h2>
          <p className="text-slate-500 font-medium">Controle os workspaces e tenants habilitados na plataforma.</p>
        </div>
        <button 
          onClick={() => { setSelectedCompany(null); setIsModalOpen(true); }}
          className="h-12 px-6 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-95"
        >
          <Plus size={20} /> Adicionar Empresa
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
             <div key={i} className="bg-white p-8 rounded-3xl border border-slate-200 animate-pulse space-y-4">
                <div className="flex items-center gap-4">
                   <div className="w-16 h-16 bg-slate-100 rounded-2xl"></div>
                   <div className="flex-1 space-y-2">
                       <div className="w-32 h-4 bg-slate-100 rounded"></div>
                       <div className="w-24 h-3 bg-slate-100 rounded"></div>
                   </div>
                </div>
                <div className="space-y-2">
                   <div className="w-full h-3 bg-slate-100 rounded"></div>
                   <div className="w-full h-3 bg-slate-100 rounded"></div>
                </div>
             </div>
          ))
        ) : companies.map((company) => (
          <div key={company.id} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all group relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all">
                <div className="flex gap-1">
                   <button onClick={() => { setSelectedCompany(company); setIsModalOpen(true); }} className="p-2 bg-white text-slate-400 hover:text-blue-600 rounded-xl shadow-lg border border-slate-100 transition-all"><Edit2 size={14} /></button>
                   <button className="p-2 bg-white text-slate-400 hover:text-red-600 rounded-xl shadow-lg border border-slate-100 transition-all"><Trash2 size={14} /></button>
                </div>
             </div>
             
             <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-2xl uppercase shadow-inner">
                   {company.nome.charAt(0)}
                </div>
                <div>
                   <h3 className="font-black text-slate-900 leading-tight">{company.nome}</h3>
                   <div className="flex items-center gap-2 mt-1">
                      <Badge variant={company.ativo ? 'emerald' : 'red'}>{company.ativo ? 'Ativa' : 'Pausada'}</Badge>
                      <span className="text-[10px] font-bold text-slate-400">{company.cnpj}</span>
                   </div>
                </div>
             </div>

             <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                   <Mail size={14} className="text-indigo-400" /> {company.email || 'Não informado'}
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                   <Phone size={14} className="text-indigo-400" /> {company.telefone || 'Não informado'}
                </div>
             </div>

             <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                <div className="flex -space-x-2">
                   {Array.from({ length: 3 }).map((_, j) => (
                      <div key={j} className="w-8 h-8 rounded-lg bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-400">?</div>
                   ))}
                </div>
                <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                  Workspace Ativo <CheckCircle2 size={12} />
                </div>
             </div>
          </div>
        ))}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={selectedCompany ? "Editar Empresa" : "Nova Empresa"}
        size="lg"
      >
        <form onSubmit={handleSaveCompany} className="grid md:grid-cols-2 gap-6">
           <div className="space-y-4">
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Razão Social / Nome</label>
                 <input name="nome" defaultValue={selectedCompany?.nome} required className="w-full h-12 bg-slate-50 border-none rounded-2xl px-4 text-sm font-bold focus:ring-2 focus:ring-indigo-100 outline-none" />
              </div>
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">CNPJ</label>
                 <input name="cnpj" defaultValue={selectedCompany?.cnpj} required className="w-full h-12 bg-slate-50 border-none rounded-2xl px-4 text-sm font-bold focus:ring-2 focus:ring-indigo-100 outline-none" placeholder="00.000.000/0001-00" />
              </div>
           </div>
           
           <div className="space-y-4">
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">E-mail Administrativo</label>
                 <input name="email" type="email" defaultValue={selectedCompany?.email} required className="w-full h-12 bg-slate-50 border-none rounded-2xl px-4 text-sm font-bold focus:ring-2 focus:ring-indigo-100 outline-none" />
              </div>
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Telefone</label>
                 <input name="telefone" defaultValue={selectedCompany?.telefone} required className="w-full h-12 bg-slate-50 border-none rounded-2xl px-4 text-sm font-bold focus:ring-2 focus:ring-indigo-100 outline-none" />
              </div>
           </div>

           <div className="md:col-span-2 flex justify-end gap-3 mt-4">
              <button type="button" onClick={() => setIsModalOpen(false)} className="h-12 px-6 font-bold text-slate-400 hover:text-slate-600 transition-all">Cancelar</button>
              <button type="submit" className="h-12 px-8 bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">Salvar Empresa</button>
           </div>
        </form>
      </Modal>
    </div>
  );
};
