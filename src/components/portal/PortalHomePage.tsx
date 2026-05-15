import React, { useState, useEffect } from 'react';
import { PortalTab } from './PortalLayout';
import { Card } from '../ui/Card';
import { Ticket, PlusCircle, Search, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api';

interface PortalHomePageProps {
  onNavigate: (tab: PortalTab, ticketId?: number) => void;
}

export const PortalHomePage = ({ onNavigate }: PortalHomePageProps) => {
  const [stats, setStats] = useState({ open: 0, pending: 0, closed: 0 });
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [ticketsData] = await Promise.all([
          api.get<any[]>('/portal/tickets?limit=5')
        ]);
        
        setRecentTickets(ticketsData);
        
        const open = ticketsData.filter(t => t.status === 'aberto' || t.status === 'em_andamento').length;
        const pending = ticketsData.filter(t => t.status === 'aguardando_cliente').length;
        const closed = ticketsData.filter(t => t.status === 'resolvido' || t.status === 'fechado').length;
        
        setStats({ open, pending, closed });
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };
    
    fetchHomeData();
  }, []);

  return (
    <div className="space-y-8">
      <div className="text-center md:text-left py-8 md:py-12 bg-white rounded-3xl p-6 md:p-12 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Como podemos te ajudar?</h1>
          <p className="text-slate-500 font-medium">Busque em nossa base de conhecimento ou abra um novo chamado.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button 
            onClick={() => onNavigate('knowledge')}
            className="h-12 px-6 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-sm tracking-wide rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            <Search size={18} /> Base de Conhecimento
          </button>
          
          <button 
            onClick={() => onNavigate('new-ticket')}
            className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm tracking-wide rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm shadow-blue-200"
          >
            <PlusCircle size={18} /> Novo Chamado
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <Clock size={24} />
          </div>
          <div className="text-3xl font-bold tracking-tight text-slate-900">{stats.open}</div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">Em Andamento</div>
        </Card>
        
        <Card className="p-6 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-4">
            <Ticket size={24} />
          </div>
          <div className="text-3xl font-bold tracking-tight text-slate-900">{stats.pending}</div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">Aguardando Você</div>
        </Card>
        
        <Card className="p-6 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 size={24} />
          </div>
          <div className="text-3xl font-bold tracking-tight text-slate-900">{stats.closed}</div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">Finalizados</div>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">Seus Chamados Recentes</h2>
          <button 
            onClick={() => onNavigate('tickets')}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Ver todos <ArrowRight size={16} />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Carregando chamados...</div>
        ) : recentTickets.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {recentTickets.map(ticket => (
              <button
                key={ticket.id}
                onClick={() => onNavigate('tickets', ticket.id)}
                className="text-left w-full bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm rounded-xl p-4 transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-400">#{ticket.id}</span>
                    <span className="font-bold text-slate-900">{ticket.titulo}</span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    {ticket.categoria || 'Sem categoria'} • Última atualização: {new Date(ticket.updated_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all">
                  <ArrowRight size={20} />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-12 text-center text-slate-500">
            Você ainda não possui nenhum chamado aberto.
          </div>
        )}
      </div>
    </div>
  );
};
