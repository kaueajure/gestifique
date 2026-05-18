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
import { LoginPage } from "./components/auth/LoginPage";
import { ForgotPasswordPage } from "./components/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./components/auth/ResetPasswordPage";
import { hasPermission } from "./lib/permissions";
import { User } from "./types";
import { api } from "./lib/api";
import { cn } from "./lib/utils";
import { Loader2 } from "lucide-react";

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
  const [authLoading, setAuthLoading] = useState(false);
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
    setAuthLoading(true);
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
        err instanceof Error ? err.message : "Não foi possível autenticar. Verifique seus dados e tente novamente.";
      setAuthError(message);
    } finally {
      setAuthLoading(false);
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
    setAuthLoading(true);
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
        err instanceof Error ? err.message : "Não foi possível enviar o código agora. Tente novamente em alguns instantes.";
      setAuthError(message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResetPassword = async (email: string, token: string, newPassword: string) => {
    setAuthError(null);
    setAuthSuccess(null);
    setAuthLoading(true);

    try {
      const data = await api.post<{ message: string }>("/auth/reset-password", {
        email,
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
        err instanceof Error ? err.message : "Código ou senha inválidos. Confira as informações e tente novamente.";
      setAuthError(message);
    } finally {
      setAuthLoading(false);
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
      <LoginPage
        onSubmit={handleLogin}
        authError={authError}
        loading={authLoading}
        onForgotPassword={() => {
          setView("forgot-password");
          setAuthError(null);
          setAuthSuccess(null);
          window.history.pushState({}, '', '/esqueci-senha');
        }}
        onBackToSite={() => {
          setView("landing");
          window.history.pushState({}, '', '/');
        }}
      />
    );
  }

  if (view === "forgot-password") {
    return (
      <ForgotPasswordPage
        onSubmit={handleForgotPassword}
        authError={authError}
        authSuccess={authSuccess}
        loading={authLoading}
        onBackToLogin={() => {
          setView("login");
          setAuthError(null);
          setAuthSuccess(null);
          window.history.pushState({}, '', '/login');
        }}
        onBackToSite={() => {
          setView("landing");
          window.history.pushState({}, '', '/');
        }}
      />
    );
  }

  if (view === "reset-password") {
    return (
      <ResetPasswordPage
        onSubmit={handleResetPassword}
        initialEmail={resetEmail}
        authError={authError}
        authSuccess={authSuccess}
        loading={authLoading}
        onBackToLogin={() => {
          setView("login");
          setAuthError(null);
          setAuthSuccess(null);
          window.history.pushState({}, '', '/login');
        }}
        onBackToSite={() => {
          setView("landing");
          window.history.pushState({}, '', '/');
        }}
      />
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
              "flex-1 custom-scrollbar min-h-0",
              activeTab === "tickets" && selectedTicketId
                ? "overflow-hidden"
                : "overflow-y-auto",
            )}
          >
            <div
              className={cn(
                "max-w-[1600px] mx-auto w-full transition-all duration-300",
                activeTab === "tickets" && selectedTicketId
                  ? "h-full p-0 sm:p-3 lg:p-4"
                  : "p-3 sm:p-4 lg:p-6 lg:pb-10",
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
