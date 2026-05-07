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

  const statusData = stats?.byStatus?.map((s) => ({
    name: s.status.replace('_', ' '),
    value: s.qtd
  })) || [];

  const priorityData = stats?.byPriority?.map((p) => ({
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950 tracking-tight">Dashboard</h2>
          <p className="text-sm text-slate-500">Visão geral do sistema e indicadores de performance.</p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" size="sm">PDF Report</Button>
           <Button size="sm" onClick={() => onNavigate?.('tickets')}>
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
              <CardHeader className="flex flex-row items-center justify-between">
                 <CardTitle>Chamados por Status</CardTitle>
                 <Badge variant="blue">Total: {counts.total}</Badge>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  {statusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statusData}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: 500}} dy={10} />
                        <YAxis hide />
                        <Tooltip 
                          cursor={{fill: '#f1f5f9'}} 
                          contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                        />
                        <Bar dataKey="value" radius={[4, 4, 4, 4]} barSize={32}>
                          {statusData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-400">Nenhum dado disponível.</div>
                  )}
                </div>
              </CardContent>
           </Card>

           <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50">
                <CardTitle>Chamados Recentes</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => onNavigate?.('tickets')}>
                  Ver Todos <ChevronRight size={14} className="ml-1" />
                </Button>
              </CardHeader>
              <div className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-4 animate-pulse flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-100"></div>
                      <div className="flex-1 space-y-2">
                        <div className="w-1/4 h-4 bg-slate-100 rounded"></div>
                        <div className="w-1/2 h-3 bg-slate-100 rounded"></div>
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
                      <div key={ticket.id} onClick={() => onNavigate?.('tickets')} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer group">
                        <div className="w-10 h-10 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                          <TicketIcon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-slate-900 truncate">{ticket.titulo}</span>
                            <Badge variant={statusMap[ticket.status || 'aberto']}>{ticket.status?.replace('_', ' ')}</Badge>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] font-medium text-slate-400">
                            <span className="text-blue-700 font-bold">#{ticket.id}</span>
                            <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(ticket.created_at).toLocaleDateString()}</span>
                            <span className="truncate flex items-center gap-1"><UserIcon size={12} /> {ticket.cliente_nome || 'Usuário'}</span>
                          </div>
                        </div>
                        <div className="hidden sm:block">
                           <Badge variant={ticket.prioridade === 'urgente' ? 'red' : 'slate'} className="font-semibold px-2">
                             {ticket.prioridade}
                           </Badge>
                        </div>
                        <ChevronRight className="text-slate-300 group-hover:text-slate-600 ml-2" size={16} />
                      </div>
                    );
                  })
                ) : (
                  <div className="p-12 text-center flex flex-col items-center">
                    <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-xl flex items-center justify-center mb-4 border border-slate-100">
                      <TicketIcon size={24} />
                    </div>
                    <h4 className="text-base font-semibold text-slate-900 mb-1">Tudo em dia!</h4>
                    <p className="text-xs text-slate-500 max-w-[200px] mb-6">Nenhum chamado pendente no momento.</p>
                    <Button size="sm" onClick={() => onNavigate?.('tickets')}>
                       <Plus size={14} className="mr-2" /> Novo Ticket
                    </Button>
                  </div>
                )}
              </div>
           </Card>
        </div>

        <div className="space-y-6">
           <Card>
              <CardHeader>
                 <CardTitle>Prioridades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56 w-full flex items-center justify-center">
                  {priorityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={priorityData}
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {priorityData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={PRIO_COLORS[entry.name] || '#94a3b8'} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-sm text-slate-400">Sem dados.</div>
                  )}
                </div>
                
                {priorityData.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-4">
                     {priorityData.map((p: any, i: number) => (
                       <div key={i} className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg">
                          <div className="flex items-center gap-1.5 mb-0.5">
                             <div className="w-2 h-2 rounded-full" style={{backgroundColor: PRIO_COLORS[p.name] || '#94a3b8'}}></div>
                             <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight">{p.name}</span>
                          </div>
                          <div className="text-lg font-bold text-slate-900 leading-tight">{p.value}</div>
                       </div>
                     ))}
                  </div>
                )}
              </CardContent>
           </Card>

           <Card>
              <CardHeader>
                 <CardTitle>Atividades</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-8 h-8 rounded-lg bg-slate-50"></div>
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-slate-100 rounded-full w-full"></div>
                        <div className="h-2 bg-slate-100 rounded-full w-2/3"></div>
                      </div>
                    </div>
                  ))
                ) : recentActivities && recentActivities.length > 0 ? (
                  recentActivities.map((act: Log) => (
                    <div key={act.id} className="flex gap-3 relative group">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors z-10">
                           <ActivityIcon size={14} />
                        </div>
                        <div className="absolute top-8 bottom-[-20px] left-4 w-px bg-slate-100 last:hidden"></div>
                      </div>
                      <div className="flex-1 min-w-0 pb-4">
                        <p className="text-xs font-semibold text-slate-800 leading-snug mb-0.5 line-clamp-1">{act.acao}</p>
                        {act.descricao && (
                          <p className="text-[11px] text-slate-500 truncate">{act.descricao}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-[10px] font-medium text-slate-400">
                          <span className="text-blue-600">{act.usuario_nome?.split(' ')[0] || 'Sistema'}</span>
                          <span>•</span>
                          <span>{new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-sm text-slate-400">Sem atividades recentes.</div>
                )}
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
};
