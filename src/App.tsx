/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  ChevronRight, 
  Menu, 
  X, 
  Ticket, 
  Users, 
  MessageSquare, 
  LayoutDashboard, 
  ShieldCheck, 
  Zap, 
  History, 
  BarChart3, 
  ArrowRight,
  Bell,
  Search,
  Plus,
  Briefcase,
  UserCheck,
  TrendingUp,
  Cpu,
  ArrowLeft,
  Filter,
  FileText,
  Settings,
  MoreVertical,
  Clock,
  ExternalLink
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { cn } from './lib/utils';

// --- Business Components ---

const DashboardContainer = ({ 
  currentUser, 
  activeTab, 
  setActiveTab, 
  handleLogout,
  selectedTicketId,
  setSelectedTicketId
}: { 
  currentUser: User, 
  activeTab: DashboardTab, 
  setActiveTab: (t: DashboardTab) => void,
  handleLogout: () => void,
  selectedTicketId: number | null,
  setSelectedTicketId: (id: number | null) => void
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden selection:bg-blue-100 selection:text-blue-900">
      {/* Sidebar */}
      <aside className={cn(
        "bg-white border-r border-slate-200 flex flex-col transition-all duration-300 z-30",
        isSidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="h-20 flex items-center px-6 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100 shrink-0">
              <span className="text-xl font-bold font-display">G</span>
            </div>
            {isSidebarOpen && (
              <span className="text-xl font-bold font-display tracking-tight text-slate-800 animate-in fade-in duration-500">Gestifique</span>
            )}
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <SidebarItem 
            active={activeTab === 'overview'} 
            icon={LayoutDashboard} 
            label="Início" 
            collapsed={!isSidebarOpen} 
            onClick={() => setActiveTab('overview')}
          />
          <SidebarItem 
            active={activeTab === 'tickets'} 
            icon={Ticket} 
            label="Tickets" 
            collapsed={!isSidebarOpen} 
            onClick={() => { setActiveTab('tickets'); setSelectedTicketId(null); }}
          />
          {(currentUser.administrador || currentUser.desenvolvedor) && (
            <SidebarItem 
              active={activeTab === 'users'} 
              icon={Users} 
              label="Equipe" 
              collapsed={!isSidebarOpen} 
              onClick={() => setActiveTab('users')}
            />
          )}
          {currentUser.desenvolvedor && (
            <SidebarItem 
              active={activeTab === 'companies'} 
              icon={Briefcase} 
              label="Empresas" 
              collapsed={!isSidebarOpen} 
              onClick={() => setActiveTab('companies')}
            />
          )}
          <SidebarItem 
            active={activeTab === 'reports'} 
            icon={BarChart3} 
            label="Relatórios" 
            collapsed={!isSidebarOpen} 
            onClick={() => setActiveTab('reports')}
          />
        </nav>

        <div className="p-3 border-t border-slate-100">
          <SidebarItem 
            active={activeTab === 'settings'} 
            icon={Settings} 
            label="Configurações" 
            collapsed={!isSidebarOpen} 
            onClick={() => setActiveTab('settings')}
          />
          <button 
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 w-full p-3 rounded-xl text-red-500 hover:bg-red-50 transition-all font-semibold",
              !isSidebarOpen && "justify-center"
            )}
          >
            <X size={20} />
            {isSidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 lg:block hidden"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-xl font-bold text-slate-800 capitalize">
              {activeTab === 'overview' ? 'Visão Geral' : activeTab}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative lg:block hidden">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Busca global..." 
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 w-64"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right mr-2 lg:block hidden">
                <div className="text-sm font-bold text-slate-800 leading-none mb-1">{currentUser.nome}</div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  {currentUser.desenvolvedor ? 'Developer' : currentUser.administrador ? 'Admin' : 'User'}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {currentUser.nome.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 relative p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + (selectedTicketId || '')}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeTab === 'overview' && <OverviewTab currentUser={currentUser} setActiveTab={setActiveTab} />}
              {activeTab === 'tickets' && !selectedTicketId && <TicketsTab currentUser={currentUser} onSelectTicket={setSelectedTicketId} />}
              {activeTab === 'tickets' && selectedTicketId && <TicketDetailsView ticketId={selectedTicketId} onBack={() => setSelectedTicketId(null)} />}
              {activeTab === 'users' && <UsersTab currentUser={currentUser} />}
              {activeTab === 'companies' && <CompaniesTab />}
              {activeTab === 'reports' && <ReportsTab />}
              {activeTab === 'settings' && <SettingsTab currentUser={currentUser} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

const SidebarItem = ({ icon: Icon, label, active, collapsed, onClick }: { icon: any, label: string, active?: boolean, collapsed?: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 w-full p-3 rounded-xl transition-all font-medium group",
      active ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "text-slate-500 hover:bg-blue-50 hover:text-blue-600",
      collapsed && "justify-center px-0"
    )}
  >
    <Icon size={20} className={cn(!active && "group-hover:scale-110 transition-transform")} />
    {!collapsed && <span>{label}</span>}
  </button>
);

const OverviewTab = ({ currentUser, setActiveTab }: { currentUser: User, setActiveTab: (t: DashboardTab) => void }) => {
  const [stats, setStats] = useState<any>(null);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    fetch('/api/dashboard/stats').then(res => res.json()).then(setStats);
    fetch('/api/tickets')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data)) {
          setRecentTickets(data.slice(0, 5));
        } else {
          setRecentTickets([]);
        }
      })
      .catch(() => setRecentTickets([]));
  }, []);

  const chartData = [
    { name: 'Seg', tickets: 12 },
    { name: 'Ter', tickets: 19 },
    { name: 'Qua', tickets: 15 },
    { name: 'Qui', tickets: 22 },
    { name: 'Sex', tickets: 30 },
    { name: 'Sáb', tickets: 10 },
    { name: 'Dom', tickets: 8 },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Painel de Controle</h1>
          <p className="text-slate-500 mt-1">Bem-vindo de volta, {currentUser.nome.split(' ')[0]}. Aqui está o resumo da sua operação.</p>
        </div>
        <button 
          onClick={() => setActiveTab('tickets')}
          className="bg-white px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
        >
          Visualizar Todos
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total de Chamados" 
          value={stats?.total || 0} 
          icon={FileText} 
          color="blue"
          trend="+14% este mês"
        />
        <StatCard 
          label="Aguardando Resposta" 
          value={stats?.open || 0} 
          icon={Clock} 
          color="amber"
          trend="Tempo médio: 12min"
        />
        <StatCard 
          label="Resolvidos Hoje" 
          value={stats?.resolved || 0} 
          icon={CheckCircle2} 
          color="emerald"
          trend="Meta diária batida"
        />
        <StatCard 
          label="Prioridade Urgente" 
          value={stats?.urgent || 0} 
          icon={Zap} 
          color="red"
          trend="Ação imediata necessária"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Chart Column */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-slate-800 text-lg">Volume de Atendimentos</h3>
            <select className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 outline-none">
              <option>Últimos 7 dias</option>
              <option>Este mês</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="tickets" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorTickets)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-full">
          <h3 className="font-bold text-slate-800 text-lg mb-6">Atividade Recente</h3>
          <div className="space-y-6 flex-1">
            {recentTickets.map((t, i) => (
              <div key={i} className="flex gap-4 group cursor-pointer">
                <div className={cn(
                  "w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-white",
                  t.status === 'resolvido' ? 'bg-emerald-500' : t.prioridade === 'urgente' ? 'bg-red-500' : 'bg-blue-500'
                )}>
                  <Ticket size={20} />
                </div>
                <div className="flex-1 border-b border-slate-50 pb-4 group-last:border-0">
                  <div className="text-sm font-bold text-slate-800 line-clamp-1">{t.titulo}</div>
                  <div className="text-[10px] text-slate-400 mt-1 font-medium">{t.status.replace('_', ' ')} • {new Date(t.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
            {recentTickets.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <LayoutDashboard size={40} className="mb-4 opacity-20" />
                <p className="text-sm">Nenhuma atividade ainda.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color, trend }: { label: string, value: string | number, icon: any, color: 'blue' | 'amber' | 'emerald' | 'red', trend: string }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    red: "bg-red-50 text-red-600 border-red-100"
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group hover:border-blue-200 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-3 rounded-xl border shrink-0 transition-transform group-hover:scale-110", colors[color])}>
          <Icon size={24} />
        </div>
        <div className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">
          +12%
        </div>
      </div>
      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</div>
      <div className="text-3xl font-bold text-slate-800 mt-2">{value}</div>
      <div className="text-xs text-slate-400 font-medium mt-2 flex items-center gap-1">
        {trend}
      </div>
    </div>
  );
};

const TicketsTab = ({ currentUser, onSelectTicket }: { currentUser: User, onSelectTicket: (id: number) => void }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTickets = () => {
    setIsLoading(true);
    fetch('/api/tickets')
      .then(res => res.ok ? res.json() : [])
      .then(data => { 
        setTickets(Array.isArray(data) ? data : []); 
        setIsLoading(false); 
      })
      .catch(() => {
        setTickets([]);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      titulo: formData.get('titulo'),
      descricao: formData.get('descricao'),
      prioridade: formData.get('prioridade'),
      categoria: formData.get('categoria')
    };

    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      setIsModalOpen(false);
      fetchTickets();
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tickets e Chamados</h1>
          <p className="text-slate-500">Gerencie todos os atendimentos da sua plataforma.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
        >
          <Plus size={20} /> Novo Chamado
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg text-sm text-slate-500 cursor-pointer hover:bg-slate-100 transition-colors">
          <Filter size={16} /> Todos os Status
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg text-sm text-slate-500 cursor-pointer hover:bg-slate-100 transition-colors">
          <Clock size={16} /> Últimos 30 Dias
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg text-sm text-slate-500 cursor-pointer hover:bg-slate-100 transition-colors ml-auto">
          <Search size={16} /> Pesquisar ID...
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Assunto / ID</th>
              <th className="px-6 py-4">Solicitante</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Prioridade</th>
              <th className="px-6 py-4">Data</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tickets.map((t) => (
              <tr 
                key={t.id} 
                className="hover:bg-slate-50 transition-colors cursor-pointer group"
                onClick={() => onSelectTicket(t.id)}
              >
                <td className="px-6 py-5">
                   <div className="font-bold text-slate-800 line-clamp-1">{t.titulo}</div>
                   <div className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider">#{t.id} • {t.categoria}</div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
                      {t.cliente_nome?.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-slate-600">{t.cliente_nome}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                   <span className={cn(
                     "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                     t.status === 'aberto' && "bg-blue-100 text-blue-600",
                     t.status === 'em_andamento' && "bg-indigo-100 text-indigo-600",
                     t.status === 'resolvido' && "bg-emerald-100 text-emerald-600",
                     t.status === 'fechado' && "bg-slate-100 text-slate-500",
                     t.status === 'aguardando_cliente' && "bg-amber-100 text-amber-600"
                   )}>
                     {t.status.replace('_', ' ')}
                   </span>
                </td>
                <td className="px-6 py-5">
                   <span className={cn(
                     "flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider",
                     t.prioridade === 'urgente' ? "text-red-600" : t.prioridade === 'alta' ? "text-orange-600" : "text-slate-500"
                   )}>
                     <div className={cn("w-1.5 h-1.5 rounded-full", 
                        t.prioridade === 'urgente' ? "bg-red-600" : t.prioridade === 'alta' ? "bg-orange-600" : "bg-slate-400"
                     )}></div>
                     {t.prioridade}
                   </span>
                </td>
                <td className="px-6 py-5 text-sm text-slate-500">
                  {new Date(t.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight size={20} className="text-slate-300 inline-block" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tickets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Ticket size={48} className="mb-4 opacity-20" />
            <p className="font-bold">Nenhum ticket encontrado.</p>
            <p className="text-sm mt-1">Sua lista de atendimentos está limpa.</p>
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-0">
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setIsModalOpen(false)}
               className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            ></motion.div>
            <motion.div
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden"
            >
               <div className="p-8">
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-slate-900">Novo Chamado</h2>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><X /></button>
                  </div>

                  <form className="space-y-6" onSubmit={handleCreateTicket}>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Título do Chamado</label>
                      <input 
                        name="titulo" 
                        required 
                        placeholder="Breve descrição do problema"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Prioridade</label>
                        <select name="prioridade" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500">
                          <option value="baixa">Baixa</option>
                          <option value="media" selected>Média</option>
                          <option value="alta">Alta</option>
                          <option value="urgente">Urgente</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Categoria</label>
                        <select name="categoria" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500">
                          <option value="suporte">Suporte Técnico</option>
                          <option value="financeiro">Financeiro</option>
                          <option value="duvida">Dúvida Geral</option>
                          <option value="comercial">Comercial</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Descrição Detalhada</label>
                      <textarea 
                        name="descricao" 
                        required 
                        rows={4}
                        placeholder="Descreva detalhadamente o que está ocorrendo..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 h-32 resize-none"
                      ></textarea>
                    </div>

                    <button className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">Criar Ticket</button>
                  </form>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TicketDetailsView = ({ ticketId, onBack }: { ticketId: number, onBack: () => void }) => {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchDetails = () => {
    setIsLoading(true);
    Promise.all([
      fetch(`/api/tickets/${ticketId}`).then(res => res.ok ? res.json() : null),
      fetch(`/api/tickets/${ticketId}/messages`).then(res => res.ok ? res.json() : [])
    ]).then(([tData, mData]) => {
      setTicket(tData);
      setMessages(Array.isArray(mData) ? mData : []);
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });
  };

  useEffect(() => {
    fetchDetails();
  }, [ticketId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const res = await fetch(`/api/tickets/${ticketId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensagem: newMessage, interno: false })
    });

    if (res.ok) {
      setNewMessage("");
      fetch(`/api/tickets/${ticketId}/messages`).then(res => res.json()).then(setMessages);
    }
  };

  if (isLoading || !ticket) return <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="grid lg:grid-cols-4 gap-8 h-[calc(100vh-12rem)]">
      {/* Left Column: Chat */}
      <div className="lg:col-span-3 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <header className="px-8 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-colors"><ArrowLeft size={20} /></button>
          <div>
             <h3 className="font-bold text-slate-800 leading-tight">{ticket.titulo}</h3>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">#{ticket.id} • Solicitado por {ticket.cliente_nome}</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
           <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2 block">Descrição Original</span>
              <p className="text-slate-600 text-sm whitespace-pre-wrap">{ticket.descricao}</p>
           </div>

           {messages.map((m, i) => (
             <div key={i} className={cn(
               "flex flex-col max-w-[80%]",
               i % 2 === 0 ? "mr-auto" : "ml-auto items-end"
             )}>
                <div className="text-[10px] font-bold text-slate-400 mb-1 px-1">{m.usuario_nome} • {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                <div className={cn(
                  "p-4 rounded-2xl text-sm shadow-sm",
                  i % 2 === 0 ? "bg-white border border-slate-200 text-slate-700" : "bg-blue-600 text-white rounded-tr-none"
                )}>
                   {m.mensagem}
                </div>
             </div>
           ))}
        </div>

        <form className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3" onSubmit={handleSendMessage}>
           <input 
             value={newMessage}
             onChange={(e) => setNewMessage(e.target.value)}
             placeholder="Escreva sua mensagem..." 
             className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 text-sm"
           />
           <button 
             type="submit"
             disabled={!newMessage.trim()}
             className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center disabled:opacity-50 shadow-lg shadow-blue-100"
           >
              Enviar
           </button>
        </form>
      </div>

      {/* Right Column: Metadata */}
      <div className="lg:col-span-1 space-y-6">
         <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h4 className="font-bold text-slate-800 mb-6 text-sm uppercase tracking-wider">Informações</h4>
            <div className="space-y-4">
               <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Status</label>
                  <div className="flex items-center gap-2">
                     <div className={cn("w-2 h-2 rounded-full", ticket.status === 'resolvido' ? 'bg-emerald-500' : 'bg-blue-500')}></div>
                     <span className="text-sm font-bold text-slate-700 capitalize">{ticket.status.replace('_', ' ')}</span>
                  </div>
               </div>
               <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Prioridade</label>
                  <span className={cn("text-sm font-bold", ticket.prioridade === 'urgente' ? 'text-red-500' : 'text-slate-700')}>{ticket.prioridade.toUpperCase()}</span>
               </div>
               <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Responsável</label>
                  <div className="text-sm font-bold text-slate-700">{ticket.responsavel_nome || 'Aguardando atribuição'}</div>
               </div>
               <div className="pt-4 border-t border-slate-50">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Criado em</label>
                  <div className="text-sm text-slate-500">{new Date(ticket.created_at).toLocaleString()}</div>
               </div>
            </div>
         </div>

         <div className="bg-slate-900 p-6 rounded-3xl text-white">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="text-amber-400" size={20} />
              <h4 className="font-bold text-sm">Resumo da IA</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              O cliente está com problemas de acesso recorrente. Sugerimos verificar o log de autenticação e reset de tokens.
            </p>
         </div>
      </div>
    </div>
  );
}

const UsersTab = ({ currentUser }: { currentUser: User }) => {
  const [users, setUsers] = useState<User[]>([]);
  useEffect(() => {
    fetch('/api/users')
      .then(res => res.ok ? res.json() : [])
      .then(data => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]));
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Equipe e Membros</h1>
          <p className="text-slate-500">Gerencie quem tem acesso à sua plataforma.</p>
        </div>
        <button className="bg-white border border-slate-200 px-6 py-3 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
          <Plus size={20} /> Adicionar Membro
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <div key={user.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative group overflow-hidden">
             <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xl group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:rotate-6 shadow-sm">
                   {user.nome.charAt(0).toUpperCase()}
                </div>
                <div>
                   <h3 className="font-bold text-slate-800">{user.nome}</h3>
                   <p className="text-xs text-slate-400">{user.email}</p>
                </div>
             </div>
             
             <div className="mt-6 flex items-center justify-between border-t border-slate-50 pt-4">
                <div className="flex flex-col">
                   <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Cargo</span>
                   <span className="text-xs font-bold text-slate-600">{user.cargo || 'Membro'}</span>
                </div>
                <div className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                  user.desenvolvedor ? "bg-amber-100 text-amber-600" : user.administrador ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"
                )}>
                   {user.desenvolvedor ? 'Dev' : user.administrador ? 'Admin' : 'Usuário'}
                </div>
             </div>

             <div className="absolute top-4 right-4 text-slate-300">
                <MoreVertical size={16} />
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const CompaniesTab = () => {
  const [companies, setCompanies] = useState<any[]>([]);
  useEffect(() => {
    fetch('/api/companies')
      .then(res => res.ok ? res.json() : [])
      .then(data => setCompanies(Array.isArray(data) ? data : []))
      .catch(() => setCompanies([]));
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Todas as Empresas</h1>
          <p className="text-slate-500">Acesso mestre para gestão de instâncias SaaS.</p>
        </div>
        <button className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-100">Configurar Nova Instância</button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
           <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
             <tr>
               <th className="px-6 py-4">Nome da Empresa</th>
               <th className="px-6 py-4">ID / Chave</th>
               <th className="px-6 py-4">Status</th>
               <th className="px-6 py-4">Criado em</th>
               <th className="px-6 py-4">Ações</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-100">
             {companies.map((c) => (
               <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                 <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold">
                          {c.nome.charAt(0)}
                       </div>
                       <span className="font-bold text-slate-700">{c.nome}</span>
                    </div>
                 </td>
                 <td className="px-6 py-4 font-mono text-xs text-slate-400">GH-2026-X{c.id}</td>
                 <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">Ativa</span>
                 </td>
                 <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(c.created_at).toLocaleDateString()}
                 </td>
                 <td className="px-6 py-4">
                    <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><ExternalLink size={16} /></button>
                 </td>
               </tr>
             ))}
           </tbody>
        </table>
      </div>
    </div>
  );
}

const ReportsTab = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
    <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-6">
      <Cpu size={40} />
    </div>
    <h2 className="text-2xl font-bold text-slate-800">Processando Inteligência...</h2>
    <p className="text-slate-500 max-w-sm mt-2">Nossa IA está processando os dados da sua empresa para gerar relatórios preditivos de demanda.</p>
    <div className="mt-8 flex gap-3">
       <div className="w-3 h-3 rounded-full bg-blue-600 animate-bounce delay-0"></div>
       <div className="w-3 h-3 rounded-full bg-blue-600 animate-bounce delay-150"></div>
       <div className="w-3 h-3 rounded-full bg-blue-600 animate-bounce delay-300"></div>
    </div>
  </div>
);

const SettingsTab = ({ currentUser }: { currentUser: User }) => (
  <div className="max-w-2xl space-y-8">
     <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Configurações</h1>
        <p className="text-slate-500">Ajuste suas preferências e dados pessoais.</p>
     </div>

     <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100">
           <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 text-3xl font-bold uppercase">
                 {currentUser.nome.charAt(0)}
              </div>
              <div>
                 <h3 className="text-xl font-bold text-slate-800">{currentUser.nome}</h3>
                 <p className="text-slate-500 text-sm">{currentUser.email}</p>
                 <button className="mt-3 text-xs font-bold text-blue-600 hover:underline">Alterar Foto de Perfil</button>
              </div>
           </div>
        </div>

        <div className="p-8 space-y-6">
           <div className="grid grid-cols-2 gap-6">
              <div>
                 <label className="block text-sm font-bold text-slate-700 mb-2">Nome de Exibição</label>
                 <input defaultValue={currentUser.nome} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed outline-none" disabled />
              </div>
              <div>
                 <label className="block text-sm font-bold text-slate-700 mb-2">Cargo</label>
                 <input defaultValue={currentUser.cargo || 'Administrador'} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-4 focus:ring-blue-50" />
              </div>
           </div>

           <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">E-mail corporativo</label>
              <input defaultValue={currentUser.email} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-4 focus:ring-blue-50" />
           </div>

           <div className="pt-4 flex justify-end gap-3">
              <button className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all">Cancelar</button>
              <button className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">Salvar Alterações</button>
           </div>
        </div>
     </div>

     <div className="bg-red-50 p-8 rounded-3xl border border-red-100">
        <h4 className="text-red-600 font-bold mb-2">Zona de Perigo</h4>
        <p className="text-red-500/70 text-sm mb-6">Se você excluir sua conta, todos os seus dados serão apagados permanentemente. Esta ação não pode ser desfeita.</p>
        <button className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition-all">Excluir Minha Conta</button>
     </div>
  </div>
);

// --- App Root ---

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Início', href: '#home' },
    { name: 'Recursos', href: '#features' },
    { name: 'Benefícios', href: '#benefits' },
    { name: 'Sobre', href: '#about' },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'glass py-3 shadow-sm' : 'bg-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
            <span className="text-2xl font-bold font-display">G</span>
          </div>
          <span className="text-2xl font-bold font-display tracking-tight text-slate-800">Gestifique</span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href} 
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
            >
              {link.name}
            </a>
          ))}
        </nav>

        <div className="hidden md:block">
          <button className="bg-blue-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-blue-700 transition-all shadow-md active:scale-95">
            Acessar Plataforma
          </button>
        </div>

        <button 
          className="md:hidden p-2 text-slate-600"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed inset-0 z-50 bg-white p-6 flex flex-col"
          >
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                  <span className="text-2xl font-bold font-display">G</span>
                </div>
                <span className="text-2xl font-bold font-display tracking-tight">Gestifique</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2">
                <X className="w-6 h-6 text-slate-600" />
              </button>
            </div>
            
            <nav className="flex flex-col gap-6 mb-auto">
              {navLinks.map((link) => (
                <a 
                  key={link.name} 
                  href={link.href} 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-2xl font-semibold text-slate-800 border-b border-slate-100 pb-2"
                >
                  {link.name}
                </a>
              ))}
            </nav>

            <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl">
              Acessar Plataforma
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

const DashboardMockup = () => {
  return (
    <div className="relative w-full max-w-4xl mx-auto rounded-2xl border border-slate-200 bg-slate-50 shadow-2xl overflow-hidden dashboard-gradient">
      {/* Sidebar Mock */}
      <div className="flex h-full">
        <div className="w-16 md:w-56 border-r border-slate-200 bg-white hidden sm:flex flex-col p-4 gap-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
              <LayoutDashboard size={20} />
            </div>
            <span className="hidden md:block font-bold text-slate-800">Painel</span>
          </div>
          <div className="flex flex-col gap-2">
            {[
              { icon: Ticket, label: 'Tickets' },
              { icon: Users, label: 'Time' },
              { icon: MessageSquare, label: 'Chat' },
              { icon: History, label: 'Histórico' },
              { icon: BarChart3, label: 'Relatórios' }
            ].map((item, i) => (
              <div key={i} className={`flex items-center gap-3 p-2 rounded-lg ${i === 0 ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600 cursor-pointer transition-colors'}`}>
                <item.icon size={20} />
                <span className="hidden md:block text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content Mock */}
        <div className="flex-1 flex flex-col h-[400px] md:h-[600px]">
          {/* Header Mock */}
          <div className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6">
            <div className="flex items-center gap-4 bg-slate-100 rounded-lg px-3 py-1.5 flex-1 max-w-md">
              <Search className="text-slate-400" size={16} />
              <span className="text-xs text-slate-400 hidden sm:block">Pesquisar tickets...</span>
            </div>
            <div className="flex items-center gap-4 ml-4">
              <Bell size={20} className="text-slate-400" />
              <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200"></div>
            </div>
          </div>

          {/* Body Mock */}
          <div className="p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Visão Geral</h3>
              <button className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2">
                <Plus size={14} /> Novo Ticket
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Em aberto', value: '42', color: 'bg-orange-500' },
                { label: 'Em atendimento', value: '18', color: 'bg-blue-500' },
                { label: 'Resolvidos (Hoje)', value: '124', color: 'bg-emerald-500' }
              ].map((stat, i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{stat.label}</span>
                  <div className="flex items-end justify-between mt-1">
                    <span className="text-2xl font-bold text-slate-800">{stat.value}</span>
                    <div className={`w-8 h-1 rounded-full ${stat.color}`}></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Assunto</th>
                    <th className="px-4 py-3">Prioridade</th>
                    <th className="px-4 py-3 hidden sm:table-cell">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {[
                    { title: 'Erro na integração API #402', priority: 'Alta', status: 'Aberto', color: 'bg-red-100 text-red-600' },
                    { title: 'Dúvida sobre cobrança mensal', priority: 'Média', status: 'Em curso', color: 'bg-blue-100 text-blue-600' },
                    { title: 'Solicitação de novo recurso UX', priority: 'Baixa', status: 'Aguardando', color: 'bg-slate-100 text-slate-600' }
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-4 font-medium text-slate-700">{row.title}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${row.color}`}>{row.priority}</span>
                      </td>
                      <td className="px-4 py-4 hidden sm:table-cell text-slate-500">{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SectionTitle = ({ badge, title, subtitle, center = true }: { badge?: string, title: string, subtitle?: string, center?: boolean }) => (
  <div className={`max-w-3xl mb-16 ${center ? 'mx-auto text-center' : ''}`}>
    {badge && (
      <span className="inline-block px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-bold tracking-tight mb-4 border border-blue-100">
        {badge}
      </span>
    )}
    <h2 className="text-3xl md:text-5xl font-bold font-display text-slate-900 tracking-tight mb-4">
      {title}
    </h2>
    {subtitle && (
      <p className="text-lg text-slate-600 leading-relaxed">
        {subtitle}
      </p>
    )}
  </div>
);

interface User {
  id: number;
  nome: string;
  email: string;
  administrador: boolean;
  desenvolvedor: boolean;
  empresa_id: number | null;
  cargo?: string;
  ativo?: boolean;
}

interface Ticket {
  id: number;
  empresa_id: number;
  usuario_id: number;
  responsavel_id: number | null;
  titulo: string;
  descricao: string;
  status: 'aberto' | 'em_andamento' | 'aguardando_cliente' | 'resolvido' | 'fechado';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  categoria: string;
  created_at: string;
  updated_at: string;
  cliente_nome?: string;
  responsavel_nome?: string;
}

interface TicketMessage {
  id: number;
  ticket_id: number;
  usuario_id: number;
  usuario_nome: string;
  mensagem: string;
  interno: boolean;
  created_at: string;
}

type DashboardTab = 'overview' | 'tickets' | 'users' | 'companies' | 'reports' | 'settings';

export default function App() {
  const [view, setView] = useState<'landing' | 'login' | 'register' | 'dashboard'>('landing');
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError(null);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data.user);
        setView('dashboard');
      } else {
        setAuthError(data.message);
      }
    } catch (err) {
      setAuthError('Erro de conexão com o servidor');
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError(null);
    const formData = new FormData(e.currentTarget);
    const nome = formData.get('nome');
    const email = formData.get('email');
    const empresa = formData.get('empresa');
    const password = formData.get('password');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, empresa, password })
      });
      const data = await res.json();
      if (res.ok) {
        setView('login');
        alert('Conta criada com sucesso! Faça login para continuar.');
      } else {
        setAuthError(data.message);
      }
    } catch (err) {
      setAuthError('Erro de conexão com o servidor');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setCurrentUser(null);
    setView('landing');
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    // Check session on load
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.user) {
          setCurrentUser(data.user);
          setView('dashboard');
        }
      })
      .finally(() => setIsAuthLoading(false));

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (view === 'dashboard' && currentUser) {
    return (
      <DashboardContainer 
        currentUser={currentUser} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        handleLogout={handleLogout}
        selectedTicketId={selectedTicketId}
        setSelectedTicketId={setSelectedTicketId}
      />
    );
  }

  if (view === 'login' || view === 'register') {
    return (
      <div className="min-h-screen bg-white flex flex-col md:flex-row overflow-hidden selection:bg-blue-100 selection:text-blue-900">
        {/* Left Side: Brand & Visual */}
        <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-slate-50 relative items-center justify-center p-12 overflow-hidden border-r border-slate-100">
          <div className="absolute inset-0 dashboard-gradient pointer-events-none opacity-40"></div>
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-50 rounded-full blur-3xl opacity-60"></div>
          
          <div className="relative z-10 max-w-lg">
            <button 
              onClick={() => setView('landing')}
              className="group flex items-center gap-2 mb-16 text-slate-400 hover:text-blue-600 transition-colors"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
                <span className="text-2xl font-bold font-display">G</span>
              </div>
              <span className="text-2xl font-bold font-display tracking-tight text-slate-800">Gestifique</span>
            </button>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl lg:text-5xl font-bold font-display text-slate-900 tracking-tight leading-tight mb-8">
                Centralize tickets, atendimentos e <span className="text-blue-600">comunicação.</span>
              </h2>
              <p className="text-xl text-slate-500 leading-relaxed mb-12">
                Uma experiência moderna para empresas que precisam organizar suporte, equipes e clientes com clareza.
              </p>

              {/* Minimal Mockup Preview */}
              <div className="relative rounded-2xl border border-slate-200 bg-white shadow-2xl p-4 scale-95 origin-left">
                 <div className="flex gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                    <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                    <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                 </div>
                 <div className="space-y-3">
                    <div className="h-4 w-3/4 bg-slate-100 rounded"></div>
                    <div className="h-4 w-1/2 bg-slate-50 rounded"></div>
                    <div className="flex gap-2 pt-2">
                        <div className="h-8 w-20 bg-blue-50 rounded-lg"></div>
                        <div className="h-8 w-24 bg-slate-50 rounded-lg"></div>
                    </div>
                 </div>
              </div>
            </motion.div>
          </div>

          <div className="absolute bottom-12 left-12 flex items-center gap-8 text-xs font-bold text-slate-300 uppercase tracking-widest">
             <span>Security First</span>
             <span>Premium Support</span>
             <span>256-bit AES</span>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative">
          <div className="md:hidden absolute top-6 left-6 flex items-center gap-2" onClick={() => setView('landing')}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <span className="text-lg font-bold font-display">G</span>
            </div>
            <span className="text-lg font-bold font-display tracking-tight">Gestifique</span>
          </div>

            <motion.div 
            key={view}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-sm"
          >
            <div className="mb-10 text-center md:text-left">
              <h1 className="text-3xl font-bold font-display text-slate-900 tracking-tight mb-2">
                {view === 'login' ? 'Entrar na plataforma' : 'Criar sua conta'}
              </h1>
              <p className="text-slate-500">
                {view === 'login' 
                  ? 'Acesse sua conta para continuar sua gestão.' 
                  : 'Junte-se à Gestifique e organize sua operação.'}
              </p>
            </div>

            {authError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium">
                {authError}
              </div>
            )}

            <form className="space-y-4" onSubmit={view === 'login' ? handleLogin : handleRegister}>
              {view === 'register' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 px-1">Nome completo</label>
                    <input 
                      name="nome"
                      type="text" 
                      required
                      placeholder="Ex: João Silva"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 px-1">Nome da Empresa</label>
                    <input 
                      name="empresa"
                      type="text" 
                      required
                      placeholder="Sua empresa"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-300"
                    />
                  </div>
                </>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 px-1">Endereço de e-mail</label>
                <input 
                  name="email"
                  type="email" 
                  required
                  placeholder="seu@email.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-300"
                />
              </div>
              
              <div className="relative">
                <div className="flex justify-between mb-1.5 px-1">
                  <label className="block text-sm font-semibold text-slate-700">Senha</label>
                  {view === 'login' && (
                    <button type="button" className="text-xs text-blue-600 font-bold hover:underline">Esqueceu?</button>
                  )}
                </div>
                <input 
                  name="password"
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-300"
                />
              </div>

              {view === 'register' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 px-1">Confirmar senha</label>
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-300"
                  />
                </div>
              )}

              {view === 'login' && (
                <div className="flex items-center gap-2 px-1">
                  <input type="checkbox" id="remember" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <label htmlFor="remember" className="text-sm text-slate-500 cursor-pointer select-none">Lembrar login</label>
                </div>
              )}

              <button type="submit" className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 mt-4 shadow-blue-100">
                {view === 'login' ? 'Entrar na conta' : 'Criar minha conta'}
              </button>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-300 font-bold tracking-widest px-4">ou</span>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setView(view === 'login' ? 'register' : 'login')}
                className="w-full bg-white text-slate-600 border border-slate-200 py-3.5 rounded-xl font-bold hover:bg-slate-50 transition-all active:scale-95"
              >
                {view === 'login' ? 'Criar nova conta' : 'Já tenho uma conta'}
              </button>
            </form>

            <p className="mt-12 text-center text-xs text-slate-400 leading-relaxed">
              Ao continuar, você concorda com nossos <span className="underline cursor-pointer">Termos de Uso</span> e <span className="underline cursor-pointer">Política de Privacidade</span>.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative selection:bg-blue-100 selection:text-blue-900 overflow-hidden" id="home">
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'glass py-3 shadow-sm' : 'bg-transparent py-5'
        }`}
      >
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setView('landing')}>
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
              <span className="text-2xl font-bold font-display">G</span>
            </div>
            <span className="text-2xl font-bold font-display tracking-tight text-slate-800">Gestifique</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#home" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Início</a>
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Recursos</a>
            <a href="#benefits" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Benefícios</a>
            <a href="#about" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Sobre</a>
          </nav>

          <div className="hidden md:block">
            <button 
              onClick={() => setView('login')}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-blue-700 transition-all shadow-md active:scale-95"
            >
              Acessar Plataforma
            </button>
          </div>

          <button 
            className="md:hidden p-2 text-slate-600"
            onClick={() => setView('login')}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none opacity-50">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-3xl"></div>
          <div className="absolute top-40 left-0 w-[300px] h-[300px] bg-sky-50/50 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-8 border border-blue-100 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                Plataforma SaaS para gestão de suporte
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold font-display text-slate-900 tracking-tight leading-[1.1] mb-8">
                Centralize tickets, atendimentos e <span className="text-blue-600">comunicação.</span>
              </h1>
              
              <p className="text-xl text-slate-600 leading-relaxed mb-10 max-w-lg">
                A Gestifique ajuda empresas a organizar demandas, acelerar respostas e acompanhar toda a operação de suporte com clareza.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 mb-12">
                <button className="w-full sm:w-auto bg-blue-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95 flex items-center justify-center gap-2">
                  Começar agora <ChevronRight size={20} />
                </button>
                <button className="w-full sm:w-auto bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-full font-bold text-lg hover:bg-slate-50 transition-all active:scale-95">
                  Ver demonstração
                </button>
              </div>

              <div className="grid grid-cols-3 gap-8 pt-8 border-t border-slate-100">
                <div>
                    <div className="text-3xl font-bold text-slate-900">96%</div>
                    <div className="text-sm font-medium text-slate-400">SLA Cumprido</div>
                </div>
                <div>
                    <div className="text-3xl font-bold text-slate-900">4min</div>
                    <div className="text-sm font-medium text-slate-400">Tempo Médio</div>
                </div>
                <div>
                    <div className="text-3xl font-bold text-slate-900">24/7</div>
                    <div className="text-sm font-medium text-slate-400">Operação Ativa</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative"
            >
              <div className="floating">
                <DashboardMockup />
              </div>
              
              {/* Floating accents */}
              <div className="absolute -top-10 -right-10 bg-white p-4 rounded-2xl shadow-premium border border-slate-100 hidden xl:block">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                    <UserCheck size={20} />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-bold uppercase">Resolvido</div>
                    <div className="text-lg font-bold text-slate-800">+12.5%</div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-10 -left-10 bg-white p-5 rounded-2xl shadow-premium border border-slate-100 hidden xl:block">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-bold uppercase">Crescimento</div>
                    <div className="text-lg font-bold text-slate-800">R$ 48.2k</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* --- HOW IT WORKS --- */}
      <section className="py-24" id="features">
        <div className="container mx-auto px-6">
          <SectionTitle 
            badge="Processo"
            title="Como a Gestifique transforma sua operação"
            subtitle="Simplicidade técnica e eficiência operacional em três passos fundamentais."
          />

          <div className="grid md:grid-cols-3 gap-12 text-center">
            {[
              { step: '01', icon: <MessageSquare size={32} />, title: 'Receba chamados', desc: 'Centralize e-mails, chat e formulários em uma única interface.' },
              { step: '02', icon: <Zap size={32} />, title: 'Organize prioridades', desc: 'Distribuição inteligente baseada em urgência e habilidades do time.' },
              { step: '03', icon: <CheckCircle2 size={32} />, title: 'Resolva com histórico', desc: 'Acesse todo o histórico do cliente para resoluções assertivas.' }
            ].map((item, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-premium transition-all">
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-8">
                  {item.icon}
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-4">{item.title}</h4>
                <p className="text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section className="py-24 bg-slate-50/50">
        <div className="container mx-auto px-6">
          <SectionTitle 
            badge="Recursos Premium"
            title="Tudo o que sua equipe precisa"
            subtitle="Uma plataforma completa desenvolvida com as melhores práticas de UX SaaS."
          />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
             {[
              { icon: Ticket, title: 'Gestão de Tickets', desc: 'Controle absoluto sobre cada chamado, com estados e prioridades claras.' },
              { icon: Users, title: 'Comunicação Interna', desc: 'Notas internas e colaboração entre times para resolver problemas complexos.' },
              { icon: UserCheck, title: 'Atendimento ao Cliente', desc: 'Link de acompanhamento e portal exclusivo para seus clientes.' },
              { icon: LayoutDashboard, title: 'Dashboard Inteligente', desc: 'Métricas cruciais como SLA e tempo de resposta em tempo real.' },
              { icon: Cpu, title: 'Automação Inteligente', desc: 'Regras de negócio que automatizam tarefas repetitivas do dia a dia.' },
              { icon: ShieldCheck, title: 'Relatórios Executivos', desc: 'Visão completa da saúde da sua operação para tomada de decisão.' }
            ].map((feature, i) => (
              <motion.div 
                key={i} 
                whileHover={{ scale: 1.02 }}
                className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm"
              >
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon size={24} />
                </div>
                <h5 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h5>
                <p className="text-slate-500 leading-relaxed text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- BEFORE / AFTER --- */}
      <section className="py-24" id="benefits">
        <div className="container mx-auto px-6">
          <SectionTitle 
            title="Dê adeus ao caos organizacional"
          />
          <div className="grid md:grid-cols-2 gap-10">
            <div className="bg-slate-100 rounded-3xl p-10">
                <h4 className="text-xl font-bold text-slate-800 mb-8 border-b border-slate-200 pb-4">Antes da Gestifique</h4>
                <ul className="space-y-4">
                    {['Tickets espalhados', 'Respostas lentas', 'Falta de histórico', 'Equipes desalinhadas'].map(t => (
                        <li key={t} className="flex items-center gap-3 text-slate-500">
                            <X size={18} className="text-red-400" /> {t}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="bg-blue-600 rounded-3xl p-10 text-white shadow-2xl">
                <h4 className="text-xl font-bold mb-8 border-b border-blue-400 pb-4">Com a Gestifique</h4>
                <ul className="space-y-4">
                    {['Atendimento centralizado', 'Comunicação rastreável', 'Prioridades claras', 'Operação organizada'].map(t => (
                        <li key={t} className="flex items-center gap-3">
                            <CheckCircle2 size={18} className="text-blue-200" /> {t}
                        </li>
                    ))}
                </ul>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOR WHOM --- */}
      <section className="py-24 bg-slate-900 text-white" id="about">
        <div className="container mx-auto px-6">
            <SectionTitle 
                title="Para quem é a plataforma?"
                subtitle="Diferentes benefícios para todos os envolvidos no processo de suporte."
                center={true}
            />
            <div className="grid md:grid-cols-3 gap-8">
                {[
                    { label: 'Empresas', desc: 'Organização operacional e controle total das métricas da empresa.' },
                    { label: 'Funcionários', desc: 'Produtividade e clareza sobre o que deve ser feito a cada minuto.' },
                    { label: 'Clientes', desc: 'Respostas rápidas e transparência total sobre suas solicitações.' }
                ].map((item, i) => (
                    <div key={i} className="bg-white/5 p-10 rounded-3xl border border-white/10">
                        <div className="text-blue-500 mb-4"><Users /></div>
                        <h5 className="text-xl font-bold mb-4">{item.label}</h5>
                        <p className="text-slate-400">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* --- CTA --- */}
      <section className="py-32">
        <div className="container mx-auto px-6 text-center">
            <div className="bg-blue-600 rounded-[50px] py-20 px-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                <h2 className="text-4xl md:text-5xl font-bold mb-8">Pronto para organizar seu atendimento?</h2>
                <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
                    Centralize tickets, mensagens e indicadores em uma plataforma pensada para empresas que querem crescer.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button className="bg-white text-blue-600 px-10 py-4 rounded-full font-bold text-lg hover:bg-slate-100 transition-all">
                        Começar agora
                    </button>
                    <button className="border border-white text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition-all">
                        Agendar demo
                    </button>
                </div>
            </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-20 bg-white border-t border-slate-100">
        <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
                <div>
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                            <span className="text font-bold font-display">G</span>
                        </div>
                        <span className="text-xl font-bold font-display tracking-tight text-slate-800">Gestifique</span>
                    </div>
                    <p className="text-slate-500 max-w-xs">Organizando a comunicação empresarial com tecnologia premium.</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-12 md:gap-24">
                    <div>
                        <h6 className="font-bold mb-4">Plataforma</h6>
                        <ul className="text-slate-500 space-y-2">
                            <li>Recursos</li>
                            <li>Preços</li>
                            <li>Empresas</li>
                        </ul>
                    </div>
                    <div>
                        <h6 className="font-bold mb-4">Suporte</h6>
                        <ul className="text-slate-500 space-y-2">
                            <li>Ajuda</li>
                            <li>Contato</li>
                            <li>Segurança</li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className="pt-12 border-t border-slate-100 flex justify-between items-center text-sm text-slate-400">
                <span>© 2026 Gestifique. Todos os direitos reservados.</span>
            </div>
        </div>
      </footer>
    </div>
  );
}
