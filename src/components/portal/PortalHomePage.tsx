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
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center md:text-left py-12 md:py-16 bg-white rounded-[3rem] p-8 md:p-16 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-6 leading-tight lowercase">
            Como podemos te <span className="text-blue-600">ajudar</span> hoje?
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs mb-10">Busque em nossa base de conhecimento ou abra um novo chamado.</p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => onNavigate('new-ticket')}
              className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-100 hover:-translate-y-1"
            >
              <PlusCircle size={20} /> Novo Chamado
            </button>
            <button 
              onClick={() => onNavigate('knowledge')}
              className="h-14 px-8 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-black text-xs uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 transition-all"
            >
              <Search size={20} /> Base de Conhecimento
            </button>
          </div>
        </div>
        
        <div className="hidden lg:block relative">
           <div className="w-64 h-64 bg-blue-50 rounded-full flex items-center justify-center animate-pulse">
              <HelpCircle size={120} className="text-blue-100" />
           </div>
           <div className="absolute -top-4 -right-4 w-12 h-12 bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center text-blue-500 animate-bounce">
              <BookOpen size={24} />
           </div>
           <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center text-emerald-500">
              <CheckCircle2 size={32} />
           </div>
        </div>
      </div>

      {/* Knowledge Base Teaser */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-black text-slate-900 lowercase italic">Antes de abrir um chamado, consulte a base</h2>
          <button 
            onClick={() => onNavigate('knowledge')}
            className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 hover:text-blue-700 flex items-center gap-2"
          >
            Ver base completa <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-slate-100 rounded-[2rem] animate-pulse" />
            ))
          ) : popularArticles.length > 0 ? (
            popularArticles.map(article => (
              <button
                key={article.id}
                onClick={() => onNavigate('knowledge')} // In future versions we could navigate directly to the article
                className="text-left bg-white border border-slate-200 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-50 p-6 rounded-[2rem] transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <FileText size={20} />
                </div>
                <h3 className="font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight mb-2 uppercase text-[10px] tracking-widest">{article.titulo}</h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{article.categoria || 'Geral'}</p>
              </button>
            ))
          ) : (
            <div className="col-span-full py-12 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-bold uppercase tracking-widest text-[10px]">
              Nenhum artigo popular disponível no momento.
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-8 flex flex-col items-center justify-center text-center shadow-sm border-slate-200 rounded-[2.5rem]">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <Clock size={28} />
          </div>
          <div className="text-4xl font-black tracking-tight text-slate-900">{stats.open}</div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">Em Andamento</div>
        </Card>
        
        <Card className="p-8 flex flex-col items-center justify-center text-center shadow-sm border-slate-200 rounded-[2.5rem]">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <Ticket size={28} />
          </div>
          <div className="text-4xl font-black tracking-tight text-slate-900">{stats.pending}</div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">Aguardando Você</div>
        </Card>
        
        <Card className="p-8 flex flex-col items-center justify-center text-center shadow-sm border-slate-200 rounded-[2.5rem]">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <CheckCircle2 size={28} />
          </div>
          <div className="text-4xl font-black tracking-tight text-slate-900">{stats.closed}</div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">Finalizados</div>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-black text-slate-900 lowercase italic">Seus chamados recentes</h2>
          <button 
            onClick={() => onNavigate('tickets')}
            className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 hover:text-blue-700 flex items-center gap-2"
          >
            Ver histórico completo <ArrowRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-3">
             {Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
             ))}
          </div>
        ) : recentTickets.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {recentTickets.map(ticket => (
              <button
                key={ticket.id}
                onClick={() => onNavigate('tickets', ticket.id)}
                className="text-left w-full bg-white border border-slate-200 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-50 rounded-3xl p-6 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 font-black text-xs group-hover:bg-blue-600 group-hover:text-white transition-all">
                    #{ticket.id}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 mb-1 capitalize">{ticket.titulo}</h3>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <span className="px-2 py-0.5 bg-slate-100 rounded-md">{ticket.categoria || 'Geral'}</span>
                       <span>•</span>
                       <span>Atualizado em {new Date(ticket.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all">
                  <ArrowRight size={24} />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] p-16 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
            Você ainda não possui nenhum chamado aberto.
          </div>
        )}
      </div>
    </div>
  );
};
