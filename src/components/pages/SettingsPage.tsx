import React, { useState } from 'react';
import { User } from '../../types';
import { api } from '../../lib/api';
import { Building2, Keyboard, ShieldCheck, Database, Cpu, Lock, Save, Zap, Palette, ChevronRight, CheckCircle2, AlertCircle, Layout, Globe, Building, Shield, TrendingUp, BookOpen, RefreshCw } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { EmailChannelsManager } from '../companies/EmailChannelsManager';
import { TicketOptionsManager } from '../settings/TicketOptionsManager';
import { SlaPoliciesManager } from '../settings/SlaPoliciesManager';
import { AutomationsManager } from '../settings/AutomationsManager';

type AppTab = 'dashboard' | 'tickets' | 'users' | 'companies' | 'logs' | 'profile' | 'settings' | 'reports';

interface SettingsPageProps {
  currentUser: User;
  onNavigate: (tab: AppTab) => void;
  onUpdateUser?: (user: User) => void;
}

type HealthOverviewResponse = {
  success: boolean;
  database: {
    success: boolean;
    status: string;
    latencyMs?: number;
    database?: string;
    message?: string;
  };
  system: {
    success: boolean;
    status: string;
    environment: string;
    uptimeSeconds: number;
    roles: {
      web: boolean;
      emailListener: boolean;
      ticketJobs: boolean;
    };
  };
  security: {
    success: boolean;
    status: string;
    auth: boolean;
    helmet: boolean;
    rateLimit: boolean;
    trustProxy: any;
    warnings: string[];
  };
};

