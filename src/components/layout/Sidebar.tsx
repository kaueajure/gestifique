import React, { useEffect } from "react";
import {
  LayoutDashboard,
  Ticket,
  BarChart3,
  Users,
  Building2,
  Shield,
  UserCircle,
  Settings,
  LogOut,
  X,
  BookOpen,
} from "lucide-react";
import { User } from "../../types";
import { cn } from "../../lib/utils";
import { AppLogo } from "../ui/Logo";
import { NotificationsDropdown } from "../ui/NotificationsDropdown";
import { hasPermission } from "../../lib/permissions";

interface SidebarProps {
  currentUser: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onNavigate: (link: string) => void;
}

export const Sidebar = ({
  currentUser,
  activeTab,
  setActiveTab,
  isOpen,
  onClose,
  onLogout,
  onNavigate,
}: SidebarProps) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const sections = [
    {
      title: "Operação",
      items: [
        {
          id: "dashboard",
          icon: LayoutDashboard,
          label: "Dashboard",
          access: hasPermission(currentUser, "dashboard.visualizar"),
        },
        {
          id: "tickets",
          icon: Ticket,
          label: "Chamados",
          access: hasPermission(currentUser, "tickets.visualizar"),
        },
        {
          id: "knowledge",
          icon: BookOpen,
          label: "Base de Conhecimento",
          access: hasPermission(currentUser, "base_conhecimento.visualizar"),
        },
      ],
    },
    {
      title: "Gestão",
      items: [
        {
          id: "reports",
          icon: BarChart3,
          label: "Relatórios",
          access: hasPermission(currentUser, "relatorios.visualizar"),
        },
        {
          id: "users",
          icon: Users,
          label: "Usuários e Permissões",
          access: hasPermission(currentUser, "usuarios.visualizar"),
        },
        {
          id: "companies",
          icon: Building2,
          label: "Clientes e Empresas",
          access: hasPermission(currentUser, "empresas.visualizar"),
        },
      ],
    },
    {
      title: "Sistema",
      items: [
        {
          id: "settings",
          icon: Settings,
          label: "Configurações e SLA",
          access: hasPermission(currentUser, "configuracoes.visualizar"),
        },
        {
          id: "logs",
          icon: Shield,
          label: "Auditoria",
          access: hasPermission(currentUser, "auditoria.visualizar"),
        },
      ],
    },
    {
      title: "Conta",
      items: [
        { id: "profile", icon: UserCircle, label: "Meu Perfil", access: true },
      ],
    },
  ];

  const handleNav = (id: string) => {
    setActiveTab(id);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="absolute inset-0 z-40 bg-slate-950/40 backdrop-blur-[1px] transition-opacity duration-300 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        role={isOpen ? "dialog" : "navigation"}
        aria-modal={isOpen ? "true" : undefined}
        aria-label="Menu principal"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[86vw] max-w-[320px] flex-col border-r border-slate-200/80 bg-white shadow-2xl shadow-slate-900/20 transition-transform duration-300 ease-out will-change-transform",
          "lg:relative lg:inset-auto lg:z-20 lg:h-full lg:w-[282px] lg:max-w-none lg:translate-x-0 lg:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200/80 px-4">
          <div className="flex items-center gap-2">
            <AppLogo size={24} />
            <span className="text-[14px] font-semibold text-slate-950 tracking-tight">
              Gestifique
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar menu"
            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md lg:hidden"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-3 py-4 custom-scrollbar">
          {sections.map((section) => {
            const accessibleItems = section.items.filter((i) => i.access);
            if (accessibleItems.length === 0) return null;

            return (
              <div key={section.title} className="space-y-1">
                <h3 className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {section.title}
                </h3>
                <div className="space-y-0.5">
                  {accessibleItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.id)}
                      className={cn(
                        "flex h-9 w-full items-center gap-2.5 rounded-md px-3 text-[13px] font-semibold transition-colors duration-150",
                        activeTab === item.id
                          ? "border border-blue-200 bg-blue-50 text-blue-800 shadow-sm shadow-blue-600/5"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                      )}
                    >
                      <item.icon
                        size={16}
                        className={cn(
                          "transition-colors shrink-0",
                          activeTab === item.id
                            ? "text-blue-600"
                            : "text-slate-400 group-hover:text-slate-600",
                        )}
                        strokeWidth={activeTab === item.id ? 2.5 : 2}
                      />
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="shrink-0 space-y-2 border-t border-slate-200/80 bg-white p-3">
          <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50/70 px-2.5 py-2 transition-colors hover:bg-white">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-sm">
              {currentUser.nome.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-slate-900 truncate tracking-tight">
                {currentUser.nome}
              </div>
              <div className="text-[11px] font-medium text-slate-500 truncate">
                {currentUser.cargo || "Membro do Time"}
              </div>
            </div>
            <NotificationsDropdown
              currentUser={currentUser}
              onNavigate={onNavigate}
              compact
            />
          </div>

          <button
            onClick={onLogout}
            className="w-full h-8 flex items-center gap-2.5 px-2.5 rounded-md text-[13px] font-medium text-slate-500 hover:text-red-700 hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} />
            Sair
          </button>

          <div className="flex items-center justify-center gap-3 pt-1 text-[10px] font-semibold text-slate-400">
            <a
              href="/politica-de-privacidade"
              target="_blank"
              rel="noreferrer"
              className="hover:text-blue-600 transition-colors"
            >
              Privacidade
            </a>
            <span className="text-slate-300">•</span>
            <a
              href="/termos-de-uso"
              target="_blank"
              rel="noreferrer"
              className="hover:text-blue-600 transition-colors"
            >
              Termos
            </a>
          </div>
        </div>
      </aside>
    </>
  );
};
