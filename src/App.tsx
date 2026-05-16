import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sidebar } from "./components/layout/Sidebar";
import { Topbar } from "./components/layout/Topbar";
import { DashboardPage } from "./components/pages/DashboardPage";
import { TicketsPage } from "./components/pages/TicketsPage";
import { TicketDetailsPage } from "./components/pages/TicketDetailsPage";
import { UsersPage } from "./components/pages/UsersPage";
import { CompaniesPage } from "./components/pages/CompaniesPage";
import { LogsPage } from "./components/pages/LogsPage";
import { ProfilePage } from "./components/pages/ProfilePage";
import { SettingsPage } from "./components/pages/SettingsPage";
import { ReportsPage } from "./components/pages/ReportsPage";
import { KnowledgePage } from "./components/pages/KnowledgePage";
import { AccessDenied } from "./components/ui/AccessDenied";
import { PublicSite } from "./components/public/PublicSite";
import { SatisfactionPage } from "./components/public/SatisfactionPage";
import { hasPermission } from "./lib/permissions";
import { User } from "./types";
import { api } from "./lib/api";
import { Card } from "./components/ui/Card";
import { Input } from "./components/ui/Input";
import { Button } from "./components/ui/Button";
import { AppLogo } from "./components/ui/Logo";
import { cn } from "./lib/utils";
import {
  ArrowRight,
  Shield,
  Zap,
  Loader2,
  Lock,
  Mail,
  Settings,
  AlertCircle,
} from "lucide-react";

import { PortalLayout } from "./components/portal/PortalLayout";

type ViewState =
  | "landing"
  | "login"
  | "forgot-password"
  | "reset-password"
  | "dashboard"
  | "portal";
type ActiveTab =
  | "dashboard"
  | "tickets"
  | "users"
  | "companies"
  | "logs"
  | "profile"
  | "settings"
  | "reports"
  | "knowledge";

