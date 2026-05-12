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
    <Card className="w-full lg:w-72 shrink-0 p-4 sticky top-6 self-start">
      <div className="flex items-center gap-2 mb-4">
        <Users size={16} className="text-slate-500" />
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Equipe de Atendimento</h3>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-6">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-red-500 text-xs text-center border py-2 rounded-lg bg-red-50">{error}</div>
      ) : team.length === 0 ? (
        <div className="text-slate-400 text-xs text-center border-y py-4">Nenhum membro encontrado.</div>
      ) : (
        <div className="space-y-3">
          {team.map((member) => (
             <div key={member.id} className="flex items-center justify-between p-2 rounded-lg border border-slate-100 bg-slate-50/50">
               <div>
                 <p className="text-xs font-bold text-slate-800">{member.nome}</p>
                 <p className="text-[10px] text-slate-400 font-medium truncate w-32">{member.cargo || member.email}</p>
               </div>
               <div className="text-[10px] font-bold text-center px-2 py-1 bg-white border border-slate-200 rounded text-slate-600 shadow-sm">
                 {member.ticket_count || 0} tickets
               </div>
             </div>
          ))}
        </div>
      )}
    </Card>
  );
};
