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
  Plus
} from 'lucide-react';
import { User } from '../../types';
import { cn } from '../../lib/utils';
import { AppLogo } from '../ui/Logo';

interface SidebarProps {
  currentUser: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export const Sidebar = ({ currentUser, activeTab, setActiveTab, isOpen, onClose, onLogout }: SidebarProps) => {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', access: true },
    { id: 'tickets', icon: Ticket, label: 'Atendimentos', access: true },
    { id: 'reports', icon: BarChart3, label: 'Relatórios', access: !!(currentUser.administrador || currentUser.desenvolvedor) },
    { id: 'users', icon: Users, label: 'Usuários', access: !!(currentUser.administrador || currentUser.desenvolvedor) },
    { id: 'companies', icon: Building2, label: 'Empresas', access: !!currentUser.desenvolvedor },
    { id: 'logs', icon: Shield, label: 'Logs do Sistema', access: !!(currentUser.administrador || currentUser.desenvolvedor) },
    { id: 'profile', icon: UserCircle, label: 'Meu Perfil', access: true },
    { id: 'settings', icon: Settings, label: 'Configurações', access: true },
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
        "fixed lg:static inset-y-0 left-0 w-64 bg-slate-50 border-r border-slate-200 z-50 flex flex-col transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-1.5">
            <AppLogo size={30} />
            <span className="text-lg font-bold text-slate-900 tracking-tight">Gestifique</span>
          </div>
          <button onClick={onClose} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-6 space-y-1">
           <div className="space-y-0.5">
             {menuItems.filter(item => item.access).map((item) => (
               <button
                 key={item.id}
                 onClick={() => handleNav(item.id)}
                 className={cn(
                   "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                   activeTab === item.id 
                    ? "bg-white text-blue-700 border border-slate-200 shadow-sm" 
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
                 )}
               >
                 <item.icon size={18} className={activeTab === item.id ? "text-blue-700" : "text-slate-400"} />
                 {item.label}
               </button>
             ))}
           </div>
        </div>

        <div className="p-3 border-t border-slate-200 bg-white space-y-3">
          <div className="flex items-center gap-3 px-3 py-2">
             <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs uppercase">
               {currentUser.nome.charAt(0)}
             </div>
             <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900 truncate">{currentUser.nome}</div>
                <div className="text-[11px] font-medium text-slate-500 truncate">{currentUser.cargo || 'Membro do Time'}</div>
             </div>
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
