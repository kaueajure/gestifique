import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Search, Calendar, Info, Loader2, AlertCircle, ChevronLeft, ChevronRight, RefreshCw, FilterX } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';
import { SystemLog } from '../../types';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const LogsPage = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  
  // Filtros
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    start_date: '',
    end_date: '',
    page: 1,
    limit: 15
  });

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString(),
        search: filters.search,
        action: filters.action,
        start_date: filters.start_date,
        end_date: filters.end_date
      });
      
      const response = await api.get<{ items: SystemLog[], pagination: Pagination }>(`/logs?${queryParams.toString()}`);
      setLogs(response.items);
      setPagination(response.pagination);
    } catch (err: any) { 
      setError(err.message || 'Erro ao carregar logs.');
    }
    finally { setLoading(false); }
  };

  useEffect(() => { 
    const debounce = setTimeout(() => {
      fetchLogs();
    }, 300);
    return () => clearTimeout(debounce);
  }, [filters.search, filters.page, filters.action, filters.start_date, filters.end_date]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(f => ({ ...f, page: 1 }));
    fetchLogs();
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      action: '',
      start_date: '',
      end_date: '',
      page: 1,
      limit: 15
    });
  };

  const getActionColor = (acao: string) => {
    if (acao.includes('CREATE')) return 'emerald';
    if (acao.includes('UPDATE')) return 'blue';
    if (acao.includes('DELETE')) return 'red';
    if (acao.includes('LOGIN')) return 'indigo';
    if (acao.includes('PASSWORD')) return 'orange';
    return 'slate';
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Audit Log</h2>
          <p className="text-slate-500 font-medium text-lg">Transparência total e conformidade em cada ação realizada no núcleo do sistema.</p>
        </div>
        <button 
          onClick={fetchLogs}
          className="h-12 px-6 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Atualizar
        </button>
      </div>

      <div className="space-y-4">
        <form onSubmit={handleSearch} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 group w-full">
               <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
               <input 
                 type="text" 
                 placeholder="Buscar por descrição, ação, usuário ou empresa..." 
                 className="w-full h-14 bg-slate-50 border-none rounded-2xl pl-14 pr-6 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                 value={filters.search}
                 onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
               />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <select 
                value={filters.action}
                onChange={(e) => setFilters(f => ({ ...f, action: e.target.value, page: 1 }))}
                className="h-14 px-6 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none min-w-[160px]"
              >
                <option value="">Todas as Ações</option>
                <option value="LOGIN">Login</option>
                <option value="CREATE">Criação</option>
                <option value="UPDATE">Atualização</option>
                <option value="DELETE">Exclusão</option>
                <option value="PROFILE_UPDATE">Perfil</option>
                <option value="PASSWORD_CHANGE">Senha</option>
              </select>
              <button type="submit" className="h-14 px-8 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95">
                Buscar
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-50">
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Período de</span>
                <input 
                  type="date" 
                  value={filters.start_date}
                  onChange={(e) => setFilters(f => ({ ...f, start_date: e.target.value, page: 1 }))}
                  className="h-10 px-4 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                />
             </div>
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Até</span>
                <input 
                  type="date" 
                  value={filters.end_date}
                  onChange={(e) => setFilters(f => ({ ...f, end_date: e.target.value, page: 1 }))}
                  className="h-10 px-4 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                />
             </div>
             <button 
               type="button"
               onClick={clearFilters}
               className="h-10 px-4 flex items-center gap-2 text-xs font-black text-slate-400 hover:text-red-500 transition-colors ml-auto"
             >
                <FilterX size={16} /> Limpar Filtros
             </button>
          </div>
        </form>
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
                <AlertCircle size={40} />
             </div>
             <h4 className="text-xl font-black text-slate-800">Falha na Auditoria</h4>
             <p className="text-slate-500 font-medium mb-8 max-w-sm">{error}</p>
             <button onClick={fetchLogs} className="h-12 px-8 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all">Sincronizar Novamente</button>
          </div>
        ) : (
          <>
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
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="px-8 py-6">
                        <Badge variant={getActionColor(log.acao) as any} className="px-4 py-1.5 uppercase font-black text-[10px] tracking-widest">{log.acao}</Badge>
                      </td>
                      <td className="px-8 py-6 max-w-md">
                         <div className="flex items-start gap-3">
                            <Info size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                            <span className="text-sm font-bold text-slate-700 leading-relaxed">{log.descricao || 'Sem descrição'}</span>
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
                               <div className="text-sm font-black text-slate-800 leading-tight">{log.usuario_nome || 'Sistema'}</div>
                               <div className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">{log.empresa_nome || 'Gestifique Master'}</div>
                            </div>
                         </div>
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex flex-col gap-1">
                            <span className="text-xs font-black text-slate-700 flex items-center gap-1.5"><Calendar size={14} className="text-slate-300" /> {new Date(log.created_at).toLocaleString('pt-BR')}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 w-fit px-2 py-0.5 rounded-lg border border-slate-100" title={log.user_agent || 'Não informado'}>IP: {log.ip || 'Local / Interno'}</span>
                         </div>
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-32 text-center">
                         <div className="flex flex-col items-center">
                            <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-3xl flex items-center justify-center mb-4">
                               <Search size={32} />
                            </div>
                            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Nenhum registro encontrado.</p>
                         </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {pagination && pagination.totalPages > 1 && (
              <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                <div className="text-sm text-slate-500">
                  Mostrando <span className="font-bold text-slate-900">{logs.length}</span> de <span className="font-bold text-slate-900">{pagination.total}</span> registros
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    disabled={filters.page === 1}
                    onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-40 transition-all hover:bg-slate-50"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  {[...Array(pagination.totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setFilters(f => ({ ...f, page: i + 1 }))}
                      className={cn(
                        "w-10 h-10 rounded-xl font-bold text-sm transition-all",
                        filters.page === i + 1 
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-100" 
                          : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button 
                    disabled={filters.page === pagination.totalPages}
                    onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-40 transition-all hover:bg-slate-50"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
