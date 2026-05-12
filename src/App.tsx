import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { DashboardPage } from './components/pages/DashboardPage';
import { TicketsPage } from './components/pages/TicketsPage';
import { TicketDetailsPage } from './components/pages/TicketDetailsPage';
import { UsersPage } from './components/pages/UsersPage';
import { CompaniesPage } from './components/pages/CompaniesPage';
import { LogsPage } from './components/pages/LogsPage';
import { ProfilePage } from './components/pages/ProfilePage';
import { SettingsPage } from './components/pages/SettingsPage';
import { ReportsPage } from './components/pages/ReportsPage';
import { AccessDenied } from './components/ui/AccessDenied';
import { LandingPage } from './components/public/LandingPage';
import { User } from './types';
import { api } from './lib/api';
import { Card } from './components/ui/Card';
import { Input } from './components/ui/Input';
import { Button } from './components/ui/Button';
import { AppLogo } from './components/ui/Logo';
import { 
  ArrowRight, 
  Shield, 
  Zap, 
  Loader2,
  Lock,
  Mail,
  Settings,
  AlertCircle
} from 'lucide-react';

type ViewState = 'landing' | 'login' | 'forgot-password' | 'reset-password' | 'dashboard';
type ActiveTab = 'dashboard' | 'tickets' | 'users' | 'companies' | 'logs' | 'profile' | 'settings' | 'reports';

