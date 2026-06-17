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
  Bot
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
          access: true,
        },
        { id: "tickets", icon: Ticket, label: "Atendimentos", access: true },
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
          label: "Equipe",
          access: hasPermission(currentUser, "configuracoes.gerenciar"),
        },
        {
          id: "companies",
          icon: Building2,
          label: "Empresas",
          access: !!currentUser.desenvolvedor,
        },
      ],
    },
    {
      title: "Sistema",
      items: [
        {
          id: "ai",
          icon: Bot,
          label: "Assistente de IA",
          access: hasPermission(currentUser, "ia.visualizar"),
          disabled: true,
          title: "Beta: temporariamente desativado.",
        },
        {
          id: "settings",
          icon: Settings,
          label: "Configurações",
          access: hasPermission(currentUser, "configuracoes.gerenciar"),
        },
        {
          id: "logs",
          icon: Shield,
          label: "Logs do Sistema",
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
          className="absolute inset-0 z-40 bg-slate-950/40 backdrop-blur-[1px] transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu principal"
        className={cn(
          "absolute inset-y-0 left-0 z-50 flex w-[82vw] max-w-[320px] sm:w-80 lg:w-72 xl:w-80 flex-col bg-white border-r border-slate-200/70 shadow-2xl shadow-slate-900/20 transition-transform duration-300 ease-out will-change-transform",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="h-12 flex items-center justify-between px-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <AppLogo size={24} />
            <span className="text-[14px] font-bold text-slate-900 tracking-tight">
              Gestifique
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar menu"
            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 custom-scrollbar">
          {sections.map((section) => {
            const accessibleItems = section.items.filter((i) => i.access);
            if (accessibleItems.length === 0) return null;

            return (
              <div key={section.title} className="space-y-1">
                <h3 className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {section.title}
                </h3>
                <div className="space-y-0.5">
                  {accessibleItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => !item.disabled && handleNav(item.id)}
                      disabled={item.disabled}
                      title={item.title}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 h-8 rounded-md text-[13px] font-semibold transition-all duration-200",
                        item.disabled && "cursor-not-allowed opacity-50",
                        activeTab === item.id
                          ? "bg-slate-100 text-slate-900"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
                      )}
                    >
                      <item.icon
                        size={16}
                        className={cn(
                          "transition-colors shrink-0",
                          activeTab === item.id
                            ? "text-slate-800"
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

        <div className="p-3 border-t border-slate-100 bg-white shrink-0 space-y-2">
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-md bg-slate-50/50 hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors">
            <div className="w-7 h-7 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0 shadow-sm">
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
