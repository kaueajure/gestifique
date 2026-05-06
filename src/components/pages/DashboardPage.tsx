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
  Calendar
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

export const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [statsData, ticketsData] = await Promise.all([
          api.get<any>('/dashboard/stats'),
          api.get<Ticket[]>('/tickets?limit=5')
        ]);
        setStats(statsData.counts);
        setRecentTickets(ticketsData);
      } catch (err: any) {
        setError(err.message || 'Ocorreu um erro ao carregar o dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const metricCards = [
    { label: 'Total de Chamados', value: stats?.total || 0, icon: <TicketIcon size={20} />, color: 'blue' as const, trend: { value: '+12%', positive: true } },
    { label: 'Em Aberto', value: stats?.aberto || 0, icon: <AlertCircle size={20} />, color: 'amber' as const, trend: { value: '8 novo', positive: false } },
    { label: 'Em Andamento', value: stats?.em_andamento || 0, icon: <Clock size={20} />, color: 'blue' as const },
    { label: 'Resolvidos', value: stats?.resolvido || 0, icon: <CheckCircle2 size={20} />, color: 'emerald' as const, trend: { value: '98%', positive: true } },
  ];

  if (error) {
    return (
      <div className="bg-red-50 p-8 rounded-3xl border border-red-100 flex flex-col items-center justify-center text-center">
         <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-4">
            <AlertCircle size={32} />
         </div>
         <h4 className="font-bold text-red-900 mb-2">Erro ao carregar dados</h4>
         <p className="text-red-600 text-sm max-w-sm mb-6">{error}</p>
         <button 
           onClick={() => window.location.reload()}
           className="h-10 px-6 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-100"
         >
           Tentar Novamente
         </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">O que está acontecendo hoje?</h2>
          <p className="text-slate-500 font-medium">Aqui está um resumo da operação da sua empresa.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
           <button className="h-10 px-4 rounded-xl bg-blue-50 text-blue-600 font-bold text-xs">Hoje</button>
           <button className="h-10 px-4 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 font-bold text-xs transition-all">Semana</button>
           <button className="h-10 px-4 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 font-bold text-xs transition-all">Mês</button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((card, i) => (
          <div key={i}>
            <MetricCard 
              label={card.label} 
              value={card.value} 
              icon={card.icon} 
              color={card.color} 
              trend={card.trend} 
              loading={loading} 
            />
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Clock size={18} className="text-blue-600" /> Atividades Recentes
                </h3>
                <button className="text-xs font-bold text-blue-600 hover:underline">Ver Tudos</button>
              </div>
              <div className="divide-y divide-slate-50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="p-6 animate-pulse flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100"></div>
                      <div className="flex-1 space-y-2">
                        <div className="w-24 h-4 bg-slate-100 rounded"></div>
                        <div className="w-48 h-3 bg-slate-100 rounded"></div>
                      </div>
                    </div>
                  ))
                ) : recentTickets.length > 0 ? (
                  recentTickets.map((ticket) => (
                    <div key={ticket.id} className="p-6 flex items-center gap-4 hover:bg-slate-50 transition-colors group cursor-pointer">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                        ticket.status === 'resolvido' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                      )}>
                        <TicketIcon size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-slate-800 truncate">{ticket.titulo}</span>
                          <Badge variant={ticket.status === 'resolvido' ? 'emerald' : 'blue'}>{ticket.status.replace('_', ' ')}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(ticket.created_at).toLocaleDateString()}</span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                          <span>Solicitante: {ticket.cliente_nome}</span>
                        </div>
                      </div>
                      <div className="text-right">
                         <div className={cn(
                           "text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border",
                           ticket.prioridade === 'urgente' ? "text-red-600 bg-red-50 border-red-100" : "text-slate-500 bg-slate-50 border-slate-100"
                         )}>
                           {ticket.prioridade}
                         </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-20 text-center text-slate-400">Nenhum chamado recente.</div>
                )}
              </div>
           </div>
        </div>

        <div className="space-y-6">
           <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl shadow-blue-200">
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                    <TrendingUp size={20} />
                 </div>
                 <h4 className="font-bold">Meta do Mês</h4>
              </div>
              <div className="text-4xl font-black mb-2">94.2%</div>
              <p className="text-white/70 text-sm mb-6">Sua taxa de resolução está 2.1% acima da média do último mês.</p>
              <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: '94.2%' }}
                   transition={{ duration: 1.5, ease: 'easeOut' }}
                   className="bg-white h-full rounded-full"
                 />
              </div>
           </div>

           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
             <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
               <MessageSquare size={18} className="text-blue-600" /> Canais Mais Utilizados
             </h4>
             <div className="space-y-4">
                {[
                  { label: 'Portal Gestifique', val: 78, color: 'bg-blue-100' },
                  { label: 'E-mail Integrado', val: 15, color: 'bg-indigo-100' },
                  { label: 'API / Manual', val: 7, color: 'bg-slate-100' }
                ].map((channel, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <span>{channel.label}</span>
                      <span>{channel.val}%</span>
                    </div>
                    <div className="w-full bg-slate-50 h-1.5 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full bg-blue-600", channel.color)} style={{ width: `${channel.val}%` }}></div>
                    </div>
                  </div>
                ))}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};