export default function App() {
  const [view, setView] = useState<ViewState>('landing');
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [isBooting, setIsBooting] = useState(true);
  const [resetEmail, setResetEmail] = useState('');

  useEffect(() => {
    // Check session on load
    const checkAuth = async () => {
      try {
        const user = await api.get<User>('/profile');
        setCurrentUser(user);
        setView('dashboard');
      } catch (err) {
        setView('landing');
      } finally {
        setIsBooting(false);
      }
    };

    checkAuth();

    // Global event listener for unauthorized requests
    const handleUnauthorized = (e: Event) => {
      const customEvent = e as CustomEvent<{ endpoint?: string }>;
      const endpoint = customEvent.detail?.endpoint;

      if (endpoint === '/profile' || endpoint === '/auth/login') {
        return;
      }

      setCurrentUser(null);
      setView('login');
      setAuthError('Sessão expirada. Faça login novamente.');
    };

    window.addEventListener('api:unauthorized', handleUnauthorized as EventListener);
    return () => window.removeEventListener('api:unauthorized', handleUnauthorized as EventListener);
  }, []);

  const handleNotificationNavigate = (link: string) => {
    if (link.startsWith('ticket:')) {
      const ticketId = parseInt(link.split(':')[1]);
      if (!isNaN(ticketId)) {
        setSelectedTicketId(ticketId);
        setActiveTab('tickets');
      }
    } else if (link === 'tickets') {
      setActiveTab('tickets');
      setSelectedTicketId(null);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError(null);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
      await api.post('/auth/login', { email, password });
      // Fetch full profile after login to guarantee consistent corporate data
      const profile = await api.get<User>('/profile');
      setCurrentUser(profile);
      setView('dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao autenticar.';
      setAuthError(message);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout', {});
    } catch (e) {}
    setCurrentUser(null);
    setView('landing');
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    try {
      const data = await api.post<{ message: string }>('/auth/forgot-password', { email });
      setAuthSuccess(data.message);
      setResetEmail(email);
      setTimeout(() => setView('reset-password'), 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao solicitar recuperação.';
      setAuthError(message);
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    const formData = new FormData(e.currentTarget);
    const token = formData.get('token');
    const newPassword = formData.get('newPassword');

    try {
      const data = await api.post<{ message: string }>('/auth/reset-password', { email: resetEmail, token, newPassword });
      setAuthSuccess(data.message);
      setTimeout(() => {
        setView('login');
        setAuthSuccess(null);
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao redefinir a senha.';
      setAuthError(message);
    }
  };

  if (isBooting) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  // --- RENDERING VIEWS ---

  if (view === 'landing') {
    return <LandingPage onLogin={() => setView('login')} />;
  }

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50/50 via-transparent to-transparent">
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
             <AppLogo size={56} className="mb-4 mx-auto" />
             <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Bem-vindo</h2>
             <p className="text-sm text-slate-500 font-medium">Acesse o portal do cliente Gestifique</p>
          </div>

          <Card className="p-8 shadow-xl shadow-slate-200/50">
             <form onSubmit={handleLogin} className="space-y-5">
                {authError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2.5 text-red-600 text-xs font-semibold animate-in fade-in slide-in-from-top-1">
                    <AlertCircle size={14} /> {authError}
                  </div>
                )}
                
                <Input 
                   label="E-mail Corporativo"
                   name="email"
                   type="email" 
                   required 
                   placeholder="exemplo@empresa.com"
                />

                <div className="space-y-1">
                   <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700">Senha</label>
                      <button 
                        type="button" 
                        onClick={() => { setView('forgot-password'); setAuthError(null); setAuthSuccess(null); }}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-tight"
                      >
                        Esqueceu?
                      </button>
                   </div>
                   <input 
                      name="password"
                      type="password" 
                      required 
                      className="w-full h-10 bg-white border border-slate-200 rounded-lg px-4 text-sm font-medium focus:ring-4 focus:ring-blue-100 focus:border-blue-200 transition-all outline-none" 
                      placeholder="••••••••"
                   />
                </div>

                <Button type="submit" className="w-full h-11 text-sm">
                   Entrar <ArrowRight size={16} className="ml-2" />
                </Button>
             </form>
          </Card>
          
          <div className="mt-8 text-center">
             <button 
                onClick={() => setView('landing')} 
                className="text-xs font-semibold text-slate-400 hover:text-slate-900 flex items-center gap-2 mx-auto transition-all"
             >
                ← Voltar ao início
             </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (view === 'forgot-password') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50/50 via-transparent to-transparent">
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
             <div className="inline-flex w-12 h-12 bg-slate-100 rounded-xl items-center justify-center shadow-inner mb-6">
                <Mail className="text-blue-600" size={24} />
             </div>
             <h2 className="text-2xl font-semibold text-slate-950 tracking-tight">Recuperar Senha</h2>
             <p className="text-sm text-slate-500 font-medium">Enviaremos um código para o seu e-mail</p>
          </div>

          <Card className="p-8 shadow-xl shadow-slate-200/50">
             <form onSubmit={handleForgotPassword} className="space-y-5">
                {authError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2.5 text-red-600 text-xs font-semibold animate-in fade-in slide-in-from-top-1">
                    <AlertCircle size={14} /> {authError}
                  </div>
                )}
                {authSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-2.5 text-emerald-600 text-xs font-semibold animate-in fade-in slide-in-from-top-1">
                    <Shield size={14} /> {authSuccess}
                  </div>
                )}
                
                <Input 
                   label="E-mail Corporativo"
                   name="email"
                   type="email" 
                   required 
                   placeholder="exemplo@empresa.com"
                />

                <Button type="submit" className="w-full h-11 text-sm bg-blue-600 hover:bg-blue-700 text-white">
                   Enviar código
                </Button>
             </form>
          </Card>
          
          <div className="mt-8 text-center">
             <button 
                onClick={() => { setView('login'); setAuthError(null); setAuthSuccess(null); }} 
                className="text-xs font-semibold text-slate-400 hover:text-slate-900 flex items-center gap-2 mx-auto transition-all"
             >
                ← Voltar ao login
             </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (view === 'reset-password') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50/50 via-transparent to-transparent">
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
             <div className="inline-flex w-12 h-12 bg-slate-100 rounded-xl items-center justify-center shadow-inner mb-6">
                <Lock className="text-blue-600" size={24} />
             </div>
             <h2 className="text-2xl font-semibold text-slate-950 tracking-tight">Nova Senha</h2>
             <p className="text-sm text-slate-500 font-medium">Digite o código recebido no seu e-mail</p>
          </div>

          <Card className="p-8 shadow-xl shadow-slate-200/50">
             <form onSubmit={handleResetPassword} className="space-y-5">
                {authError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2.5 text-red-600 text-xs font-semibold animate-in fade-in slide-in-from-top-1">
                    <AlertCircle size={14} /> {authError}
                  </div>
                )}
                {authSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-2.5 text-emerald-600 text-xs font-semibold animate-in fade-in slide-in-from-top-1">
                    <Shield size={14} /> {authSuccess}
                  </div>
                )}
                
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-slate-700">Código de 6 dígitos</label>
                   <input 
                      name="token"
                      type="text" 
                      required 
                      className="w-full h-10 bg-white border border-slate-200 rounded-lg px-4 text-center text-xl font-bold tracking-widest focus:ring-4 focus:ring-blue-100 focus:border-blue-200 transition-all outline-none" 
                      placeholder="000000"
                      maxLength={6}
                   />
                </div>

                <Input 
                   label="Nova Senha"
                   name="newPassword"
                   type="password" 
                   required 
                   placeholder="Mínimo 6 caracteres"
                />

                <Button type="submit" className="w-full h-11 text-sm bg-blue-600 hover:bg-blue-700 text-white">
                   Redefinir senha
                </Button>
             </form>
          </Card>
          
          <div className="mt-8 text-center">
             <button 
                onClick={() => { setView('login'); setAuthError(null); setAuthSuccess(null); }} 
                className="text-xs font-semibold text-slate-400 hover:text-slate-900 flex items-center gap-2 mx-auto transition-all"
             >
                ← Voltar ao login
             </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- DASHBOARD LAYOUT ---

  if (view === 'dashboard' && currentUser) {
    const getPageTitle = () => {
      switch (activeTab) {
        case 'dashboard': return 'Dashboard de Controle';
        case 'tickets': return selectedTicketId ? 'Chamado' : 'Central de Chamados';
        case 'users': return 'Gestão de Usuários';
        case 'companies': return 'Empresas Ativas';
        case 'logs': return 'Logs do Sistema';
        case 'reports': return 'Relatórios Gerenciais';
        case 'profile': return 'Configurações de Perfil';
        case 'settings': return 'Preferências';
        default: return 'Gestifique';
      }
    };

    return (
      <div className="min-h-screen bg-[#FDFDFF] flex">
        <Sidebar 
          currentUser={currentUser} 
          activeTab={activeTab} 
          setActiveTab={(tab) => { setActiveTab(tab); setSelectedTicketId(null); }} 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onLogout={handleLogout}
        />

        <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
          <Topbar 
            title={getPageTitle()} 
            onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            currentUser={currentUser}
            onNavigate={handleNotificationNavigate}
          />

          <main className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="max-w-[1600px] mx-auto px-6 py-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab + (selectedTicketId || '')}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'dashboard' && <DashboardPage onNavigate={(tab) => setActiveTab(tab)} />}
                  
                  {activeTab === 'tickets' && !selectedTicketId && (
                    <TicketsPage 
                      onSelectTicket={setSelectedTicketId} 
                      currentUser={currentUser}
                    />
                  )}
                  
                  {activeTab === 'tickets' && selectedTicketId && (
                    <TicketDetailsPage 
                      ticketId={selectedTicketId} 
                      onBack={() => setSelectedTicketId(null)} 
                      currentUser={currentUser}
                    />
                  )}

                  {activeTab === 'users' && (!!(currentUser.administrador || currentUser.desenvolvedor) ? (
                    <UsersPage currentUser={currentUser} />
                  ) : (
                    <AccessDenied />
                  ))}
                  
                  {activeTab === 'companies' && (!!currentUser.desenvolvedor ? (
                    <CompaniesPage currentUser={currentUser} />
                  ) : (
                    <AccessDenied />
                  ))}
                  
                  {activeTab === 'logs' && (!!(currentUser.administrador || currentUser.desenvolvedor) ? (
                    <LogsPage />
                  ) : (
                    <AccessDenied />
                  ))}

                  {activeTab === 'reports' && (!!(currentUser.administrador || currentUser.desenvolvedor) ? (
                    <ReportsPage currentUser={currentUser} />
                  ) : (
                    <AccessDenied />
                  ))}

                  {activeTab === 'profile' && (
                    <ProfilePage currentUser={currentUser} onUpdate={setCurrentUser} />
                  )}

                  {activeTab === 'settings' && (
                    <SettingsPage 
                      currentUser={currentUser} 
                      onNavigate={(tab) => setActiveTab(tab)}
                      onUpdateUser={setCurrentUser}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return null;
}
