import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Shield, Search, User as UserIcon, Calendar, Info, Filter, Loader2, AlertCircle } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export const LogsPage = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<any[]>('/logs');
      setLogs(data);
    } catch (err: any) { 
      setError(err.message || 'Erro ao carregar logs.');
    }
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

  const filteredLogs = logs.filter(log => 
    log.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.acao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.usuario_nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Audit Log</h2>
        <p className="text-slate-500 font-medium text-lg">Transparência total e conformidade em cada ação realizada no núcleo do sistema.</p>
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group w-full">
           <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
           <input 
             type="text" 
             placeholder="Filtrar por ação, descrição ou operador..." 
             className="w-full h-14 bg-slate-50 border-none rounded-2xl pl-14 pr-6 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
        <button className="h-14 w-14 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-blue-600 rounded-2xl transition-all border border-transparent hover:border-slate-100">
           <Filter size={20} />
        </button>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden font-medium">
        {loading && logs.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-4">
             <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
             <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Acessando Arquivos de Log...</p>
          </div>
        ) : error ? (
          <div className="p-24 text-center flex flex-col items-center">
             <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-6">
                <Shield size={40} />
             </div>
             <h4 className="text-xl font-black text-slate-800">Falha na Auditoria</h4>
             <p className="text-slate-500 font-medium mb-8 max-w-sm">{error}</p>
             <button onClick={fetchLogs} className="h-12 px-8 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all transition-all">Sincronizar Novamente</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 tracking-widest uppercase">Ação / Evento</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 tracking-widest uppercase">Descrição Detalhada</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 tracking-widest uppercase">Operador / Instância</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 tracking-widest uppercase">Cronologia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-8 py-6">
                      <Badge variant={getActionColor(log.acao) as any} className="px-4 py-1.5 uppercase font-black text-[10px] tracking-widest">{log.acao}</Badge>
                    </td>
                    <td className="px-8 py-6 max-w-md">
                       <div className="flex items-start gap-3">
                          <Info size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm font-bold text-slate-700 leading-relaxed">{log.descricao}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs uppercase",
                            log.usuario_nome ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"
                          )}>
                             {log.usuario_nome?.charAt(0) || 'S'}
                          </div>
                          <div>
                             <div className="text-sm font-black text-slate-800 leading-tight">{log.usuario_nome || 'Sistema (Worker)'}</div>
                             <div className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">{log.empresa_nome || 'Gestifique Master'}</div>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex flex-col gap-1">
                          <span className="text-xs font-black text-slate-700 flex items-center gap-1.5"><Calendar size={14} className="text-slate-300" /> {new Date(log.created_at).toLocaleString()}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 w-fit px-2 py-0.5 rounded-lg border border-slate-100">IP: {log.ip || 'Local / Interno'}</span>
                       </div>
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-8 py-32 text-center">
                       <div className="flex flex-col items-center">
                          <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-3xl flex items-center justify-center mb-4">
                             <Search size={32} />
                          </div>
                          <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Nenhum registro encontrado para a busca.</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
