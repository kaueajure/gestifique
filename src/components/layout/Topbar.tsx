import React from 'react';
import { Search, Bell, Menu, BellDot } from 'lucide-react';
import { User } from '../../types';

interface TopbarProps {
  title: string;
  onMenuClick: () => void;
  currentUser: User;
}

export const Topbar = ({ title, onMenuClick, currentUser }: TopbarProps) => {
  return (
    <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-xl font-black text-slate-900 tracking-tight hidden sm:block">
          {title}
        </h1>
      </div>

      <div className="flex-1 max-w-xl mx-8 hidden md:block">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Pesquisar chamados, usuários ou documentos..."
            className="w-full h-12 bg-slate-50 border-none rounded-2xl pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-100 transition-all outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-400 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-all relative">
          <BellDot size={20} className="text-blue-600" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
           <div className="text-right hidden sm:block">
              <div className="text-xs font-black text-slate-800">{currentUser.nome.split(' ')[0]}</div>
              <div className="text-[10px] font-bold text-slate-400">{currentUser.empresa_nome || 'Gestifique'}</div>
           </div>
           <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-blue-600 font-black relative overflow-hidden group">
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
