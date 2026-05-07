import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { DashboardData, Ticket, Log } from '../../types';
import { MetricCard } from '../ui/MetricCard';
import { 
  Ticket as TicketIcon, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  ChevronRight,
  User as UserIcon,
  Plus,
  Activity as ActivityIcon,
  PauseCircle,
  AlertTriangle
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { cn } from '../../lib/utils';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell,
  PieChart,
  Pie
} from 'recharts';

type ChartDataItem = {
  name: string;
  value: number;
};

interface DashboardPageProps {
  onNavigate?: (tab: 'dashboard' | 'tickets' | 'users' | 'companies' | 'logs' | 'profile' | 'settings') => void;
}

export const DashboardPage = ({ onNavigate }: DashboardPageProps) => {
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.get<DashboardData>('/dashboard');
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ocorreu um erro ao carregar o dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const counts = stats?.counts || {
    total: 0,
    aberto: 0,
    em_andamento: 0,
    aguardando_cliente: 0,
    resolvido: 0,
    fechado: 0,
    urgente: 0,
    tempo_medio_resolucao: '0h'
  };
  
  const recentTickets = stats?.recentTickets || [];
  const recentActivities = stats?.recentActivities || [];

  const mainMetrics = [
    { label: 'Total de Chamados', value: counts.total || 0, icon: <TicketIcon size={18} />, color: 'blue' as const },
    { label: 'Em Aberto', value: counts.aberto || 0, icon: <AlertCircle size={18} />, color: 'amber' as const },
    { label: 'Tempo Médio', value: counts.tempo_medio_resolucao || '0h', icon: <Clock size={18} />, color: 'indigo' as const },
    { label: 'Resolvidos', value: counts.resolvido || 0, icon: <CheckCircle2 size={18} />, color: 'emerald' as const },
  ];

  const statusData: ChartDataItem[] = stats?.byStatus?.map((s) => ({
    name: s.status.replace('_', ' '),
    value: s.qtd
  })) || [];

  const priorityData: ChartDataItem[] = stats?.byPriority?.map((p) => ({
    name: p.prioridade,
    value: p.qtd
  })) || [];

  const COLORS = ['#1d4ed8', '#4f46e5', '#d97706', '#059669', '#475569'];
  const PRIO_COLORS: Record<string, string> = {
    urgente: '#dc2626',
    alta: '#ea580c',
    media: '#d97706',
    baixa: '#2563eb'
  };

  if (error) {
    return (
      <Card className="border-red-100 bg-red-50/30">
        <CardContent className="p-12 flex flex-col items-center text-center">
           <div className="w-16 h-16 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-4">
              <AlertCircle size={32} />
           </div>
           <h3 className="text-xl font-semibold text-slate-900 mb-2">Ops! Algo deu errado</h3>
           <p className="text-slate-500 max-w-sm mb-6">{error}</p>
           <Button variant="danger" onClick={() => window.location.reload()}>
             Tentar Novamente
           </Button>
        </CardContent>
      </Card>
    );
  }

  return (    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Dashboard</h2>
          <p className="text-sm text-slate-500 font-medium">Visão geral do sistema e indicadores de performance.</p>
        </div>
        <div className="flex items-center gap-2">
           <Button size="sm" className="h-9" onClick={() => onNavigate?.('tickets')}>
              <Plus size={16} className="mr-2" /> Novo Ticket
           </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mainMetrics.map((card, i) => (
          <MetricCard 
            key={i}
            label={card.label} 
            value={card.value} 
            icon={card.icon} 
            color={card.color} 
            loading={loading} 
          />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           <Card>
              <CardHeader className="flex flex-row items-center justify-between py-4">
                 <CardTitle className="text-sm font-bold">Chamados por Status</CardTitle>
                 <Badge variant="blue" className="text-[10px] py-0 px-2">Total: {counts.total}</Badge>
              </CardHeader>
              <CardContent className="pb-6">
                <div className="h-48 w-full">
                  {statusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statusData}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 500}} dy={10} />
                        <YAxis hide />
                        <Tooltip 
                          cursor={{fill: '#f8fafc'}} 
                          contentStyle={{borderRadius: '8px', border: '1px solid #f1f5f9', boxShadow: 'none', fontSize: '12px'}}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={24}>
                          {statusData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">Nenhum dado disponível.</div>
                  )}
                </div>
              </CardContent>
           </Card>

           <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/30 py-3">
                <CardTitle className="text-sm font-bold">Chamados Recentes</CardTitle>
                <Button variant="ghost" size="sm" className="h-7 text-[11px] font-bold" onClick={() => onNavigate?.('tickets')}>
                  Ver Todos <ChevronRight size={12} className="ml-1" />
                </Button>
              </CardHeader>
              <div className="divide-y divide-slate-50">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-4 animate-pulse flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100"></div>
                      <div className="flex-1 space-y-2">
                        <div className="w-1/4 h-3 bg-slate-100 rounded"></div>
                        <div className="w-1/2 h-2 bg-slate-100 rounded"></div>
                      </div>
                    </div>
                  ))
                ) : recentTickets && recentTickets.length > 0 ? (
                  recentTickets.map((ticket: Ticket) => {
                    const statusMap: Record<string, 'blue' | 'emerald' | 'amber' | 'indigo' | 'slate'> = {
                      aberto: 'blue',
                      em_andamento: 'indigo',
                      aguardando_cliente: 'amber',
                      resolvido: 'emerald',
                      fechado: 'slate'
                    };
                    return (
                      <div key={ticket.id} onClick={() => onNavigate?.('tickets')} className="p-3 px-4 flex items-center gap-3 hover:bg-slate-50 transition-colors cursor-pointer group">
                        <div className="w-8 h-8 rounded-lg border border-slate-100 bg-white flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors shadow-sm">
                          <TicketIcon size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-slate-800 truncate group-hover:text-slate-950">{ticket.titulo}</span>
                            <Badge variant={statusMap[ticket.status || 'aberto']} className="text-[9px] py-0 px-1.5">{ticket.status?.replace('_', ' ')}</Badge>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] font-medium text-slate-400">
                            <span className="text-blue-600 font-bold">#{ticket.id}</span>
                            <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(ticket.created_at).toLocaleDateString()}</span>
                            <span className="truncate flex items-center gap-1"><UserIcon size={10} /> {ticket.cliente_nome || 'Usuário'}</span>
                          </div>
                        </div>
                        <div className="hidden sm:block">
                           <Badge variant={ticket.prioridade === 'urgente' ? 'red' : 'slate'} className="text-[9px] font-bold px-1.5 py-0 uppercase">
                             {ticket.prioridade}
                           </Badge>
                        </div>
                        <ChevronRight className="text-slate-300 group-hover:text-slate-500 ml-1" size={14} />
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center flex flex-col items-center">
                    <div className="w-10 h-10 bg-slate-50 text-slate-300 rounded-lg flex items-center justify-center mb-3 border border-slate-100">
                      <TicketIcon size={20} />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900">Tudo em dia!</h4>
                    <p className="text-xs text-slate-500 max-w-[180px] mb-4">Nenhum chamado pendente.</p>
                    <Button size="sm" className="h-8 text-[11px]" onClick={() => onNavigate?.('tickets')}>
                       <Plus size={14} className="mr-1" /> Novo Ticket
                    </Button>
                  </div>
                )}
              </div>
           </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
           <Card>
              <CardHeader className="py-4">
                 <CardTitle className="text-sm font-bold">Prioridades</CardTitle>
              </CardHeader>
              <CardContent className="pb-6">
                <div className="h-44 w-full flex items-center justify-center">
                  {priorityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={priorityData}
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {priorityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PRIO_COLORS[entry.name] || '#94a3b8'} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{borderRadius: '8px', border: '1px solid #f1f5f9', boxShadow: 'none', fontSize: '11px'}}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-xs text-slate-400">Sem dados.</div>
                  )}
                </div>
                
                {priorityData.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                     {priorityData.map((p: ChartDataItem, i: number) => (
                       <div key={i} className="bg-slate-50 border border-slate-200/50 p-2 rounded-lg">
                          <div className="flex items-center gap-1.5 mb-0.5">
                             <div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: PRIO_COLORS[p.name] || '#94a3b8'}}></div>
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{p.name}</span>
                          </div>
                          <div className="text-base font-bold text-slate-900 leading-tight">{p.value}</div>
                       </div>
                     ))}
                  </div>
                )}
              </CardContent>
           </Card>

           <Card>
              <CardHeader className="py-4">
                 <CardTitle className="text-sm font-bold">Atividades</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pb-6">
                {recentActivities && recentActivities.length > 0 ? (
                  recentActivities.map((act: Log) => (
                    <div key={act.id} className="flex gap-2.5 relative group">
                      <div className="flex flex-col items-center">
                        <div className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors z-10 shadow-sm">
                           <ActivityIcon size={12} />
                        </div>
                        <div className="absolute top-6 bottom-[-16px] left-3 w-px bg-slate-100 last:hidden"></div>
                      </div>
                      <div className="flex-1 min-w-0 pb-3">
                        <p className="text-[11px] font-bold text-slate-800 leading-snug mb-0.5 line-clamp-1">{act.acao}</p>
                        <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400">
                          <span className="text-blue-600">{act.usuario_nome?.split(' ')[0] || 'Sistema'}</span>
                          <span>•</span>
                          <span>{new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-xs text-slate-400 font-medium">Sem atividades recentes.</div>
                )}
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
};
