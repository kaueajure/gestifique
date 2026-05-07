import React from 'react';
import { ShieldAlert, Home } from 'lucide-react';

export const AccessDenied = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-8 animate-bounce">
        <ShieldAlert size={48} />
      </div>
      <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Acesso Bloqueado</h2>
      <p className="text-slate-500 max-w-sm mx-auto mb-10 font-medium text-lg leading-relaxed">
        Você não tem permissão de nível "Desenvolvedor" para gerenciar workspaces e empresas.
      </p>
      <button 
        onClick={() => window.location.href = '/'}
        className="h-14 px-10 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all flex items-center gap-3 shadow-xl shadow-slate-100"
      >
        <Home size={20} /> Voltar para o Início
      </button>
    </div>
  );
};
