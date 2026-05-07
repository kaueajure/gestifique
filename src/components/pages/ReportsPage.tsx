import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  Download, Filter, RefreshCw, Calendar, TrendingUp, AlertCircle, 
  Clock, CheckCircle2, Inbox, Activity, ChevronRight, FileText
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { api } from '../../lib/api';
import { User } from '../../types';

interface SummaryData {
  totals: {
    total_tickets: number;
    open_tickets: number;
    in_progress_tickets: number;
    resolved_tickets: number;
    closed_tickets: number;
    urgent_tickets: number;
    average_resolution_hours: number;
  };
  by_status: { name: string; value: number }[];
  by_priority: { name: string; value: number }[];
  by_category: { name: string; value: number }[];
  by_responsible: { name: string; value: number }[];
  by_day: { date: string; created: number; resolved: number }[];
}

type ReportsApiResponse = 
  | SummaryData 
  | { success?: boolean; data?: SummaryData; message?: string };

type CompanyOption = { id: number; nome: string };

interface ReportsPageProps {
  currentUser: User;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6'];

export function ReportsPage({ currentUser }: ReportsPageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SummaryData | null>(null);
  const [filters, setFilters] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    empresa_id: '',
    status: '',
    prioridade: ''
  });
  const [companies, setCompanies] = useState<CompanyOption[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, String(value));
      });

      const response = await api.get<ReportsApiResponse>(`/reports/summary?${queryParams.toString()}`);
      
      // Defensively extract data
      let reportData: SummaryData | null = null;
      if (response) {
        if ('totals' in response) {
          reportData = response;
        } else if ('data' in response && response.data) {
          reportData = response.data;
        }
      }
      
      if (reportData && reportData.totals) {
        setData(reportData);
      } else {
        setError('Resposta do servidor inválida ou vazia.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar dados do relatório.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
    
    if (currentUser.desenvolvedor) {
      api.get<CompanyOption[] | { data: CompanyOption[] }>('/companies').then(res => {
        const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        setCompanies(list);
      }).catch(() => {});
    }
  }, [fetchData, currentUser.desenvolvedor]);

  const escapeCsv = (val: string | number | null | undefined) => {
    if (val === null || val === undefined) return '';
    let str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      str = '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  const handleExportCSV = () => {
    if (!data) return;

    let csvContent = "\uFEFF"; // Add BOM for Excel UTF-8 support
    
    // 1. Totals
    csvContent += "METRICAS TOTAIS\n";
    csvContent += "Métrica,Valor\n";
    csvContent += `Total de Chamados,${data.totals.total_tickets}\n`;
    csvContent += `Em Aberto,${data.totals.open_tickets}\n`;
    csvContent += `Em Andamento,${data.totals.in_progress_tickets}\n`;
    csvContent += `Resolvidos,${data.totals.resolved_tickets}\n`;
    csvContent += `Fechados,${data.totals.closed_tickets}\n`;
    csvContent += `Urgentes,${data.totals.urgent_tickets}\n`;
    csvContent += `Tempo Médio Resolução (h),${data.totals.average_resolution_hours}\n\n`;

    // 2. By Status
    csvContent += "POR STATUS\n";
    csvContent += "Status,Quantidade\n";
    data.by_status.forEach(item => {
      csvContent += `${escapeCsv(item.name)},${item.value}\n`;
    });
    csvContent += "\n";

    // 3. By Priority
    csvContent += "POR PRIORIDADE\n";
    csvContent += "Prioridade,Quantidade\n";
    data.by_priority.forEach(item => {
      csvContent += `${escapeCsv(item.name)},${item.value}\n`;
    });
    csvContent += "\n";

    // 4. By Responsible
    csvContent += "POR RESPONSAVEL\n";
    csvContent += "Responsável,Quantidade\n";
    data.by_responsible.forEach(item => {
      csvContent += `${escapeCsv(item.name)},${item.value}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `gestifique-relatorio-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium">Processando métricas...</p>
      </div>
    );
  }

  const hasData = data && data.totals.total_tickets > 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Relatórios</h1>
          <p className="text-slate-500 font-medium">Análise gerencial dos atendimentos da plataforma.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleExportCSV} disabled={!data || data.totals.total_tickets === 0}>
            <Download size={18} className="mr-2" /> Exportar CSV
          </Button>
          <Button onClick={fetchData}>
            <RefreshCw size={18} className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6 bg-slate-50/50 border-slate-200">
        <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <Filter size={14} /> Filtros de Relatório
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Data Inicial</label>
            <input 
              type="date"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-4 focus:ring-blue-100 outline-none"
              value={filters.start_date}
              onChange={(e) => setFilters(f => ({ ...f, start_date: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Data Final</label>
            <input 
              type="date"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-4 focus:ring-blue-100 outline-none"
              value={filters.end_date}
              onChange={(e) => setFilters(f => ({ ...f, end_date: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Prioridade</label>
            <select 
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-4 focus:ring-blue-100 outline-none"
              value={filters.prioridade}
              onChange={(e) => setFilters(f => ({ ...f, prioridade: e.target.value }))}
            >
              <option value="">Todas</option>
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Status</label>
            <select 
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-4 focus:ring-blue-100 outline-none"
              value={filters.status}
              onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
            >
              <option value="">Todos</option>
              <option value="aberto">Aberto</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="aguardando_cliente">Aguardando Cliente</option>
              <option value="resolvido">Resolvido</option>
              <option value="fechado">Fechado</option>
            </select>
          </div>
          {currentUser.desenvolvedor && (
             <div className="space-y-1.5">
               <label className="text-xs font-semibold text-slate-700">Empresa</label>
               <select 
                 className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-4 focus:ring-blue-100 outline-none"
                 value={filters.empresa_id}
                 onChange={(e) => setFilters(f => ({ ...f, empresa_id: e.target.value }))}
               >
                 <option value="">Todas</option>
                 {companies.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
               </select>
             </div>
          )}
        </div>
      </Card>

      {error && (
        <Card className="p-6 bg-red-50 border-red-100 text-red-600 flex items-center gap-3">
          <AlertCircle />
          <p className="font-medium text-sm">{error}</p>
        </Card>
      )}

      {data && (
        <>
          {/* Metrics Boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard title="Total Enviado" value={data.totals.total_tickets} icon={<Inbox />} color="blue" />
            <KPICard title="Em Aberto" value={data.totals.open_tickets} icon={<Activity />} color="amber" />
            <KPICard title="Eficiência (h)" value={`${data.totals.average_resolution_hours}h`} icon={<Clock />} color="indigo" />
            <KPICard title="Altíssima Prioridade" value={data.totals.urgent_tickets} icon={<TrendingUp />} color="red" />
          </div>

          {!hasData && !loading ? (
            <Card className="p-12 text-center flex flex-col items-center justify-center">
              <FileText size={48} className="text-slate-200 mb-4" />
              <h3 className="text-lg font-bold text-slate-900">Nenhum atendimento encontrado</h3>
              <p className="text-slate-500 max-w-sm mx-auto">Não existem registros para os filtros selecionados no período de análise.</p>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Status Chart */}
                <Card className="p-6 col-span-1 lg:col-span-1">
                  <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                    Volume por Status
                  </h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.by_status}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {data.by_status.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Priority Chart */}
                <Card className="p-6 col-span-1 lg:col-span-1">
                  <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
                    Distribuição por Prioridade
                  </h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.by_priority}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="name" fontSize={12} axisLine={false} tickLine={false} />
                        <YAxis fontSize={12} axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Categories */}
                <Card className="p-6 col-span-1 lg:col-span-1">
                  <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                    Atendimentos por Categoria
                  </h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.by_category}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({name, percent}) => `${(percent * 100).toFixed(0)}%`}
                        >
                          {data.by_category.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Resolution Over Time */}
                <Card className="p-6">
                  <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                    Evolução Diária (Criados x Resolvidos)
                  </h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.by_day}>
                        <defs>
                          <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis 
                          dataKey="date" 
                          fontSize={10} 
                          axisLine={false} 
                          tickLine={false} 
                          tickFormatter={(val) => val.split('-').slice(1).reverse().join('/')}
                        />
                        <YAxis fontSize={12} axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Area type="monotone" dataKey="created" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCreated)" />
                        <Area type="monotone" dataKey="resolved" stroke="#10b981" fillOpacity={0} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Responsibility Ranking */}
                <Card className="p-6">
                  <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <div className="w-1 h-4 bg-slate-900 rounded-full"></div>
                    Ranking de Responsabilidade
                  </h3>
                  <div className="space-y-4">
                    {data.by_responsible.length > 0 ? (
                      [...data.by_responsible].sort((a, b) => b.value - a.value).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                              {idx + 1}
                            </div>
                            <span className="text-sm font-semibold text-slate-700">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                              <div 
                                className="h-full bg-blue-600 rounded-full" 
                                style={{ width: `${(item.value / Math.max(1, data.totals.total_tickets)) * 100}%` }}
                              ></div>
                            </div>
                            <Badge variant="blue" className="font-mono">{item.value}</Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center">
                        <p className="text-slate-400 text-sm font-medium">Nenhum responsável vinculado aos chamados.</p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function KPICard({ title, value, icon, color }: { title: string, value: string | number, icon: React.ReactNode, color: string }) {
  const colorMap: Record<string, string> = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100",
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
    red: "text-red-600 bg-red-50 border-red-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
  };

  return (
    <Card className="p-6 relative overflow-hidden group hover:border-blue-400 transition-all border-slate-200">
      <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center ${colorMap[color]}`}>
        {React.cloneElement(icon as React.ReactElement, { size: 20 })}
      </div>
      <div className="space-y-1">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
      </div>
      <div className="absolute top-4 right-4 text-slate-200 group-hover:text-blue-50 transition-colors">
        <TrendingUp size={48} />
      </div>
    </Card>
  );
}
