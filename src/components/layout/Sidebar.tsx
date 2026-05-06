import React from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  Ticket, 
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

interface SidebarProps {
  currentUser: User;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export const Sidebar = ({ currentUser, activeTab, setActiveTab, isOpen, onClose, onLogout }: SidebarProps) => {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', access: true },
    { id: 'tickets', icon: Ticket, label: 'Atendimentos', access: true },
    { id: 'users', icon: Users, label: 'Usuários', access: currentUser.administrador || currentUser.desenvolvedor },
    { id: 'companies', icon: Building2, label: 'Empresas', access: currentUser.desenvolvedor },
    { id: 'logs', icon: Shield, label: 'Logs do Sistema', access: currentUser.administrador || currentUser.desenvolvedor },
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
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden" 
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 w-72 bg-white border-r border-slate-100 z-50 flex flex-col transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="h-20 flex items-center justify-between px-8 border-b border-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
               <Ticket className="text-white" size={24} />
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight">Gestifique</span>
          </div>
          <button onClick={onClose} className="lg:hidden p-2 text-slate-400 hover:bg-slate-50 rounded-xl">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-8 space-y-2">
           <div className="px-4 mb-4">
              <button 
                onClick={() => handleNav('tickets')}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-100 transition-all hover:scale-[1.02] active:scale-95"
              >
                <Plus size={18} /> Novo Chamado
              </button>
           </div>

           <div className="space-y-1">
             {menuItems.filter(item => item.access).map((item) => (
               <button
                 key={item.id}
                 onClick={() => handleNav(item.id)}
                 className={cn(
                   "w-full flex items-center gap-4 px-4 py-3 rounded-2xl font-bold text-sm transition-all duration-200",
                   activeTab === item.id 
                    ? "bg-blue-50 text-blue-600 shadow-sm" 
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                 )}
               >
                 <item.icon size={20} className={activeTab === item.id ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"} />
                 {item.label}
                 {activeTab === item.id && (
                   <motion.div layoutId="nav-indicator" className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full" />
                 )}
               </button>
             ))}
           </div>
        </div>

        <div className="p-4 border-t border-slate-50 space-y-2">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl font-bold text-sm text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut size={20} />
            Sair do Sistema
          </button>
          
          <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 font-black text-sm uppercase">
               {currentUser.nome.charAt(0)}
             </div>
             <div className="flex-1 min-w-0">
                <div className="text-xs font-black text-slate-800 truncate">{currentUser.nome}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{currentUser.cargo || 'Usuário'}</div>
             </div>
          </div>
        </div>
      </aside>
    </>
  );
};
