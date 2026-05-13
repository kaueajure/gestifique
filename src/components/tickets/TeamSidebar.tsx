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
    <Card className="w-full shrink-0 p-3 bg-white border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Users size={14} className="text-slate-400" />
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Membros da Equipe</h3>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-4">
          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-red-500 text-[10px] text-center border py-2 rounded-lg bg-red-50">{error}</div>
      ) : team.length === 0 ? (
        <div className="text-slate-400 text-[10px] font-bold uppercase tracking-tight text-center border border-dashed py-4 rounded-lg">Vazio</div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
          {team.map((member) => (
             <div key={member.id} className="flex items-center justify-between p-2 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
               <div className="min-w-0">
                 <p className="text-[11px] font-bold text-slate-800 truncate">{member.nome}</p>
                 <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight truncate w-28">{member.cargo || 'Agente'}</p>
               </div>
               <div className="flex flex-col items-end shrink-0">
                 <div className="text-[10px] font-black text-blue-600">
                   {member.ticket_count || 0}
                 </div>
                 <div className="text-[8px] font-bold uppercase text-slate-400 leading-none">Tickets</div>
               </div>
             </div>
          ))}
        </div>
      )}
    </Card>
  );
};
