import React from 'react';
import { Search, Menu } from 'lucide-react';
import { User } from '../../types';
import { NotificationsDropdown } from '../ui/NotificationsDropdown';

interface TopbarProps {
  title: string;
  onMenuClick: () => void;
  currentUser: User;
  onNavigate: (link: string) => void;
}

export const Topbar = ({ title, onMenuClick, currentUser, onNavigate }: TopbarProps) => {
  return (
    <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
        >
          <Menu size={20} />
        </button>
      </div>

      <div className="flex-1 max-w-xl mx-8 hidden md:block">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Pesquisar chamados, usuários ou documentos..."
            className="w-full h-12 bg-slate-50 border-none rounded-xl pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-100 transition-all outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <NotificationsDropdown currentUser={currentUser} onNavigate={onNavigate} />

        <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
           <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-800">{currentUser.nome.split(' ')[0]}</div>
              <div className="text-[10px] font-bold text-slate-400">{currentUser.empresa_nome || 'Gestifique'}</div>
           </div>
           <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-blue-600 font-bold relative overflow-hidden group">
              {currentUser.foto ? (
                <img src={currentUser.foto} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="uppercase text-sm">{currentUser.nome.charAt(0)}</span>
              )}
              <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/10 transition-colors" />
           </div>
        </div>
      </div>
    </header>
  );
};