export const SettingsPage = ({ currentUser, onNavigate, onUpdateUser }: SettingsPageProps) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'company' | 'system' | 'tickets'>('general');
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [healthData, setHealthData] = useState<HealthOverviewResponse | null>(null);

  const fetchHealthOverview = async () => {
    setLoadingHealth(true);
    setHealthError(null);
    try {
      const res = await api.get<HealthOverviewResponse>('/health/overview');
      setHealthData(res);
    } catch (err: any) {
      setHealthError(err.message || 'Falha ao buscar diagnóstico do sistema');
    } finally {
      setLoadingHealth(false);
    }
  };

  React.useEffect(() => {
    if (activeSubTab === 'system') {
      fetchHealthOverview();
    }
  }, [activeSubTab]);

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser.empresa_id) {
       setError('Sua conta não possui empresa vinculada para editar.');
       return;
    }

    setLoading(true);
    setSuccess(null);
    setError(null);

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const payload = {
      nome: String(formData.get('nome') || ''),
      cnpj: String(formData.get('cnpj') || ''),
      email: String(formData.get('email') || ''),
      telefone: String(formData.get('telefone') || ''),
      endereco: String(formData.get('endereco') || ''),
      cor_principal: String(formData.get('cor_principal') || '#2563eb'),
      logo: String(formData.get('logo') || '')
    };

    if (!payload.nome) {
      setError('O nome da empresa é obrigatório.');
      setLoading(false);
      return;
    }

    if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      setError('E-mail de contato inválido.');
      setLoading(false);
      return;
    }

    try {
      await api.patch(`/companies/${currentUser.empresa_id}`, payload);
      
      // Refresh context to avoid stale data
      if (onUpdateUser) {
        const updated = await api.get<User>('/profile');
        onUpdateUser(updated);
      }

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
    <div className="w-full max-w-none space-y-4">
      <PageHeader title="Configurações" />

      <div className="flex flex-wrap gap-1 p-1 bg-white border border-slate-200 rounded-lg w-fit shadow-sm">
        <button 
          onClick={() => setActiveSubTab('general')}
          className={cn(
            "h-8 px-3 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
            activeSubTab === 'general' ? "bg-slate-100 text-slate-900 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
          )}
        >
          <Palette size={14} /> Preferências
        </button>

        {!!(currentUser.administrador || currentUser.desenvolvedor) && (
          <button 
            onClick={() => setActiveSubTab('company')}
            className={cn(
              "h-8 px-3 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
              activeSubTab === 'company' ? "bg-slate-100 text-slate-900 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            )}
          >
            <Building2 size={14} /> Empresa
          </button>
        )}

        {!!(currentUser.administrador || currentUser.desenvolvedor) && (
          <button 
            onClick={() => setActiveSubTab('tickets')}
            className={cn(
              "h-8 px-3 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
              activeSubTab === 'tickets' ? "bg-slate-100 text-slate-900 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            )}
          >
            <Layout size={14} /> Atendimento
          </button>
        )}

        {!!currentUser.desenvolvedor && (
          <button 
            onClick={() => setActiveSubTab('system')}
            className={cn(
              "h-8 px-3 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
              activeSubTab === 'system' ? "bg-slate-100 text-slate-900 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
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
             className="space-y-4"
          >
            {activeSubTab === 'general' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                 <Card className="p-5 space-y-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                         <ShieldCheck size={18} />
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900">Minha Conta</h4>
                    </div>
                    
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-4">
                       <p className="text-[13px] font-medium text-slate-600 leading-relaxed">Gerencie suas informações pessoais, altere sua senha e personalize sua identidade na plataforma.</p>
                       <Button 
                         variant="outline"
                         size="sm"
                         onClick={() => onNavigate('profile')}
                         className="w-full justify-between bg-white"
                       >
                         Acessar Perfil <Zap size={14} className="text-amber-500" />
                       </Button>

                       <div className="pt-3 border-t border-slate-100">
                          <div className="p-2.5 rounded-md bg-white border border-slate-100 flex items-center justify-between shadow-sm">
                             <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-md bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                                   <Palette size={14} />
                                </div>
                                <div>
                                   <div className="text-xs font-semibold text-slate-800">Modo Escuro</div>
                                   <p className="text-[10px] text-slate-500 leading-tight">Personalize cores da interface</p>
                                </div>
                             </div>
                             <Badge variant="slate" className="text-[9px] font-semibold">EM BREVE</Badge>
                          </div>
                       </div>
                    </div>
                 </Card>

                 <Card className="p-5 space-y-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                         <Keyboard size={18} />
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900">Atalhos de Trabalho</h4>
                    </div>
                    <div className="grid gap-2">
                       {(['reports', 'tickets', 'profile', 'dashboard'] as const).map(id => {
                         const navMap: Record<string, { desc: string; icon: React.ReactNode; access?: boolean }> = {
                            reports: { desc: 'Análise de Relatórios', icon: <TrendingUp size={16} />, access: currentUser.administrador || currentUser.desenvolvedor },
                            tickets: { desc: 'Central de Atendimentos', icon: <Layout size={16} /> },
                            profile: { desc: 'Dados do Perfil', icon: <ShieldCheck size={16} /> },
                            dashboard: { desc: 'Indicadores em Tempo Real', icon: <Zap size={16} /> },
                         };
                         const nav = navMap[id];
                         if (nav.access === false) return null;
                         return (
                           <button 
                             key={id} 
                             onClick={() => onNavigate(id)}
                             className="flex items-center justify-between p-2.5 bg-white rounded-md border border-slate-200 hover:border-blue-300 transition-all group shadow-sm text-left"
                           >
                              <div className="flex items-center gap-3">
                                 <div className="text-slate-400 group-hover:text-blue-600 transition-colors">{nav.icon}</div>
                                 <span className="text-[13px] font-medium text-slate-700">{nav.desc}</span>
                              </div>
                              <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-600" />
                           </button>
                         );
                       })}
                    </div>
                 </Card>
              </div>
            )}

            {activeSubTab === 'company' && (
              <Card className="p-5">
                 {!currentUser.empresa_id ? (
                   <div className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-3">
                      <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                         <AlertCircle size={24} />
                      </div>
                      <div className="space-y-1">
                         <h4 className="text-sm font-semibold text-slate-900">Empresa não vinculada</h4>
                         <p className="text-xs text-slate-500 max-w-sm mx-auto">Sua conta de usuário não possui uma empresa vinculada para editar configurações corporativas no momento.</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => onNavigate('dashboard')} className="mt-2 text-xs">
                         Voltar ao Dashboard
                      </Button>
                   </div>
                 ) : (
                   <form onSubmit={handleSaveCompany} className="space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-md flex items-center justify-center border border-blue-100">
                             <Building2 size={18} />
                          </div>
                          <div>
                             <h4 className="text-sm font-semibold text-slate-900">Perfil Corporativo</h4>
                             <p className="text-[11px] text-slate-500 font-medium">Dados fundamentais da sua instância Gestifique.</p>
                          </div>
                        </div>
                        {(success || error) && (
                          <div className={cn(
                            "px-2.5 py-1.5 rounded-md text-[11px] font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-1",
                            success ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"
                          )}>
                            {success ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                            {success || error}
                          </div>
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                         <Input 
                           label="Razão Social / Nome Fantasia"
                           name="nome" 
                           defaultValue={currentUser.empresa_nome || ''} 
                           required
                         />
                         <Input 
                           label="Documento (CNPJ/CPF)"
                           name="cnpj" 
                           defaultValue={currentUser.empresa_cnpj || ''}
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
                         <label className="text-xs font-medium text-slate-700">Endereço da Sede</label>
                         <textarea 
                          name="endereco" 
                          rows={2} 
                          defaultValue={currentUser.empresa_endereco || ''}
                          className="w-full bg-white border border-slate-200 rounded-md p-2.5 text-xs focus:ring-2 focus:ring-blue-100 transition-all outline-none resize-none" 
                         />
                      </div>
                      
                      <div className="pt-4 border-t border-slate-100 space-y-3">
                         <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-slate-50 text-slate-500 rounded flex items-center justify-center border border-slate-100">
                               <Palette size={12} />
                            </div>
                            <h4 className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Visual & Identidade</h4>
                         </div>
                         <div className="grid md:grid-cols-2 gap-4">
                            <Input 
                              label="Cor Principal (Hex)"
                              name="cor_principal" 
                              defaultValue={currentUser.empresa_cor_principal || '#2563eb'} 
                              placeholder="#2563eb"
                            />
                            <Input 
                              label="URL do Logotipo"
                              name="logo" 
                              defaultValue={currentUser.empresa_logo || ''} 
                              placeholder="https://exemplo.com/logo.png"
                            />
                         </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 space-y-3">
                         <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-slate-50 text-slate-500 rounded flex items-center justify-center border border-slate-100">
                               <Layout size={12} />
                            </div>
                            <h4 className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Atalhos Administrativos</h4>
                         </div>
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <Button 
                              variant="outline"
                              onClick={() => onNavigate('users')}
                              className="bg-white border-slate-200 text-slate-700 justify-between h-10 text-xs"
                            >
                               Equipe <ShieldCheck size={14} className="text-blue-500" />
                            </Button>
                            <Button 
                              variant="outline"
                              onClick={() => onNavigate('logs')}
                              className="bg-white border-slate-200 text-slate-700 justify-between h-10 text-xs"
                            >
                               Auditoria <Database size={14} className="text-indigo-500" />
                            </Button>
                            <Button 
                              variant="outline"
                              onClick={() => onNavigate('tickets')}
                              className="bg-white border-slate-200 text-slate-700 justify-between h-10 text-xs"
                            >
                               Atendimentos <Layout size={14} className="text-emerald-500" />
                            </Button>
                         </div>
                      </div>

                      <div className="pt-2 flex justify-end">
                         <Button type="submit" loading={loading} size="sm" className="w-full sm:w-auto">
                            <Save size={14} className="mr-1.5" /> Salvar Alterações
                         </Button>
                      </div>
                   </form>
                 )}
              </Card>
            )}

            {activeSubTab === 'company' && !!currentUser.empresa_id && (
               <Card className="p-5">
                 <EmailChannelsManager empresaId={currentUser.empresa_id} />
               </Card>
            )}

            {activeSubTab === 'system' && (
              <div className="space-y-4">
                 {loadingHealth ? (
                   <div className="flex flex-col items-center justify-center p-12 space-y-4">
                     <RefreshCw className="animate-spin text-slate-300" size={24} />
                     <p className="text-xs font-semibold text-slate-500">Coletando diagnósticos...</p>
                   </div>
                 ) : healthError ? (
                   <Card className="p-6">
                     <div className="flex flex-col items-center justify-center text-center space-y-3">
                        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center">
                           <AlertCircle size={24} />
                        </div>
                        <div className="space-y-1">
                           <h4 className="text-sm font-semibold text-slate-900">Falha no Diagnóstico</h4>
                           <p className="text-xs text-slate-500 max-w-sm mx-auto">{healthError}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={fetchHealthOverview}>
                           Tentar Novamente
                        </Button>
                     </div>
                   </Card>
                 ) : healthData ? (
                   <>
                     <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
                        <span className="text-[11px] font-medium text-slate-500 pl-2">Última verificação: {new Date().toLocaleTimeString()}</span>
                        <Button variant="outline" size="sm" onClick={fetchHealthOverview} className="h-7 text-[11px]">
                          <RefreshCw size={12} className="mr-1.5" /> Atualizar Diagnóstico
                        </Button>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Banco de Dados Card - changed from black to white */}
                        <Card className="p-4 space-y-3 bg-white border-slate-200 text-slate-900">
                           <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 border border-blue-100">
                              <Database size={16} />
                           </div>
                           <div>
                              <div className="text-sm font-bold">Banco de Dados</div>
                              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Conexão principal</div>
                           </div>
                           <div className="space-y-2">
                             <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                <Badge 
                                  variant={healthData.database.status === 'CONNECTED' ? 'emerald' : 'red'} 
                                  className="font-semibold text-[9px] px-1.5 py-0"
                                >
                                   {healthData.database.status === 'CONNECTED' ? 'CONECTADO' : 'ERRO'}
                                </Badge>
                                <span className="text-[10px] font-mono text-slate-500">
                                  {healthData.database.latencyMs ? `${healthData.database.latencyMs}ms` : '---'}
                                </span>
                             </div>
                             {healthData.database.message && (
                               <div className="text-[10px] text-red-500 font-medium">{healthData.database.message}</div>
                             )}
                           </div>
                        </Card>

                        {/* API SYSTEM CARD */}
                        <Card className="p-4 space-y-3">
                           <div className="flex justify-between items-start">
                             <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 border border-indigo-100">
                                <Globe size={16} />
                             </div>
                             <div className="flex flex-col items-end">
                               <div className="flex gap-1">
                                  {healthData.system.roles.web && <Badge variant="slate" className="text-[8px] px-1">WEB</Badge>}
                                  {healthData.system.roles.emailListener && <Badge variant="slate" className="text-[8px] px-1">EMAIL</Badge>}
                                  {healthData.system.roles.ticketJobs && <Badge variant="slate" className="text-[8px] px-1">JOBS</Badge>}
                               </div>
                             </div>
                           </div>
                           <div>
                              <div className="text-sm font-bold text-slate-900">API do Sistema</div>
                              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{healthData.system.environment}</div>
                           </div>
                           <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                              <Badge 
                                variant={healthData.system.status === 'OPERATIONAL' ? 'indigo' : 'red'} 
                                className="font-semibold text-[9px] px-1.5 py-0"
                              >
                                {healthData.system.status === 'OPERATIONAL' ? 'OPERACIONAL' : 'ERRO'}
                              </Badge>
                              <span className="text-[10px] font-mono text-slate-500">
                                Up: {Math.floor(healthData.system.uptimeSeconds / 3600)}h {Math.floor((healthData.system.uptimeSeconds % 3600) / 60)}m
                              </span>
                           </div>
                        </Card>

                        {/* SECURITY CARD */}
                        <Card className="p-4 space-y-3">
                           <div className="flex justify-between items-start">
                             <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 border border-emerald-100">
                                <ShieldCheck size={16} />
                             </div>
                             <div className="text-lg font-bold text-slate-400">
                               {healthData.security.warnings.length}
                             </div>
                           </div>
                           <div>
                              <div className="text-sm font-bold text-slate-900">Camada de Segurança</div>
                              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                                {healthData.security.auth ? 'Autenticação Ativa' : 'Autenticação Mista'}
                              </div>
                           </div>
                           <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                              <Badge 
                                variant={healthData.security.status === 'ACTIVE' ? 'emerald' : healthData.security.status === 'WARNING' ? 'amber' : 'red'} 
                                className="font-semibold text-[9px] px-1.5 py-0"
                              >
                                {healthData.security.status === 'ACTIVE' ? 'ATIVO' : healthData.security.status === 'WARNING' ? 'AVISOS' : 'ERRO'}
                              </Badge>
                              <span className="text-[10px] font-mono text-slate-500">
                                {healthData.security.helmet ? 'Protegido' : 'Sem Proteção'}
                              </span>
                           </div>
                        </Card>
                     </div>

                     {healthData.security.warnings.length > 0 && (
                       <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1.5">
                         <div className="flex gap-1.5 items-center text-amber-800 font-semibold text-xs">
                           <AlertCircle size={14} /> Avisos de Segurança
                         </div>
                         <ul className="list-disc pl-5 text-[11px] text-amber-700 space-y-0.5">
                           {healthData.security.warnings.map((warn, i) => (
                             <li key={i}>{warn}</li>
                           ))}
                         </ul>
                       </div>
                     )}

                     <Card className="p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg flex items-center justify-center">
                             <Lock size={16} />
                          </div>
                          <h4 className="text-sm font-semibold text-slate-900">Painel de Manutenção</h4>
                        </div>
                        <Badge variant="slate" className="font-semibold text-[9px] uppercase tracking-wider">Manutenção</Badge>
                      </div>
                      
                      <p className="text-[13px] text-slate-500 leading-relaxed max-w-3xl">Acesso restrito para diagnóstico e manutenção estrutural do ecossistema Gestifique. Ações aqui impactam múltiplos módulos.</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                         {[
                           { id: 'companies' as const, desc: 'Empresas', icon: <Building className="text-blue-500" /> },
                           { id: 'users' as const, desc: 'Usuários', icon: <Shield className="text-indigo-500" /> },
                           { id: 'logs' as const, desc: 'Auditoria', icon: <Database className="text-emerald-500" /> },
                         ].map(action => (
                           <Button 
                             key={action.id}
                             variant="outline"
                             onClick={() => onNavigate(action.id)}
                             className="bg-white border hover:border-blue-300 border-slate-200 text-slate-700 h-12 justify-between"
                           >
                              <div className="flex flex-col items-start">
                                 <span className="text-xs font-semibold leading-tight mb-0.5">{action.desc}</span>
                                 <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">Gerenciar</span>
                              </div>
                              <div className="p-1.5 rounded bg-slate-50 border border-slate-100">
                                 {React.cloneElement(action.icon as React.ReactElement<any>, { size: 14 })}
                              </div>
                           </Button>
                         ))}
                      </div>
                    </Card>
                   </>
                 ) : (
                   <Card className="p-6">
                     <div className="flex flex-col items-center justify-center text-center space-y-3">
                        <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center border border-slate-200">
                           <Database size={24} />
                        </div>
                        <div className="space-y-1">
                           <h4 className="text-sm font-semibold text-slate-900">Nenhum diagnóstico carregado</h4>
                           <p className="text-xs text-slate-500 max-w-sm mx-auto">As informações de saúde do sistema não estão disponíveis.</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={fetchHealthOverview}>
                           Atualizar diagnóstico
                        </Button>
                     </div>
                   </Card>
                 )}
              </div>
            )}

            {activeSubTab === 'tickets' && (
              <div className="space-y-4">
                 <TicketOptionsManager currentUser={currentUser} />
                 <SlaPoliciesManager currentCompanyId={currentUser.empresa_id!} />
                 <AutomationsManager currentCompanyId={currentUser.empresa_id!} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
