import React from 'react';
import { Search, Menu } from 'lucide-react';
import { User } from '../../types';
import { NotificationsDropdown } from '../ui/NotificationsDropdown';

interface TopbarProps {
  title: string;
  onMenuClick: () => void;
}

export const Topbar = ({ title, onMenuClick }: TopbarProps) => {
  return (
    <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-30 shrink-0">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <Menu size={18} />
        </button>
      </div>

      <div className="flex-1 max-w-lg mx-6 hidden md:block">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={15} />
          <input 
            type="text" 
            placeholder="Pesquisar chamados, usuários ou documentos..."
            className="w-full h-9 bg-slate-50 border border-slate-100 rounded-lg pl-9 pr-3 text-xs font-medium text-slate-600 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-100 focus:border-blue-200 transition-all outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-10 hidden md:block" />
      </div>
    </header>
  );
};
