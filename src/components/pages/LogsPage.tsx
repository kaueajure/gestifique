import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Search, Calendar, Loader2, AlertCircle, ChevronLeft, ChevronRight, RefreshCw, FilterX, Building2 } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';
import { SystemLog } from '../../types';

type BadgeVariant = 'blue' | 'emerald' | 'amber' | 'red' | 'indigo' | 'slate' | 'orange';

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
      
      const response = await api.get<any>(`/logs?${queryParams.toString()}`);
      
      const items = Array.isArray(response.items) 
        ? response.items 
        : Array.isArray(response.data?.items) 
          ? response.data.items 
          : [];
          
      const paginationData = response.pagination || response.data?.pagination || null;
      
      setLogs(items);
      setPagination(paginationData);
    } catch (err) { 
      const message = err instanceof Error ? err.message : 'Erro ao carregar logs.';
      setError(message);
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

  const getActionColor = (acao?: string): BadgeVariant => {
    const action = acao || '';
    if (action.includes('CREATE')) return 'emerald';
    if (action.includes('UPDATE')) return 'blue';
    if (action.includes('DELETE')) return 'red';
    if (action.includes('LOGIN')) return 'indigo';
    if (action.includes('PASSWORD')) return 'orange';
    return 'slate';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Logs do Sistema</h2>
          <p className="text-sm text-slate-500 font-medium tracking-tight">Auditoria e histórico de ações realizadas no núcleo do sistema.</p>
        </div>
        <Button 
          variant="outline"
          size="sm"
          className="h-9"
          onClick={fetchLogs}
          disabled={loading}
        >
          <RefreshCw size={14} className={cn("mr-2", loading ? "animate-spin" : "")} /> Sincronizar
        </Button>
      </div>

      <Card className="p-3">
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="flex flex-col lg:flex-row gap-2">
            <div className="relative flex-1 group">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={14} />
               <input 
                 type="text" 
                 placeholder="Buscar por descrição, usuário ou empresa..." 
                 className="w-full h-8 bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-100 transition-all font-sans"
                 value={filters.search}
                 onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
               />
            </div>
            <div className="flex gap-2">
              <select 
                value={filters.action}
                onChange={(e) => setFilters(f => ({ ...f, action: e.target.value, page: 1 }))}
                className="h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer min-w-[120px]"
              >
                <option value="">Ações</option>
                <option value="LOGIN">Login</option>
                <option value="CREATE">Criação</option>
                <option value="UPDATE">Atualização</option>
                <option value="DELETE">Exclusão</option>
                <option value="PROFILE_UPDATE">Perfil</option>
                <option value="PASSWORD_CHANGE">Senha</option>
              </select>
              <Button type="submit" size="sm" className="h-8">Filtrar</Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100">
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Início</span>
                <input 
                  type="date" 
                  value={filters.start_date}
                  onChange={(e) => setFilters(f => ({ ...f, start_date: e.target.value, page: 1 }))}
                  className="h-7 px-2 bg-slate-50 border border-slate-200 rounded-md text-[10px] font-bold outline-none focus:ring-1 focus:ring-blue-400 transition-all text-slate-600"
                />
             </div>
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fim</span>
                <input 
                  type="date" 
                  value={filters.end_date}
                  onChange={(e) => setFilters(f => ({ ...f, end_date: e.target.value, page: 1 }))}
                  className="h-7 px-2 bg-slate-50 border border-slate-200 rounded-md text-[10px] font-bold outline-none focus:ring-1 focus:ring-blue-400 transition-all text-slate-600"
                />
             </div>
             <button 
               type="button"
               onClick={clearFilters}
               className="h-7 px-3 flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-red-600 transition-colors ml-auto uppercase tracking-widest"
             >
                <FilterX size={12} /> Limpar
             </button>
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-3">
             <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
             <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Sincronizando Auditoria...</p>
          </div>
        ) : error ? (
          <div className="p-20 text-center flex flex-col items-center">
             <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
             <h4 className="text-sm font-semibold text-slate-900 mb-1">Falha na Auditoria</h4>
             <p className="text-xs text-slate-500 mb-6 max-w-sm">{error}</p>
             <Button variant="outline" size="sm" onClick={fetchLogs}>Tentar Novamente</Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-2.5 text-[10px] font-bold text-slate-400 tracking-wider uppercase bg-slate-50/30">Ação</th>
                    <th className="px-5 py-2.5 text-[10px] font-bold text-slate-400 tracking-wider uppercase bg-slate-50/30">Descrição</th>
                    <th className="px-5 py-2.5 text-[10px] font-bold text-slate-400 tracking-wider uppercase bg-slate-50/30">Operador</th>
                    <th className="px-5 py-2.5 text-[10px] font-bold text-slate-400 tracking-wider uppercase bg-slate-50/30">Data / IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Array.isArray(logs) && logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-5 py-3">
                        <Badge variant={getActionColor(log.acao)} className="px-1.5 py-0 font-bold text-[9px] tracking-tight uppercase">{log.acao || 'SYSTEM'}</Badge>
                      </td>
                      <td className="px-5 py-3 max-w-xs">
                         <div className="flex items-start gap-2">
                            <span className="text-xs font-semibold text-slate-600 leading-normal line-clamp-2">{log.descricao || 'Registrado'}</span>
                         </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                           <div className={cn(
                             "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] uppercase shadow-sm border",
                             log.usuario_nome ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-400 border-slate-100"
                           )}>
                              {(log.usuario_nome || 'S').charAt(0)}
                           </div>
                           <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 leading-tight truncate">{log.usuario_nome || 'Sistema'}</div>
                              <div className="text-[9px] font-bold text-blue-600 leading-tight flex items-center gap-1 mt-0.5 uppercase tracking-tighter">
                                 <Building2 size={8} /> {log.empresa_nome || 'Master'}
                              </div>
                           </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                         <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-bold text-slate-700 flex items-center gap-1 whitespace-nowrap">
                               <Calendar size={10} className="text-slate-400" /> {log.created_at ? new Date(log.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Data indisponível'}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 truncate opacity-60">
                               {log.ip || 'Local'}
                            </span>
                         </div>
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-20 text-center">
                         <div className="flex flex-col items-center">
                            <div className="w-10 h-10 bg-slate-50 text-slate-200 rounded-xl flex items-center justify-center mb-3">
                               <Search size={20} />
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nenhum log encontrado.</p>
                         </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {pagination && pagination.totalPages > 1 && (
              <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-500 font-medium font-mono">
                  {logs.length} / {pagination.total} registros
                </div>
                <div className="flex items-center gap-1.5">
                  <Button 
                    variant="outline"
                    size="sm"
                    disabled={filters.page === 1}
                    onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                    className="h-7 w-7 p-0 flex items-center justify-center"
                  >
                    <ChevronLeft size={14} />
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase px-2">Página {filters.page} de {pagination.totalPages}</span>
                  </div>

                  <Button 
                    variant="outline"
                    size="sm"
                    disabled={filters.page === pagination.totalPages}
                    onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                    className="h-7 w-7 p-0 flex items-center justify-center"
                  >
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
};
