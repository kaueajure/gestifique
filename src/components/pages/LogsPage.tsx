import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Search, Calendar, Info, Loader2, AlertCircle, ChevronLeft, ChevronRight, RefreshCw, FilterX, Building2 } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950 tracking-tight">Audit Log</h2>
          <p className="text-sm text-slate-500">Transparência total e conformidade em cada ação realizada no núcleo do sistema.</p>
        </div>
        <Button 
          variant="outline"
          onClick={fetchLogs}
          disabled={loading}
        >
          <RefreshCw size={16} className={cn("mr-2", loading ? "animate-spin" : "")} /> Atualizar
        </Button>
      </div>

      <Card className="p-4">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1 group">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
               <input 
                 type="text" 
                 placeholder="Buscar por descrição, ação, usuário ou empresa..." 
                 className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                 value={filters.search}
                 onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
               />
            </div>
            <div className="flex gap-2">
              <select 
                value={filters.action}
                onChange={(e) => setFilters(f => ({ ...f, action: e.target.value, page: 1 }))}
                className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer min-w-[140px]"
              >
                <option value="">Todas as Ações</option>
                <option value="LOGIN">Login</option>
                <option value="CREATE">Criação</option>
                <option value="UPDATE">Atualização</option>
                <option value="DELETE">Exclusão</option>
                <option value="PROFILE_UPDATE">Perfil</option>
                <option value="PASSWORD_CHANGE">Senha</option>
              </select>
              <Button type="submit" size="sm">Buscar</Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-100">
             <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">De</span>
                <input 
                  type="date" 
                  value={filters.start_date}
                  onChange={(e) => setFilters(f => ({ ...f, start_date: e.target.value, page: 1 }))}
                  className="h-8 px-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium outline-none focus:ring-1 focus:ring-blue-400 transition-all"
                />
             </div>
             <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Até</span>
                <input 
                  type="date" 
                  value={filters.end_date}
                  onChange={(e) => setFilters(f => ({ ...f, end_date: e.target.value, page: 1 }))}
                  className="h-8 px-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium outline-none focus:ring-1 focus:ring-blue-400 transition-all"
                />
             </div>
             <button 
               type="button"
               onClick={clearFilters}
               className="h-8 px-3 flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors ml-auto translate-y-0.5"
             >
                <FilterX size={14} /> Limpar Filtros
             </button>
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-3">
             <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
             <p className="text-sm text-slate-500 font-medium tracking-tight text-center">Acessando registros de log...</p>
          </div>
        ) : error ? (
          <div className="p-20 text-center flex flex-col items-center">
             <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
             <h4 className="text-base font-semibold text-slate-900 mb-1">Falha na Auditoria</h4>
             <p className="text-sm text-slate-500 mb-6 max-w-sm">{error}</p>
             <Button variant="outline" size="sm" onClick={fetchLogs}>Sincronizar Novamente</Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 text-[11px] font-semibold text-slate-500 tracking-wider uppercase">Ação</th>
                    <th className="px-6 py-3 text-[11px] font-semibold text-slate-500 tracking-wider uppercase">Evento</th>
                    <th className="px-6 py-3 text-[11px] font-semibold text-slate-500 tracking-wider uppercase">Operador</th>
                    <th className="px-6 py-3 text-[11px] font-semibold text-slate-500 tracking-wider uppercase">Data / IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <Badge variant={getActionColor(log.acao) as any} className="px-2 py-0.5 font-bold text-[10px] tracking-tight">{log.acao}</Badge>
                      </td>
                      <td className="px-6 py-4 max-w-md">
                         <div className="flex items-start gap-2.5">
                            <Info size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                            <span className="text-sm font-medium text-slate-600 leading-normal">{log.descricao || 'Sem descrição'}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs uppercase shadow-sm",
                              log.usuario_nome ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"
                            )}>
                               {log.usuario_nome?.charAt(0) || 'S'}
                            </div>
                            <div>
                               <div className="text-sm font-semibold text-slate-900 leading-tight">{log.usuario_nome || 'Sistema'}</div>
                               <div className="text-[10px] font-medium text-blue-600 leading-tight flex items-center gap-1">
                                  <Building2 size={10} /> {log.empresa_nome || 'Gestifique Master'}
                               </div>
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 whitespace-nowrap">
                               <Calendar size={12} className="text-slate-400" /> {new Date(log.created_at).toLocaleString('pt-BR')}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400 truncate max-w-[120px]" title={log.ip || 'Local'}>
                               IP: {log.ip || '127.0.0.1'}
                            </span>
                         </div>
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center">
                         <div className="flex flex-col items-center">
                            <div className="w-12 h-12 bg-slate-50 text-slate-200 rounded-xl flex items-center justify-center mb-4">
                               <Search size={24} />
                            </div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nenhum registro encontrado.</p>
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
                <div className="text-xs text-slate-500 font-medium">
                  Mostrando <span className="font-semibold text-slate-900">{logs.length}</span> de <span className="font-semibold text-slate-900">{pagination.total}</span> registros
                </div>
                <div className="flex items-center gap-1.5">
                  <Button 
                    variant="outline"
                    size="sm"
                    disabled={filters.page === 1}
                    onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                    className="h-8 w-8 p-0 flex items-center justify-center"
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {[...Array(pagination.totalPages)].map((_, i) => {
                      const isPageVisible = 
                        pagination.totalPages <= 5 || 
                        Math.abs(filters.page - (i + 1)) <= 1 || 
                        i === 0 || 
                        i === pagination.totalPages - 1;
                      
                      if (!isPageVisible) {
                        if (i > 0 && Math.abs(filters.page - i) > 1 && i < pagination.totalPages - 2) {
                           // This is handled by simple logic usually, but let's just show pages for now to be safe
                        }
                        return null;
                      }

                      return (
                        <Button
                          key={i + 1}
                          variant={filters.page === i + 1 ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => setFilters(f => ({ ...f, page: i + 1 }))}
                          className="h-8 w-8 p-0 text-xs font-bold"
                        >
                          {i + 1}
                        </Button>
                      );
                    })}
                  </div>

                  <Button 
                    variant="outline"
                    size="sm"
                    disabled={filters.page === pagination.totalPages}
                    onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                    className="h-8 w-8 p-0 flex items-center justify-center"
                  >
                    <ChevronRight size={16} />
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
