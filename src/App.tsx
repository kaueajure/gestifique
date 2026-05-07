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
import { AccessDenied } from './components/ui/AccessDenied';
import { LandingPage } from './components/public/LandingPage';
import { User } from './types';
import { api } from './lib/api';
import { 
  ArrowRight, 
  Shield, 
  Zap, 
  Loader2,
  Lock,
  Mail,
  Ticket as TicketIcon,
  Settings
} from 'lucide-react';

type ViewState = 'landing' | 'login' | 'register' | 'dashboard';
type ActiveTab = 'dashboard' | 'tickets' | 'users' | 'companies' | 'logs' | 'profile' | 'settings';

export default function App() {
  const [view, setView] = useState<ViewState>('landing');
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isBooting, setIsBooting] = useState(true);

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

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError(null);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
      const data = await api.post<{ user: User }>('/auth/login', { email, password });
      setCurrentUser(data.user);
      setView('dashboard');
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout', {});
    } catch (e) {}
    setCurrentUser(null);
    setView('landing');
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
             <div className="inline-flex w-16 h-16 bg-blue-600 rounded-[28px] items-center justify-center shadow-xl shadow-blue-100 mb-6">
                <TicketIcon className="text-white" size={32} />
             </div>
             <h2 className="text-3xl font-black text-slate-900 tracking-tight">Bem-vindo de volta</h2>
             <p className="text-slate-500 font-medium">Acesse sua conta Gestifique</p>
          </div>

          <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-2xl shadow-slate-100">
             <form onSubmit={handleLogin} className="space-y-6">
                {authError && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold">
                    <Lock size={16} /> {authError}
                  </div>
                )}
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">E-mail Corporativo</label>
                   <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                      <input 
                        name="email"
                        type="email" 
                        required 
                        className="w-full h-14 bg-slate-50 border-none rounded-2xl pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all outline-none" 
                        placeholder="nome@empresa.com"
                      />
                   </div>
                </div>
                <div className="space-y-1.5">
                   <div className="flex items-center justify-between px-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Senha de Acesso</label>
                      <button type="button" className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Esqueceu?</button>
                   </div>
                   <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                      <input 
                        name="password"
                        type="password" 
                        required 
                        className="w-full h-14 bg-slate-50 border-none rounded-2xl pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all outline-none" 
                        placeholder="••••••••"
                      />
                   </div>
                </div>
                <button className="w-full h-14 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-3">
                   Entrar no Painel <ArrowRight size={20} />
                </button>
             </form>
          </div>
          
          <div className="mt-8 text-center">
             <button onClick={() => setView('landing')} className="text-sm font-bold text-slate-400 hover:text-slate-600 flex items-center gap-2 mx-auto transition-all">
                ← Voltar para a página inicial
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
        case 'dashboard': return 'Início';
        case 'tickets': return selectedTicketId ? 'Chamado' : 'Meus Atendimentos';
        case 'users': return 'Time Gestifique';
        case 'companies': return 'Workspaces Habilitados';
        case 'logs': return 'Histórico de Eventos';
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
                    <TicketsPage onSelectTicket={setSelectedTicketId} />
                  )}
                  
                  {activeTab === 'tickets' && selectedTicketId && (
                    <TicketDetailsPage 
                      ticketId={selectedTicketId} 
                      onBack={() => setSelectedTicketId(null)} 
                      currentUser={currentUser}
                    />
                  )}

                  {activeTab === 'users' && (currentUser.administrador || currentUser.desenvolvedor ? (
                    <UsersPage currentUser={currentUser} />
                  ) : (
                    <AccessDenied />
                  ))}
                  
                  {activeTab === 'companies' && (currentUser.desenvolvedor ? (
                    <CompaniesPage currentUser={currentUser} />
                  ) : (
                    <AccessDenied />
                  ))}
                  
                  {activeTab === 'logs' && (currentUser.administrador || currentUser.desenvolvedor ? (
                    <LogsPage />
                  ) : (
                    <AccessDenied />
                  ))}

                  {activeTab === 'profile' && (
                    <ProfilePage currentUser={currentUser} onUpdate={setCurrentUser} />
                  )}

                  {activeTab === 'settings' && (
                    <SettingsPage currentUser={currentUser} />
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
