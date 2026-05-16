import React, { useState, useEffect } from 'react';
import { PortalTab } from './PortalLayout';
import { Card } from '../ui/Card';
import { Ticket, PlusCircle, Search, Clock, CheckCircle2, ArrowRight, BookOpen, FileText, HelpCircle } from 'lucide-react';
import { api } from '../../lib/api';

interface PortalHomePageProps {
  onNavigate: (tab: PortalTab, ticketId?: number) => void;
}

export const PortalHomePage = ({ onNavigate }: PortalHomePageProps) => {
  const [stats, setStats] = useState({ open: 0, pending: 0, closed: 0 });
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [popularArticles, setPopularArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [ticketsData, knowledgeData] = await Promise.all([
          api.get<any[]>('/portal/tickets?limit=5'),
          api.get<any[]>('/portal/knowledge')
        ]);
        
        setRecentTickets(ticketsData);
        setPopularArticles(knowledgeData.slice(0, 4));
        
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
      {/* Hero Section */}
      <div className="text-center md:text-left p-6 md:p-10 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 mb-2">
            Como podemos te ajudar hoje?
          </h1>
          <p className="text-slate-500 text-sm mb-6">
            Busque em nossa base de conhecimento ou abra um novo chamado.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={() => onNavigate('new-ticket')}
              className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-md flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <PlusCircle size={18} /> Novo Chamado
            </button>
            <button 
              onClick={() => onNavigate('knowledge')}
              className="h-10 px-5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-md flex items-center justify-center gap-2 transition-colors"
            >
              <Search size={18} /> Base de Conhecimento
            </button>
          </div>
        </div>
        
        <div className="hidden lg:block relative opacity-80">
           <div className="w-48 h-48 bg-blue-50/50 rounded-full flex items-center justify-center">
              <HelpCircle size={80} className="text-blue-100" />
           </div>
        </div>
      </div>

      {/* Knowledge Base Teaser */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Consulta Rápida</h2>
          <button 
            onClick={() => onNavigate('knowledge')}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
          >
            Ver base completa <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />
            ))
          ) : popularArticles.length > 0 ? (
            popularArticles.map(article => (
              <button
                key={article.id}
                onClick={() => onNavigate('knowledge')} 
                className="text-left bg-white border border-slate-200 hover:border-blue-300 hover:shadow-sm p-4 rounded-xl transition-all group flex flex-col h-full"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center mb-3 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <FileText size={16} />
                </div>
                <h3 className="font-semibold text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight mb-1">{article.titulo}</h3>
                <p className="text-xs text-slate-500 mt-auto truncate">{article.categoria || 'Geral'}</p>
              </button>
            ))
          ) : (
            <div className="col-span-full py-8 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-xl text-slate-500 text-sm">
              Nenhum artigo disponível no momento.
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 flex items-center gap-4 border-slate-200">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight text-slate-900 leading-none mb-1">{stats.open}</div>
            <div className="text-xs font-semibold text-slate-500 uppercase">Em Andamento</div>
          </div>
        </Card>
        
        <Card className="p-6 flex items-center gap-4 border-slate-200">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <Ticket size={24} />
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight text-slate-900 leading-none mb-1">{stats.pending}</div>
            <div className="text-xs font-semibold text-slate-500 uppercase">Aguardando Você</div>
          </div>
        </Card>
        
        <Card className="p-6 flex items-center gap-4 border-slate-200">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight text-slate-900 leading-none mb-1">{stats.closed}</div>
            <div className="text-xs font-semibold text-slate-500 uppercase">Finalizados</div>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Seus chamados recentes</h2>
          <button 
            onClick={() => onNavigate('tickets')}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
          >
            Ver histórico completo <ArrowRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-3">
             {Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
             ))}
          </div>
        ) : recentTickets.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {recentTickets.map(ticket => (
              <button
                key={ticket.id}
                onClick={() => onNavigate('tickets', ticket.id)}
                className="text-left w-full bg-white border border-slate-200 hover:border-blue-300 hover:shadow-sm rounded-xl p-4 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 font-semibold text-sm group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    #{ticket.id}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-0.5">{ticket.titulo}</h3>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                       <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-medium">{ticket.categoria || 'Geral'}</span>
                       <span>•</span>
                       <span>Atualizado em {new Date(ticket.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="text-slate-300 group-hover:text-blue-500 transition-colors bg-white">
                  <ArrowRight size={20} />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-500 text-sm">
            Você ainda não possui nenhum chamado aberto.
          </div>
        )}
      </div>
    </div>
  );
};