export default function App() {
  const getViewFromPath = (pathname: string): ViewState => {
    if (pathname === '/login') return 'login';
    if (pathname === '/esqueci-senha') return 'forgot-password';
    if (pathname === '/reset-password') return 'reset-password';
    return 'landing';
  };

  const [view, setView] = useState<ViewState>(() => getViewFromPath(window.location.pathname));
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [isBooting, setIsBooting] = useState(true);
  const [resetEmail, setResetEmail] = useState("");

  // CSAT Route Check
  const path = window.location.pathname;
  if (path.startsWith("/csat/")) {
    const token = path.replace("/csat/", "");
    return <SatisfactionPage token={token} />;
  }

  useEffect(() => {
    const handlePopState = () => {
      // Sync browser history with the app state for public routes
      const path = window.location.pathname;
      const parsedView = getViewFromPath(path);
      
      // If user is logged in, do not kick them to landing just because of popstate
      // unless specifically intended. We'll handle basic public state syncing here.
      setView((currentView) => {
        // If they are on dashboard/portal, don't break their session on back button
        // They would explicitly logout
        if (currentView === 'dashboard' || currentView === 'portal') {
          return currentView;
        }
        return parsedView;
      });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    // Check session on load
    const checkAuth = async () => {
      try {
        const user = await api.get<User>("/profile");
        setCurrentUser(user);
        if (user.perfil === "cliente") {
          setView("portal");
        } else {
          setView("dashboard");
        }
      } catch (err) {
        setView(getViewFromPath(window.location.pathname));
      } finally {
        setIsBooting(false);
      }
    };

    checkAuth();

    // Global event listener for unauthorized requests
    const handleUnauthorized = (e: Event) => {
      const customEvent = e as CustomEvent<{ endpoint?: string }>;
      const endpoint = customEvent.detail?.endpoint;

      if (endpoint === "/profile" || endpoint === "/auth/login") {
        return;
      }

      setCurrentUser(null);
      setView("login");
      window.history.pushState({}, '', '/login');
      setAuthError("Sessão expirada. Faça login novamente.");
    };

    window.addEventListener(
      "api:unauthorized",
      handleUnauthorized as EventListener,
    );
    return () =>
      window.removeEventListener(
        "api:unauthorized",
        handleUnauthorized as EventListener,
      );
  }, []);

  const handleNotificationNavigate = (link: string) => {
    if (link.startsWith("ticket:")) {
      const ticketId = parseInt(link.split(":")[1]);
      if (!isNaN(ticketId)) {
        setSelectedTicketId(ticketId);
        setActiveTab("tickets");
      }
    } else if (link === "tickets") {
      setActiveTab("tickets");
      setSelectedTicketId(null);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError(null);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      await api.post("/auth/login", { email, password });
      // Fetch full profile after login to guarantee consistent corporate data
      const profile = await api.get<User>("/profile");
      setCurrentUser(profile);
      if (profile.perfil === "cliente") {
        setView("portal");
      } else {
        setView("dashboard");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao autenticar.";
      setAuthError(message);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout", {});
    } catch (e) {}
    setCurrentUser(null);
    setView("landing");
    window.history.pushState({}, '', '/');
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    try {
      const data = await api.post<{ message: string }>(
        "/auth/forgot-password",
        { email },
      );
      setAuthSuccess(data.message);
      setResetEmail(email);
      setTimeout(() => {
        setView("reset-password");
        window.history.pushState({}, '', '/reset-password');
      }, 2000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao solicitar recuperação.";
      setAuthError(message);
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    const formData = new FormData(e.currentTarget);
    const token = formData.get("token");
    const newPassword = formData.get("newPassword");

    try {
      const data = await api.post<{ message: string }>("/auth/reset-password", {
        email: resetEmail,
        token,
        newPassword,
      });
      setAuthSuccess(data.message);
      setTimeout(() => {
        setView("login");
        window.history.pushState({}, '', '/login');
        setAuthSuccess(null);
      }, 2000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao redefinir a senha.";
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

  if (view === "landing") {
    return <PublicSite onLogin={() => {
      setView("login");
      window.history.pushState({}, '', '/login');
    }} />;
  }

  if (view === "login") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[360px]"
        >
          <div className="text-center mb-6">
            <AppLogo size={48} className="mb-3 mx-auto" />
            <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
              Bem-vindo
            </h2>
            <p className="text-sm text-slate-500">
              Acesse o portal do cliente Gestifique
            </p>
          </div>

          <Card className="p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {authError && (
                <div className="p-2.5 bg-red-50 border border-red-100 rounded-md flex items-center gap-2 text-red-600 text-xs font-medium animate-in fade-in slide-in-from-top-1">
                  <AlertCircle size={14} /> {authError}
                </div>
              )}

              <Input
                label="E-mail Corporativo"
                name="email"
                type="email"
                required
                className="h-9 text-sm"
                placeholder="exemplo@empresa.com"
              />

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-700">
                    Senha
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setView("forgot-password");
                      setAuthError(null);
                      setAuthSuccess(null);
                      window.history.pushState({}, '', '/esqueci-senha');
                    }}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <input
                  name="password"
                  type="password"
                  required
                  className="w-full h-9 bg-slate-50 border border-slate-200 rounded-md px-3 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>

              <Button type="submit" size="sm" className="w-full h-9 text-sm">
                Entrar <ArrowRight size={14} className="ml-1.5" />
              </Button>
            </form>
          </Card>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setView("landing");
                window.history.pushState({}, '', '/');
              }}
              className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center justify-center gap-1.5 mx-auto transition-colors"
            >
              <ArrowRight size={14} className="rotate-180" /> Voltar ao início
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (view === "forgot-password") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[360px]"
        >
          <div className="text-center mb-6">
            <div className="inline-flex w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
              <Mail className="text-blue-600" size={20} />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
              Recuperar Senha
            </h2>
            <p className="text-sm text-slate-500">
              Enviaremos um código para o seu e-mail
            </p>
          </div>

          <Card className="p-6">
            <form onSubmit={handleForgotPassword} className="space-y-4">
              {authError && (
                <div className="p-2.5 bg-red-50 border border-red-100 rounded-md flex items-center gap-2 text-red-600 text-xs font-medium animate-in fade-in slide-in-from-top-1">
                  <AlertCircle size={14} /> {authError}
                </div>
              )}
              {authSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-md flex items-center gap-2 text-emerald-700 text-xs font-medium animate-in fade-in slide-in-from-top-1">
                  <Shield size={14} /> {authSuccess}
                </div>
              )}

              <Input
                label="E-mail Corporativo"
                name="email"
                type="email"
                required
                className="h-9 text-sm"
                placeholder="exemplo@empresa.com"
              />

              <Button
                type="submit"
                size="sm"
                className="w-full h-9 text-sm"
              >
                Enviar código
              </Button>
            </form>
          </Card>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setView("login");
                setAuthError(null);
                setAuthSuccess(null);
                window.history.pushState({}, '', '/login');
              }}
              className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center justify-center gap-1.5 mx-auto transition-colors"
            >
              <ArrowRight size={14} className="rotate-180" /> Voltar ao login
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (view === "reset-password") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[360px]"
        >
          <div className="text-center mb-6">
            <div className="inline-flex w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
              <Lock className="text-blue-600" size={20} />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
              Nova Senha
            </h2>
            <p className="text-sm text-slate-500">
              Digite o código recebido no seu e-mail
            </p>
          </div>

          <Card className="p-6">
            <form onSubmit={handleResetPassword} className="space-y-4">
              {authError && (
                <div className="p-2.5 bg-red-50 border border-red-100 rounded-md flex items-center gap-2 text-red-600 text-xs font-medium animate-in fade-in slide-in-from-top-1">
                  <AlertCircle size={14} /> {authError}
                </div>
              )}
              {authSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-md flex items-center gap-2 text-emerald-700 text-xs font-medium animate-in fade-in slide-in-from-top-1">
                  <Shield size={14} /> {authSuccess}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Código de 6 dígitos
                </label>
                <input
                  name="token"
                  type="text"
                  required
                  className="w-full h-10 bg-slate-50 border border-slate-200 rounded-md px-3 text-center text-lg font-semibold tracking-widest focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all outline-none"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>

              <Input
                label="Nova Senha"
                name="newPassword"
                type="password"
                required
                className="h-9 text-sm"
                placeholder="Mínimo 6 caracteres"
              />

              <Button
                type="submit"
                size="sm"
                className="w-full h-9 text-sm"
              >
                Redefinir senha
              </Button>
            </form>
          </Card>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setView("login");
                setAuthError(null);
                setAuthSuccess(null);
                window.history.pushState({}, '', '/login');
              }}
              className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center justify-center gap-1.5 mx-auto transition-colors"
            >
              <ArrowRight size={14} className="rotate-180" /> Voltar ao login
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (view === "portal" && currentUser) {
    return <PortalLayout currentUser={currentUser} onLogout={handleLogout} />;
  }

  // --- DASHBOARD LAYOUT ---

  if (view === "dashboard" && currentUser) {
    const getPageTitle = () => {
      switch (activeTab) {
        case "dashboard":
          return "Dashboard de Controle";
        case "tickets":
          return selectedTicketId ? "Chamado" : "Central de Chamados";
        case "users":
          return "Gestão de Usuários";
        case "companies":
          return "Empresas Ativas";
        case "logs":
          return "Logs do Sistema";
        case "reports":
          return "Relatórios Gerenciais";
        case "knowledge":
          return "Base de Conhecimento";
        case "profile":
          return "Configurações de Perfil";
        case "settings":
          return "Preferências";
        default:
          return "Gestifique";
      }
    };

    return (
      <div className="min-h-screen bg-[#FDFDFF] flex">
        <Sidebar
          currentUser={currentUser}
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab as ActiveTab);
            setSelectedTicketId(null);
          }}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onLogout={handleLogout}
          onNavigate={handleNotificationNavigate}
        />

        <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
          <Topbar
            title={getPageTitle()}
            onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
            showSearch={!(activeTab === "tickets" && selectedTicketId)}
          />

          <main
            className={cn(
              "flex-1 custom-scrollbar",
              activeTab === "tickets" && selectedTicketId
                ? "overflow-hidden"
                : "overflow-y-auto",
            )}
          >
            <div
              className={cn(
                "max-w-[1600px] mx-auto w-full",
                activeTab === "tickets" && selectedTicketId
                  ? "h-full p-0 sm:p-4"
                  : "p-4 sm:p-5",
              )}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab + (selectedTicketId || "")}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    activeTab === "tickets" && selectedTicketId && "h-full",
                  )}
                >
                  {activeTab === "dashboard" && (
                    <DashboardPage
                      onNavigate={(tab) => setActiveTab(tab as ActiveTab)}
                    />
                  )}

                  {activeTab === "tickets" && !selectedTicketId && (
                    <TicketsPage
                      onSelectTicket={setSelectedTicketId}
                      currentUser={currentUser}
                    />
                  )}

                  {activeTab === "tickets" && selectedTicketId && (
                    <TicketDetailsPage
                      ticketId={selectedTicketId}
                      onBack={() => setSelectedTicketId(null)}
                      currentUser={currentUser}
                    />
                  )}

                  {activeTab === "users" &&
                    (!!(
                      currentUser.administrador || currentUser.desenvolvedor
                    ) ? (
                      <UsersPage currentUser={currentUser} />
                    ) : (
                      <AccessDenied />
                    ))}

                  {activeTab === "companies" &&
                    (!!currentUser.desenvolvedor ? (
                      <CompaniesPage currentUser={currentUser} />
                    ) : (
                      <AccessDenied />
                    ))}

                  {activeTab === "logs" &&
                    (!!(
                      currentUser.administrador || currentUser.desenvolvedor
                    ) ? (
                      <LogsPage />
                    ) : (
                      <AccessDenied />
                    ))}

                  {activeTab === "reports" &&
                    (!!(
                      currentUser.administrador || currentUser.desenvolvedor
                    ) ? (
                      <ReportsPage currentUser={currentUser} />
                    ) : (
                      <AccessDenied />
                    ))}

                  {activeTab === "knowledge" &&
                    (hasPermission(
                      currentUser,
                      "base_conhecimento.visualizar",
                    ) || !!currentUser.administrador ? (
                      <KnowledgePage currentUser={currentUser} />
                    ) : (
                      <AccessDenied />
                    ))}

                  {activeTab === "profile" && (
                    <ProfilePage
                      currentUser={currentUser}
                      onUpdate={setCurrentUser}
                    />
                  )}

                  {activeTab === "settings" && (
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
