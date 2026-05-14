import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { DashboardData, Ticket } from '../../types';
import { MetricCard } from '../ui/MetricCard';
import { 
  Ticket as TicketIcon, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  ChevronRight,
  User as UserIcon,
  Plus,
  Building,
  Clock
} from 'lucide-react';
import { PageHeader, SectionTitle } from '../ui/PageHeader';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';

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
        const data = await api.get<DashboardData>('/dashboard/summary');
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ocorreu um erro ao carregar o dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const chamadosAtivos = stats?.chamadosAtivos || 0;
  const resolvidosMes = stats?.resolvidosMes || 0;
  const totalUsuarios = stats?.totalUsuarios || 0;
  const slaAtrasados = stats?.slaAtrasados || 0;
  const totalEmpresas = stats?.totalEmpresas;
  
  const recentTickets = stats?.recentTickets || [];

  const mainMetrics: Array<{ label: string, value: number, icon: React.ReactNode, color: 'blue' | 'amber' | 'emerald' | 'indigo' | 'red' | 'slate' }> = [
    { label: 'Atendimentos Ativos', value: chamadosAtivos, icon: <AlertCircle size={18} />, color: 'amber' as const },
    { label: 'SLA Atrasados', value: slaAtrasados, icon: <AlertCircle size={18} />, color: 'red' as const },
    { label: 'Resolvidos (Mês)', value: resolvidosMes, icon: <CheckCircle2 size={18} />, color: 'emerald' as const },
  ];

  if (totalEmpresas !== undefined) {
    mainMetrics.push({ label: 'Total Empresas', value: totalEmpresas, icon: <Building size={18} />, color: 'indigo' as const });
  } else {
    mainMetrics.push({ label: 'Total Usuários', value: totalUsuarios, icon: <UserIcon size={18} />, color: 'blue' as const });
  }

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
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-xs text-slate-500 font-medium">Resumo da operação de atendimento</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Ativos" value={chamadosAtivos} icon={<TicketIcon size={18} />} color="blue" loading={loading} />
        <MetricCard label="SLA vencido" value={slaAtrasados} icon={<AlertCircle size={18} />} color="red" loading={loading} />
        <MetricCard label="Resolvidos (Mês)" value={resolvidosMes} icon={<CheckCircle2 size={18} />} color="emerald" loading={loading} />
        <MetricCard label="Total de Usuários" value={totalUsuarios} icon={<UserIcon size={18} />} color="slate" loading={loading} />
      </div>

      {/* Atenção agora */}
      {(slaAtrasados > 0 || chamadosAtivos > 0) && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <AlertCircle size={16} className="text-red-500" />
            Atenção agora
          </h2>
          <div className="grid sm:grid-cols-4 gap-3">
            {slaAtrasados > 0 && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-100/50">
                <div className="w-8 h-8 rounded-md bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm">
                  {slaAtrasados}
                </div>
                <div>
                  <div className="text-xs font-semibold text-red-700">SLA Vencido</div>
                </div>
              </div>
            )}
            {chamadosAtivos > 0 && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 border border-blue-100/50">
                <div className="w-8 h-8 rounded-md bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                  {chamadosAtivos}
                </div>
                <div>
                  <div className="text-xs font-semibold text-blue-700">Abertos</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="overflow-hidden border-slate-200 shadow-sm rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/20 py-3 px-4">
            <h3 className="text-sm font-semibold text-slate-900">Atendimentos Recentes</h3>
            <Button variant="ghost" size="sm" className="h-8 text-[11px] font-semibold text-blue-600" onClick={() => onNavigate?.('tickets')}>
              Ver todos <ChevronRight size={14} className="ml-1" />
            </Button>
          </CardHeader>
          <div className="divide-y divide-slate-50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
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
                  <div key={ticket.id} onClick={() => onNavigate?.('tickets')} className="p-2.5 px-4 flex items-center gap-3 hover:bg-slate-50 transition-colors cursor-pointer group">
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
                <p className="text-xs text-slate-500 max-w-[180px] mb-4">Nenhum atendimento pendente.</p>
                <Button size="sm" className="h-8 text-[11px]" onClick={() => onNavigate?.('tickets')}>
                   <Plus size={14} className="mr-1" /> Novo Atendimento
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
