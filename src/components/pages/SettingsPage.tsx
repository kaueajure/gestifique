import React, { useState } from 'react';
import { User } from '../../types';
import { api } from '../../lib/api';
import { Settings, Building2, Palette, Bell, Keyboard, ShieldCheck, Globe, Database, Cpu, Lock, Save, Loader2, AlertCircle, CheckCircle2, Layout, Zap } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsPageProps {
  currentUser: User;
  onNavigate: (tab: string) => void;
}

export const SettingsPage = ({ currentUser, onNavigate }: SettingsPageProps) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'company' | 'system'>('general');
  const [dbStatus, setDbStatus] = useState<string | null>(null);

  const checkDb = async () => {
    try {
      const res = await api.get<any>('/health/db');
      setDbStatus(res.status);
    } catch {
      setDbStatus('ERROR');
    }
  };

  React.useEffect(() => {
    if (activeSubTab === 'system') checkDb();
  }, [activeSubTab]);

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());

    try {
      // Assuming developers can update any, admins only their own
      // For now, we'll hit an endpoint that handles this logic
      await api.patch(`/companies/${currentUser.empresa_id}`, data);
      setSuccess('Configurações da empresa atualizadas!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar configurações.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Configurações</h2>
          <p className="text-slate-500 font-medium text-lg">Personalize sua experiência e gerencie os parâmetros da instância.</p>
        </div>
      </div>

      <div className="flex gap-2 p-1.5 bg-white border border-slate-200 rounded-[24px] w-fit shadow-sm">
        <button 
          onClick={() => setActiveSubTab('general')}
          className={cn(
            "h-11 px-6 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
            activeSubTab === 'general' ? "bg-slate-900 text-white shadow-lg shadow-slate-200" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
          )}
        >
          <Palette size={14} /> Preferências
        </button>
        {(currentUser.administrador || currentUser.desenvolvedor) && (
          <button 
            onClick={() => setActiveSubTab('company')}
            className={cn(
              "h-11 px-6 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
              activeSubTab === 'company' ? "bg-slate-900 text-white shadow-lg shadow-slate-200" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            )}
          >
            <Building2 size={14} /> Empresa
          </button>
        )}
        {currentUser.desenvolvedor && (
          <button 
            onClick={() => setActiveSubTab('system')}
            className={cn(
              "h-11 px-6 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
              activeSubTab === 'system' ? "bg-slate-900 text-white shadow-lg shadow-slate-200" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            )}
          >
            <Cpu size={14} /> Sistema
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
           key={activeSubTab}
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: -10 }}
           className="space-y-8"
        >
          {activeSubTab === 'general' && (
            <div className="grid md:grid-cols-2 gap-8">
               <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                       <ShieldCheck size={20} />
                    </div>
                    <h4 className="font-black text-slate-900">Minha Conta</h4>
                  </div>
                  
                  <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 space-y-4">
                     <p className="text-sm font-medium text-slate-500">Gerencie suas informações pessoais, altere sua senha e personalize sua identidade na plataforma.</p>
                     <button 
                       onClick={() => onNavigate('profile')}
                       className="w-full h-12 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                     >
                       Ir para Meu Perfil <Zap size={14} className="text-orange-500" />
                     </button>
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 flex items-center justify-between group cursor-pointer hover:border-slate-200 transition-all">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-900">
                             <Layout size={24} />
                          </div>
                          <div>
                             <div className="text-sm font-black text-slate-900">Sidebar Compacta</div>
                             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Otimizar espaço de trabalho</div>
                          </div>
                       </div>
                       <div className="w-12 h-6 bg-slate-200 rounded-full relative">
                          <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all"></div>
                       </div>
                    </div>
                  </div>
               </div>

               <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                       <Keyboard size={20} />
                    </div>
                    <h4 className="font-black text-slate-900">Acesso Rápido</h4>
                  </div>
                  <div className="space-y-4">
                     {[
                       { id: 'tickets', desc: 'Central de Chamados', icon: <Layout size={16} /> },
                       { id: 'profile', desc: 'Configurar Perfil', icon: <ShieldCheck size={16} /> },
                       { id: 'dashboard', desc: 'Dashboard Principal', icon: <Zap size={16} /> },
                     ].map(nav => (
                       <button 
                         key={nav.id} 
                         onClick={() => onNavigate(nav.id)}
                         className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-all group"
                       >
                          <div className="flex items-center gap-3">
                             <div className="text-slate-400 group-hover:text-blue-600 transition-colors">{nav.icon}</div>
                             <span className="text-sm font-bold text-slate-600">{nav.desc}</span>
                          </div>
                          <Badge variant="slate" className="font-black">IR</Badge>
                       </button>
                     ))}
                  </div>
               </div>
            </div>
          )}

          {activeSubTab === 'company' && (
            <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm">
               <form onSubmit={handleSaveCompany} className="space-y-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100">
                         <Building2 size={32} />
                      </div>
                      <div>
                         <h4 className="text-xl font-black text-slate-900">Perfil da Empresa</h4>
                         <p className="text-sm font-medium text-slate-500">Dados públicos da sua instância no Gestifique.</p>
                      </div>
                    </div>
                    {(success || error) && (
                      <div className={cn(
                        "px-6 py-3 rounded-2xl text-xs font-bold flex items-center gap-2",
                        success ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"
                      )}>
                        {success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                        {success || error}
                      </div>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-8 pt-6 border-t border-slate-50">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Razão Social / Nome</label>
                        <input name="nome" defaultValue={currentUser.empresa_nome || ''} className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold focus:ring-4 focus:ring-blue-100 transition-all outline-none" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">CNPJ (Opcional)</label>
                        <input name="cnpj" placeholder="00.000.000/0000-00" className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold focus:ring-4 focus:ring-blue-100 transition-all outline-none" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">E-mail de Contato</label>
                        <input name="email" defaultValue={currentUser.empresa_email || ''} placeholder="contato@empresa.com" className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold focus:ring-4 focus:ring-blue-100 transition-all outline-none" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Telefone Suporte</label>
                        <input name="telefone" defaultValue={currentUser.empresa_telefone || ''} placeholder="Não informado" className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold focus:ring-4 focus:ring-blue-100 transition-all outline-none" />
                     </div>
                  </div>

                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Endereço da Sede</label>
                     <textarea name="endereco" rows={3} className="w-full bg-slate-50 border-none rounded-2xl p-6 text-sm font-bold focus:ring-4 focus:ring-blue-100 transition-all outline-none resize-none" />
                  </div>

                  <div className="pt-6 flex justify-end">
                     <button 
                      disabled={loading}
                      className="h-14 px-12 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center gap-3 active:scale-95"
                     >
                        {loading ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
                        Salvar Empresa
                     </button>
                  </div>
               </form>
            </div>
          )}

          {activeSubTab === 'system' && (
            <div className="space-y-8">
               <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-slate-900 p-8 rounded-[40px] text-white space-y-4 shadow-2xl">
                     <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-blue-400">
                        <Database size={24} />
                     </div>
                     <div>
                        <div className="text-2xl font-black">MySQL Pro</div>
                        <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Database Engine</div>
                     </div>
                     <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                        <Badge variant={dbStatus === 'CONNECTED' ? 'emerald' : dbStatus === 'ERROR' ? 'red' : 'slate'} className="rounded-full">
                           {dbStatus || 'CHECKING...'}
                        </Badge>
                        <span className="text-[10px] font-mono text-white/30 text-right">v8.0.32</span>
                     </div>
                  </div>

                  <div className="bg-white p-8 rounded-[40px] border border-slate-200 space-y-4 shadow-sm">
                     <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                        <Globe size={24} />
                     </div>
                     <div>
                        <div className="text-2xl font-black">Node.js API</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Runtime Environment</div>
                     </div>
                     <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                        <Badge variant="indigo" className="rounded-full">STABLE</Badge>
                        <span className="text-[10px] font-mono text-slate-400 text-right">v20+</span>
                     </div>
                  </div>

                  <div className="bg-white p-8 rounded-[40px] border border-slate-200 space-y-4 shadow-sm">
                     <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                        <ShieldCheck size={24} />
                     </div>
                     <div>
                        <div className="text-2xl font-black">JWT Auth</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protection Layer</div>
                     </div>
                     <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                        <Badge variant="orange" className="rounded-full">SECURED</Badge>
                        <span className="text-[10px] font-mono text-slate-400 text-right">HTTPOnly</span>
                     </div>
                  </div>
               </div>

               <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
                         <Lock size={20} />
                      </div>
                      <h4 className="font-black text-slate-900">Developer Actions</h4>
                    </div>
                    <Badge variant="slate" className="font-black">EXPERIMENTAL</Badge>
                  </div>
                  
                  <p className="text-sm font-medium text-slate-500 max-w-2xl">Acesso restrito para manutenção técnica do núcleo Gestifique. Use com cautela.</p>

                  <div className="grid md:grid-cols-3 gap-4">
                     <button 
                       onClick={() => onNavigate('companies')}
                       className="h-16 px-6 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 flex items-center justify-between hover:bg-slate-100 transition-all"
                     >
                        Gestão de Empresas
                        <Building2 size={16} />
                     </button>
                     <button 
                       onClick={() => onNavigate('users')}
                       className="h-16 px-6 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 flex items-center justify-between hover:bg-slate-100 transition-all"
                     >
                        Gestão de Usuários
                        <ShieldCheck size={16} />
                     </button>
                     <button 
                       onClick={() => onNavigate('logs')}
                       className="h-16 px-6 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 flex items-center justify-between hover:bg-slate-100 transition-all"
                     >
                        Logs de Auditoria
                        <Layout size={16} />
                     </button>
                  </div>
               </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
