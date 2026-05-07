import React, { useState } from 'react';
import { User } from '../../types';
import { api } from '../../lib/api';
import { Building2, Keyboard, ShieldCheck, Database, Cpu, Lock, Save, Zap, Palette, ChevronRight, CheckCircle2, AlertCircle, Layout, Globe, Building, Shield } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsPageProps {
  currentUser: User;
  onNavigate: (tab: any) => void;
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
      await api.patch(`/companies/${currentUser.empresa_id}`, data);
      setSuccess('Configurações da empresa atualizadas!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar configurações.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950 tracking-tight">Configurações</h2>
          <p className="text-sm text-slate-500 font-medium">Personalize sua experiência e gerencie os parâmetros da instância.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 p-1 bg-white border border-slate-200 rounded-xl w-fit shadow-sm">
        <button 
          onClick={() => setActiveSubTab('general')}
          className={cn(
            "h-9 px-4 rounded-lg text-xs font-semibold transition-all flex items-center gap-2",
            activeSubTab === 'general' ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-950 hover:bg-slate-50"
          )}
        >
          <Palette size={14} /> Preferências
        </button>

        {(currentUser.administrador || currentUser.desenvolvedor) && (
          <button 
            onClick={() => setActiveSubTab('company')}
            className={cn(
              "h-9 px-4 rounded-lg text-xs font-semibold transition-all flex items-center gap-2",
              activeSubTab === 'company' ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-950 hover:bg-slate-50"
            )}
          >
            <Building2 size={14} /> Empresa
          </button>
        )}

        {currentUser.desenvolvedor && (
          <button 
            onClick={() => setActiveSubTab('system')}
            className={cn(
              "h-9 px-4 rounded-lg text-xs font-semibold transition-all flex items-center gap-2",
              activeSubTab === 'system' ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-950 hover:bg-slate-50"
            )}
          >
            <Cpu size={14} /> Sistema
          </button>
        )}
      </div>

      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
             key={activeSubTab}
             initial={{ opacity: 0, y: 5 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -5 }}
             transition={{ duration: 0.15 }}
             className="space-y-6"
          >
            {activeSubTab === 'general' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Card className="p-6 space-y-6">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                         <ShieldCheck size={18} />
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900">Minha Conta</h4>
                    </div>
                    
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
                       <p className="text-xs font-medium text-slate-500 leading-relaxed">Gerencie suas informações pessoais, altere sua senha e personalize sua identidade na plataforma.</p>
                       <Button 
                         variant="outline"
                         size="sm"
                         onClick={() => onNavigate('profile')}
                         className="w-full justify-between"
                       >
                         Acessar Perfil <Zap size={14} className="text-amber-500" />
                       </Button>

                       <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-white">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600">
                                 <Layout size={18} />
                              </div>
                              <div>
                                 <div className="text-xs font-semibold text-slate-900">Navegação Compacta</div>
                                 <div className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">Otimizar espaço lateral</div>
                              </div>
                           </div>
                           <div className="w-8 h-4 bg-slate-200 rounded-full relative opacity-50 cursor-not-allowed">
                              <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full transition-all"></div>
                           </div>
                        </div>
                      </div>
                    </div>
                 </Card>

                 <Card className="p-6 space-y-6">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                         <Keyboard size={18} />
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900">Atalhos de Trabalho</h4>
                    </div>
                    <div className="grid gap-2.5">
                       {[
                         { id: 'tickets', desc: 'Central de Chamados', icon: <Layout size={16} /> },
                         { id: 'profile', desc: 'Dados do Perfil', icon: <ShieldCheck size={16} /> },
                         { id: 'dashboard', desc: 'Dashboard de Indicadores', icon: <Zap size={16} /> },
                       ].map(nav => (
                         <button 
                           key={nav.id} 
                           onClick={() => onNavigate(nav.id)}
                           className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 hover:border-slate-200 transition-all group"
                         >
                            <div className="flex items-center gap-3">
                               <div className="text-slate-400 group-hover:text-blue-600 transition-colors">{nav.icon}</div>
                               <span className="text-xs font-semibold text-slate-600">{nav.desc}</span>
                            </div>
                            <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-600" />
                         </button>
                       ))}
                    </div>
                 </Card>
              </div>
            )}

            {activeSubTab === 'company' && (
              <Card className="p-6">
                 <form onSubmit={handleSaveCompany} className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center border border-blue-100">
                           <Building2 size={24} />
                        </div>
                        <div>
                           <h4 className="text-sm font-semibold text-slate-900">Perfil Corporativo</h4>
                           <p className="text-xs text-slate-500 font-medium">Dados fundamentais da sua instância Gestifique.</p>
                        </div>
                      </div>
                      {(success || error) && (
                        <div className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-1",
                          success ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"
                        )}>
                          {success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                          {success || error}
                        </div>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 pt-2">
                       <Input 
                         label="Razão Social / Nome Fantasia"
                         name="nome" 
                         defaultValue={currentUser.empresa_nome || ''} 
                         required
                       />
                       <Input 
                         label="Documento (CNPJ/CPF)"
                         name="cnpj" 
                         placeholder="00.000.000/0000-00" 
                       />
                       <Input 
                         label="E-mail de Contato Principal"
                         name="email" 
                         type="email"
                         defaultValue={currentUser.empresa_email || ''} 
                       />
                       <Input 
                         label="Telefone de Suporte"
                         name="telefone" 
                         defaultValue={currentUser.empresa_telefone || ''} 
                       />
                    </div>

                    <div className="space-y-1.5 flex flex-col">
                       <label className="text-sm font-medium text-slate-700">Endereço da Sede</label>
                       <textarea 
                        name="endereco" 
                        rows={3} 
                        className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm font-medium focus:ring-2 focus:ring-blue-100 transition-all outline-none resize-none" 
                       />
                    </div>

                    <div className="pt-4 border-t border-slate-100 space-y-4">
                       <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-slate-100 text-slate-600 rounded-md flex items-center justify-center">
                             <Layout size={14} />
                          </div>
                          <h4 className="text-xs font-semibold text-slate-500">Atalhos Administrativos</h4>
                       </div>
                       <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <Button 
                            variant="outline"
                            onClick={() => onNavigate('users')}
                            className="bg-slate-50 border-slate-200 text-slate-600 justify-between h-12 text-xs"
                          >
                             Equipe <ShieldCheck size={14} className="text-blue-600" />
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => onNavigate('logs')}
                            className="bg-slate-50 border-slate-200 text-slate-600 justify-between h-12 text-xs"
                          >
                             Auditoria <Database size={14} className="text-indigo-600" />
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => onNavigate('tickets')}
                            className="bg-slate-50 border-slate-200 text-slate-600 justify-between h-12 text-xs"
                          >
                             Atendimentos <Layout size={14} className="text-emerald-600" />
                          </Button>
                       </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                       <Button type="submit" loading={loading} className="w-full sm:w-auto">
                          <Save size={16} className="mr-2" /> Salvar Alterações
                       </Button>
                    </div>
                 </form>
              </Card>
            )}

            {activeSubTab === 'system' && (
              <div className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-5 space-y-4 bg-slate-900 border-slate-800 text-white">
                       <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-blue-400 border border-white/10">
                          <Database size={20} />
                       </div>
                       <div>
                          <div className="text-lg font-bold">MySQL Engine</div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Database Core</div>
                       </div>
                       <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                          <Badge variant={dbStatus === 'CONNECTED' ? 'emerald' : dbStatus === 'ERROR' ? 'red' : 'slate'} className="font-semibold text-[10px]">
                             {dbStatus || 'CHECKING...'}
                          </Badge>
                          <span className="text-[10px] font-mono text-slate-600">v8.0.x</span>
                       </div>
                    </Card>

                    <Card className="p-5 space-y-4">
                       <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                          <Globe size={20} />
                       </div>
                       <div>
                          <div className="text-lg font-bold text-slate-900">Node.js API</div>
                          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Environment</div>
                       </div>
                       <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                          <Badge variant="indigo" className="font-semibold text-[10px]">OPERATIONAL</Badge>
                          <span className="text-[10px] font-mono text-slate-400">v20.x</span>
                       </div>
                    </Card>

                    <Card className="p-5 space-y-4">
                       <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                          <ShieldCheck size={20} />
                       </div>
                       <div>
                          <div className="text-lg font-bold text-slate-900">Security Layers</div>
                          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Auth Infrastructure</div>
                       </div>
                       <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                          <Badge variant="emerald" className="font-semibold text-[10px]">ACTIVE</Badge>
                          <span className="text-[10px] font-mono text-slate-400">JWT / Argon2</span>
                       </div>
                    </Card>
                 </div>

                 <Card className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-slate-950 text-white rounded-lg flex items-center justify-center">
                           <Lock size={18} />
                        </div>
                        <h4 className="text-sm font-semibold text-slate-900">Painel de Manutenção</h4>
                      </div>
                      <Badge variant="slate" className="font-semibold text-[10px] opacity-50 uppercase tracking-tighter">Manutenção</Badge>
                    </div>
                    
                    <p className="text-xs font-medium text-slate-500 leading-relaxed max-w-2xl">Acesso restrito para diagnóstico e manutenção estrutural do ecossistema Gestifique. Ações aqui impactam múltiplos módulos.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                       {[
                         { id: 'companies', desc: 'Instâncias Ativas', icon: <Building className="text-blue-600" /> },
                         { id: 'users', desc: 'Contas Globais', icon: <Shield className="text-indigo-600" /> },
                         { id: 'logs', desc: 'Trilha de Auditoria', icon: <Database className="text-emerald-600" /> },
                       ].map(action => (
                         <Button 
                           key={action.id}
                           variant="outline"
                           onClick={() => onNavigate(action.id)}
                           className="bg-slate-50 border-slate-200 text-slate-700 h-14 justify-between"
                         >
                            <div className="flex flex-col items-start gap-0.5">
                               <span className="text-xs font-semibold leading-tight">{action.desc}</span>
                               <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">Gerenciar</span>
                            </div>
                            <div className="p-1.5 rounded-md bg-white border border-slate-100">
                               {React.cloneElement(action.icon as React.ReactElement, { size: 14 })}
                            </div>
                         </Button>
                       ))}
                    </div>
                  </Card>
               </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
