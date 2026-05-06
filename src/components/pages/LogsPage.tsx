import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Shield, Search, User as UserIcon, Calendar, Info, Filter } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';

export const LogsPage = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.get<any[]>('/logs');
      setLogs(data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, []);

  const getActionColor = (acao: string) => {
    if (acao.includes('CREATE')) return 'emerald';
    if (acao.includes('UPDATE')) return 'blue';
    if (acao.includes('DELETE')) return 'red';
    if (acao.includes('LOGIN')) return 'indigo';
    return 'slate';
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight text-gradient">Audit Log</h2>
        <p className="text-slate-500 font-medium tracking-tight">Transparência total e conformidade em cada ação realizada.</p>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group w-full">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
           <input type="text" placeholder="Filtrar por ação ou descrição..." className="w-full h-12 bg-slate-50 border-none rounded-2xl pl-12 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all" />
        </div>
        <button className="h-12 w-12 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-blue-600 rounded-2xl transition-all">
           <Filter size={18} />
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 tracking-widest uppercase">Ação</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 tracking-widest uppercase">Descrição</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 tracking-widest uppercase">Usuário / Empresa</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 tracking-widest uppercase">Data / IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-8 py-6 text-sm"><div className="w-24 h-4 bg-slate-100 rounded"></div></td>
                    <td className="px-8 py-6 text-sm"><div className="w-48 h-4 bg-slate-100 rounded"></div></td>
                    <td className="px-8 py-6 text-sm"><div className="w-32 h-4 bg-slate-100 rounded"></div></td>
                    <td className="px-8 py-6 text-sm"><div className="w-24 h-4 bg-slate-100 rounded"></div></td>
                  </tr>
                ))
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-all group">
                    <td className="px-8 py-6">
                      <Badge variant={getActionColor(log.acao) as any}>{log.acao}</Badge>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-2">
                          <Info size={14} className="text-blue-400" />
                          <span className="text-sm font-bold text-slate-700">{log.descricao}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-500 uppercase">
                             {log.usuario_nome?.charAt(0) || 'S'}
                          </div>
                          <div>
                             <div className="text-xs font-black text-slate-800">{log.usuario_nome || 'Sistema'}</div>
                             <div className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">{log.empresa_nome || 'Gestifique'}</div>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700 flex items-center gap-1"><Calendar size={12} className="text-slate-300" /> {new Date(log.created_at).toLocaleString()}</span>
                          <span className="text-[10px] font-medium text-slate-400 tracking-wider">IP: {log.ip || '---'}</span>
                       </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-medium">Nenhum log registrado ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
