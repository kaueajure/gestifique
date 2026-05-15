import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Badge } from '../ui/Badge';
import { Search, Loader2, Ticket } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PortalTicketsPageProps {
  onSelectTicket: (id: number) => void;
}

export const PortalTicketsPage = ({ onSelectTicket }: PortalTicketsPageProps) => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const data = await api.get<any[]>('/portal/tickets');
        setTickets(data);
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  const getStatusBadge = (status: string) => {
    const badges: Record<string, React.ReactNode> = {
      aberto: <Badge variant="blue">Aberto</Badge>,
      em_andamento: <Badge variant="amber">Em Andamento</Badge>,
      aguardando_cliente: <Badge variant="indigo">Aguardando Você</Badge>,
      resolvido: <Badge variant="emerald">Resolvido</Badge>,
      fechado: <Badge variant="slate">Fechado</Badge>
    };
    return badges[status] || <Badge variant="slate">{status}</Badge>;
  };

  const filteredTickets = tickets.filter(t => 
    t.titulo.toLowerCase().includes(search.toLowerCase()) || 
    String(t.id).includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Meus Chamados</h1>
        
        <div className="w-full sm:w-72 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Buscar chamado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:font-normal"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-slate-300" size={32} />
        </div>
      ) : filteredTickets.length > 0 ? (
        <div className="bg-white border text-center md:text-left border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase">ID</th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Assunto</th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Atualização</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.map(ticket => (
                  <tr 
                    key={ticket.id} 
                    onClick={() => onSelectTicket(ticket.id)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-400 group-hover:text-slate-900">#{ticket.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{ticket.titulo}</div>
                      <div className="text-xs font-medium text-slate-500 mt-1">{ticket.categoria || 'Sem categoria'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(ticket.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-500">
                      {format(new Date(ticket.updated_at), "dd MMM, HH:mm", { locale: ptBR })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-500 shadow-sm flex flex-col items-center justify-center">
          <Ticket size={48} className="text-slate-200 mb-4" />
          Nenhum chamado encontrado.
        </div>
      )}
    </div>
  );
};
