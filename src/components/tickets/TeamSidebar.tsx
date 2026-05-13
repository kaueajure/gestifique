import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { User } from '../../types';
import { Users, Loader2, AlertCircle } from 'lucide-react';
import { Card } from '../ui/Card';

interface TeamSidebarProps {
  currentUser: User;
  devCompanyId?: string;
}

export const TeamSidebar = ({ currentUser, devCompanyId }: TeamSidebarProps) => {
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        setLoading(true);
        // Passar um parâmetro para trazer as contagens de tickets?
        // Vamos criar um endpoint ou usar o /users com uma query
        const endpoint = devCompanyId ? `/users/team?empresa_id=${devCompanyId}` : `/users/team`;
        const data = await api.get<any[]>(endpoint);
        setTeam(data);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar equipe');
      } finally {
        setLoading(false);
      }
    };
    if (!!currentUser.desenvolvedor && !devCompanyId) {
       setTeam([]);
       setLoading(false);
       return;
    }
    fetchTeam();
  }, [devCompanyId, !!currentUser.desenvolvedor]);

  if (!currentUser.empresa_id && !currentUser.desenvolvedor) return null;

  return (
    <Card className="w-full shrink-0 p-2.5 bg-white border-slate-200 shadow-sm overflow-hidden rounded-lg">
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <Users size={12} className="text-slate-400" />
        <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-500">EQUIPE</h3>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-2">
          <Loader2 className="w-3 h-3 text-blue-600 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-red-500 text-[8px] font-bold text-center border p-1 rounded bg-red-50">{error}</div>
      ) : team.length === 0 ? (
        <div className="text-slate-400 text-[8px] font-black uppercase tracking-tight text-center border border-dashed py-2 rounded-lg">Sem Membros</div>
      ) : (
        <div className="space-y-1 max-h-[300px] overflow-y-auto pr-0.5 custom-scrollbar">
          {team.map((member) => (
             <div key={member.id} className="flex items-center justify-between p-1.5 rounded border border-slate-50 bg-slate-50/30 hover:bg-slate-50 transition-colors group">
               <div className="min-w-0">
                 <p className="text-[10px] font-black text-slate-800 truncate leading-tight uppercase">{member.nome}</p>
                 <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter truncate w-24 leading-none mt-0.5">{member.cargo || 'Agente'}</p>
               </div>
               <div className="flex flex-col items-end shrink-0">
                 <div className="text-[10px] font-black text-blue-600 leading-none">
                   {member.ticket_count || 0}
                 </div>
                 <div className="text-[7px] font-black uppercase text-slate-400 tracking-tighter leading-none mt-0.5">Chamados</div>
               </div>
             </div>
          ))}
        </div>
      )}
    </Card>
  );
};
