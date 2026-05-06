import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { DashboardStats, Ticket } from '../../types';
import { MetricCard } from '../ui/MetricCard';
import { 
  Ticket as TicketIcon, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  MessageSquare,
  Calendar,
  ChevronRight,
  User as UserIcon,
  Plus
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { motion } from 'motion/react';
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

export const DashboardPage = () => {
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.get<any>('/dashboard/stats');
        setStats(data);
      } catch (err: any) {
        setError(err.message || 'Ocorreu um erro ao carregar o dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const counts = stats?.counts || {};
  const recentTickets = stats?.recentTickets || [];

  const metricCards = [
    { label: 'Total de Chamados', value: counts.total || 0, icon: <TicketIcon size={20} />, color: 'blue' as const },
    { label: 'Em Aberto', value: counts.aberto || 0, icon: <AlertCircle size={20} />, color: 'amber' as const },
    { label: 'Em Andamento', value: counts.em_andamento || 0, icon: <Clock size={20} />, color: 'indigo' as const },
    { label: 'Resolvidos', value: counts.resolvido || 0, icon: <CheckCircle2 size={20} />, color: 'emerald' as const },
  ];

  const statusData = stats?.byStatus?.map((s: any) => ({
    name: s.status.replace('_', ' '),
    value: s.qtd
  })) || [];

  const priorityData = stats?.byPriority?.map((p: any) => ({
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
        {metricCards.map((card, i) => (
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

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xl font-black text-slate-900">Distribuição por Status</h3>
                 <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <span className="w-3 h-3 bg-blue-500 rounded-full"></span> Ativos
                 </div>
              </div>
              <div className="h-[300px] w-full">
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
              </div>
           </div>

           <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-900">Chamados Recentes</h3>
                <button className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline">Ver Todos</button>
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
                  recentTickets.map((ticket: any) => (
                    <div key={ticket.id} className="p-8 flex items-center gap-6 hover:bg-slate-50/50 transition-colors cursor-pointer group">
                      <div className={cn(
                        "w-14 h-14 rounded-[24px] flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm",
                        ticket.status === 'resolvido' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                      )}>
                        <TicketIcon size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1.5">
                          <span className="text-lg font-black text-slate-900 truncate">{ticket.titulo}</span>
                          <Badge variant={ticket.status === 'resolvido' ? 'emerald' : 'blue'}>{ticket.status.replace('_', ' ')}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                          <span className="flex items-center gap-1.5 text-blue-600">#{ticket.id}</span>
                          <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(ticket.created_at).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1.5"><UserIcon size={14} /> {ticket.cliente_nome}</span>
                        </div>
                      </div>
                      <div className="hidden sm:block">
                         <div className={cn(
                           "text-[10px] font-black uppercase px-4 py-1.5 rounded-xl border-2",
                           ticket.prioridade === 'urgente' ? "text-red-600 bg-red-50 border-red-100" : "text-slate-500 bg-slate-100 border-slate-200"
                         )}>
                           {ticket.prioridade}
                         </div>
                      </div>
                      <ChevronRight className="text-slate-200 group-hover:text-blue-500 transition-colors" size={24} />
                    </div>
                  ))
                ) : (
                  <div className="p-24 text-center flex flex-col items-center">
                    <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-[30px] flex items-center justify-center mb-6">
                      <TicketIcon size={48} />
                    </div>
                    <h4 className="text-2xl font-black text-slate-900 mb-2">Tudo em dia!</h4>
                    <p className="text-slate-500 font-medium max-w-xs mx-auto mb-10">Nenhum chamado pendente no momento. Que tal começar um novo trabalho?</p>
                    <button className="h-14 px-10 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 active:scale-95 flex items-center gap-3">
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
              <div className="h-[250px] w-full">
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
              </div>
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
           </div>

           <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-10 rounded-[40px] text-white shadow-2xl shadow-indigo-100 relative overflow-hidden group">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                    <TrendingUp size={28} />
                 </div>
                 <div>
                    <h4 className="font-black text-lg">Meta Operacional</h4>
                    <p className="text-white/60 text-xs font-bold uppercase tracking-widest font-mono">Performance</p>
                 </div>
              </div>
              <div className="text-5xl font-black mb-3">94.2%</div>
              <p className="text-white/80 font-medium mb-10 leading-relaxed">Você resolveu 12 chamados a mais que o planejado para este período.</p>
              <div className="space-y-4">
                <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden border border-white/10">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: '94.2%' }}
                     transition={{ duration: 1.5, ease: 'easeOut' }}
                     className="bg-white h-full rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                   />
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter text-white/50">
                   <span>Início</span>
                   <span>Meta: 90%</span>
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
