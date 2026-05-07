import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { DashboardData } from '../../types';
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
      } catch (err: any) {
        setError(err.message || 'Ocorreu um erro ao carregar o dashboard.');
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
    { label: 'Total de Chamados', value: counts.total || 0, icon: <TicketIcon size={20} />, color: 'blue' as const },
    { label: 'Em Aberto', value: counts.aberto || 0, icon: <AlertCircle size={20} />, color: 'amber' as const },
    { label: 'Tempo Médio', value: counts.tempo_medio_resolucao || '0h', icon: <Clock size={20} />, color: 'indigo' as const },
    { label: 'Resolvidos', value: counts.resolvido || 0, icon: <CheckCircle2 size={20} />, color: 'emerald' as const },
  ];

  const secondaryMetrics = [
    { label: 'Aguardando Cliente', value: counts.aguardando_cliente || 0, icon: <PauseCircle size={16} />, color: 'slate' as const },
    { label: 'Status Urgente', value: counts.urgente || 0, icon: <AlertTriangle size={16} />, color: 'red' as const },
  ];

  const statusData = stats?.byStatus?.map((s) => ({
    name: s.status.replace('_', ' '),
    value: s.qtd
  })) || [];

  const priorityData = stats?.byPriority?.map((p) => ({
    name: p.prioridade,
    value: p.qtd
  })) || [];

  const COLORS = ['#3b82f6', '#6366f1', '#f59e0b', '#10b981', '#64748b'];
  const PRIO_COLORS = {
    urgente: '#ef4444',
    alta: '#f97316',
    media: '#f59e0b',
    baixa: '#3b82f6'
  };

  if (error) {
    return (
      <div className="bg-red-50 p-12 rounded-[40px] border border-red-100 flex flex-col items-center justify-center text-center">
         <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mb-6">
            <AlertCircle size={40} />
         </div>
         <h4 className="text-xl font-black text-red-900 mb-2">Ops! Algo deu errado</h4>
         <p className="text-red-600 font-medium max-w-sm mb-8">{error}</p>
         <button 
           onClick={() => window.location.reload()}
           className="h-12 px-8 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-100 active:scale-95"
         >
           Tentar Novamente
         </button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Painel de Controle</h2>
          <p className="text-slate-500 font-medium text-lg">Visão estratégica da sua operação de suporte.</p>
        </div>
        <div className="flex items-center gap-3 p-1.5 bg-slate-100 rounded-2xl">
           <button className="h-10 px-6 rounded-xl bg-white shadow-sm text-slate-900 font-black text-xs transition-all">Geral</button>
           <button className="h-10 px-6 rounded-xl text-slate-400 hover:text-slate-600 font-black text-xs transition-all">Este Mês</button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

      <div className="grid sm:grid-cols-2 gap-6">
        {secondaryMetrics.map((card, i) => (
          <MetricCard 
            key={i}
            label={card.label} 
            value={card.value} 
            icon={card.icon} 
            color={card.color as any} 
            loading={loading} 
          />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xl font-black text-slate-900">Distribuição por Status</h3>
                 <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <span className="w-3 h-3 bg-blue-500 rounded-full"></span> Ativos
                 </div>
              </div>
              <div className="h-[300px] w-full flex items-center justify-center">
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusData}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dy={10} />
                      <YAxis hide />
                      <Tooltip 
                        cursor={{fill: '#f8fafc'}} 
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                      />
                      <Bar dataKey="value" radius={[10, 10, 10, 10]} barSize={40}>
                        {statusData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-slate-400 font-medium">Nenhum dado de status disponível.</p>
                )}
              </div>
           </div>

           <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-900">Chamados Recentes</h3>
                <button 
                  onClick={() => onNavigate?.('tickets')}
                  className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline"
                >
                  Ver Todos
                </button>
              </div>
              <div className="divide-y divide-slate-50">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-8 animate-pulse flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100"></div>
                      <div className="flex-1 space-y-3">
                        <div className="w-1/3 h-5 bg-slate-100 rounded-lg"></div>
                        <div className="w-1/2 h-3 bg-slate-100 rounded-lg"></div>
                      </div>
                    </div>
                  ))
                ) : recentTickets && recentTickets.length > 0 ? (
                  recentTickets.map((ticket: any) => {
                    const tStatus = ticket.status || 'aberto';
                    const tPrio = ticket.prioridade || 'media';
                    const tClient = ticket.cliente_nome || 'Usuário';

                    return (
                      <div key={ticket.id} onClick={() => onNavigate?.('tickets')} className="p-8 flex items-center gap-6 hover:bg-slate-50/50 transition-colors cursor-pointer group">
                        <div className={cn(
                          "w-14 h-14 rounded-[24px] flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm",
                          tStatus === 'resolvido' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                        )}>
                          <TicketIcon size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1.5">
                            <span className="text-lg font-black text-slate-900 truncate">{ticket.titulo}</span>
                            <Badge variant={tStatus === 'resolvido' ? 'emerald' : 'blue'}>{tStatus.replace('_', ' ')}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                            <span className="flex items-center gap-1.5 text-blue-600">#{ticket.id}</span>
                            <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(ticket.created_at).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1.5"><UserIcon size={14} /> {tClient}</span>
                          </div>
                        </div>
                        <div className="hidden sm:block">
                           <div className={cn(
                             "text-[10px] font-black uppercase px-4 py-1.5 rounded-xl border-2",
                             tPrio === 'urgente' ? "text-red-600 bg-red-50 border-red-100" : "text-slate-500 bg-slate-100 border-slate-200"
                           )}>
                             {tPrio}
                           </div>
                        </div>
                        <ChevronRight className="text-slate-200 group-hover:text-blue-500 transition-colors" size={24} />
                      </div>
                    );
                  })
                ) : (
                  <div className="p-24 text-center flex flex-col items-center">
                    <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-[30px] flex items-center justify-center mb-6">
                      <TicketIcon size={48} />
                    </div>
                    <h4 className="text-2xl font-black text-slate-900 mb-2">Tudo em dia!</h4>
                    <p className="text-slate-500 font-medium max-w-xs mx-auto mb-10">Nenhum chamado pendente no momento. Que tal começar um novo trabalho?</p>
                    <button 
                      onClick={() => onNavigate?.('tickets')}
                      className="h-14 px-10 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 active:scale-95 flex items-center gap-3"
                    >
                      <Plus size={24} /> Novo Chamado
                    </button>
                  </div>
                )}
              </div>
           </div>
        </div>

        <div className="space-y-8">
           <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm h-fit">
              <h3 className="text-xl font-black text-slate-900 mb-8">Prioridades</h3>
              <div className="h-[250px] w-full flex flex-col items-center justify-center">
                {priorityData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={priorityData}
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {priorityData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={(PRIO_COLORS as any)[entry.name] || '#cbd5e1'} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </>
                ) : (
                  <p className="text-slate-400 font-medium my-auto text-center">Nenhum dado de prioridade disponível.</p>
                )}
              </div>
              
              {priorityData.length > 0 && (
                <div className="grid grid-cols-2 gap-4 mt-6">
                   {priorityData.map((p: any, i: number) => (
                     <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-2 mb-1">
                           <div className="w-2 h-2 rounded-full" style={{backgroundColor: (PRIO_COLORS as any)[p.name]}}></div>
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.name}</span>
                        </div>
                        <div className="text-xl font-black text-slate-900">{p.value}</div>
                     </div>
                   ))}
                </div>
              )}
           </div>

           <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm h-fit">
              <h3 className="text-xl font-black text-slate-900 mb-8">Atividades Recentes</h3>
              <div className="space-y-6">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-4 animate-pulse">
                      <div className="w-10 h-10 rounded-xl bg-slate-100"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-slate-100 rounded-full w-full"></div>
                        <div className="h-2 bg-slate-100 rounded-full w-2/3"></div>
                      </div>
                    </div>
                  ))
                ) : recentActivities && recentActivities.length > 0 ? (
                  recentActivities.map((act: any) => (
                    <div key={act.id} className="flex gap-4 group">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                           <ActivityIcon size={18} />
                        </div>
                        <div className="absolute top-10 bottom-[-24px] left-1/2 -translate-x-1/2 w-px bg-slate-100 last:hidden"></div>
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm font-bold text-slate-700 leading-tight mb-0.5">{act.acao}</p>
                        {act.descricao && (
                          <p className="text-xs text-slate-500 mb-1.5">{act.descricao}</p>
                        )}
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <span className="text-blue-600">{act.usuario_nome || 'Sistema'}</span>
                          <span>•</span>
                          <span>{new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-10 text-slate-400 font-medium">Nenhuma atividade registrada.</p>
                )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
