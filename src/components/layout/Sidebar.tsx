import React from 'react';
import { motion } from 'motion/react';
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
  Plus,
  BookOpen
} from 'lucide-react';
import { User } from '../../types';
import { cn } from '../../lib/utils';
import { AppLogo } from '../ui/Logo';
import { NotificationsDropdown } from '../ui/NotificationsDropdown';
import { hasPermission } from '../../lib/permissions';

interface SidebarProps {
  currentUser: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onNavigate: (link: string) => void;
}

export const Sidebar = ({ currentUser, activeTab, setActiveTab, isOpen, onClose, onLogout, onNavigate }: SidebarProps) => {
  const sections = [
    {
      title: 'Operação',
      items: [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', access: true },
        { id: 'tickets', icon: Ticket, label: 'Atendimentos', access: true },
        { id: 'knowledge', icon: BookOpen, label: 'Base de Conhecimento', access: hasPermission(currentUser, 'base_conhecimento.visualizar') },
      ]
    },
    {
      title: 'Gestão',
      items: [
        { id: 'reports', icon: BarChart3, label: 'Relatórios', access: hasPermission(currentUser, 'relatorios.visualizar') },
        { id: 'users', icon: Users, label: 'Equipe', access: hasPermission(currentUser, 'configuracoes.gerenciar') },
        { id: 'companies', icon: Building2, label: 'Empresas', access: !!currentUser.desenvolvedor },
      ]
    },
    {
      title: 'Sistema',
      items: [
        { id: 'settings', icon: Settings, label: 'Configurações', access: hasPermission(currentUser, 'configuracoes.gerenciar') },
        { id: 'logs', icon: Shield, label: 'Logs do Sistema', access: hasPermission(currentUser, 'auditoria.visualizar') },
      ]
    },
    {
      title: 'Conta',
      items: [
        { id: 'profile', icon: UserCircle, label: 'Meu Perfil', access: true },
      ]
    }
  ];

  const handleNav = (id: string) => {
    setActiveTab(id);
    if (window.innerWidth < 1024) onClose();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden" 
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 w-64 bg-white border-r border-slate-200/60 z-50 flex flex-col transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-200">
              <Plus size={20} strokeWidth={3} />
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight">Gestifique</span>
          </div>
          <button onClick={onClose} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {sections.map((section) => {
            const accessibleItems = section.items.filter(i => i.access);
            if (accessibleItems.length === 0) return null;

            return (
              <div key={section.title} className="space-y-2">
                <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {accessibleItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
                        activeTab === item.id 
                          ? "bg-blue-50 text-blue-600 shadow-sm shadow-blue-100/50" 
                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                      )}
                    >
                      <item.icon 
                        size={18} 
                        className={cn(
                          "transition-colors",
                          activeTab === item.id ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                        )} 
                        strokeWidth={activeTab === item.id ? 2.5 : 2}
                      />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t border-slate-200 bg-white space-y-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100">
             <div className="w-8 h-8 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">
               {currentUser.nome.charAt(0).toUpperCase()}
             </div>
             <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900 truncate">{currentUser.nome}</div>
                <div className="text-[10px] font-medium text-slate-500 truncate">{currentUser.cargo || 'Membro do Time'}</div>
             </div>
             <NotificationsDropdown 
               currentUser={currentUser} 
               onNavigate={onNavigate} 
               compact 
             />
          </div>

          <button
            onClick={onLogout}
            className="w-full h-9 flex items-center gap-3 px-3 rounded-lg text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
};
