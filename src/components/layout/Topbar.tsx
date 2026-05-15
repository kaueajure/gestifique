import React from "react";
import { Search, Menu } from "lucide-react";
import { User } from "../../types";
import { NotificationsDropdown } from "../ui/NotificationsDropdown";

interface TopbarProps {
  title: string;
  onMenuClick: () => void;
  showSearch?: boolean;
}

export const Topbar = ({
  title,
  onMenuClick,
  showSearch = true,
}: TopbarProps) => {
  return (
    <header className="h-12 bg-white border-b border-slate-100 flex items-center justify-between px-5 sticky top-0 z-30 shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 text-slate-500 hover:bg-slate-50 rounded-md transition-colors"
        >
          <Menu size={16} />
        </button>
        <h1 className="text-[14px] font-semibold text-slate-800 tracking-tight hidden sm:block">
          {title}
        </h1>
      </div>

      <div className="flex-1 max-w-xs ml-auto mr-0 hidden md:block">
        {showSearch && (
          <div className="relative group">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
              size={14}
            />
            <input
              type="text"
              placeholder="Pesquisar..."
              className="w-full h-8 bg-slate-50/50 border border-slate-200 rounded-md pl-8 pr-3 text-[13px] text-slate-700 placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
            />
          </div>
        )}
      </div>
    </header>
  );
};
