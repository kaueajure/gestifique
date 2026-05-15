import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Plus, Zap } from 'lucide-react';
import { api } from '../../lib/api';

export const AutomationsManager = ({ currentCompanyId }: { currentCompanyId: number }) => {
  const [automations, setAutomations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentCompanyId) {
       api.get(`/automations/company/${currentCompanyId}`).then(res => {
         setAutomations((res as any).data || res);
         setLoading(false);
       }).catch(err => {
         console.error('Error fetching automations', err);
         setLoading(false);
       });
    }
  }, [currentCompanyId]);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Automações</h3>
          <p className="text-xs text-slate-500">Crie regras e gatilhos para executar ações automáticas nos tickets.</p>
        </div>
        <Button size="sm" variant="outline" className="text-xs h-7" disabled>
          <Plus size={14} className="mr-1" /> Nova automação
        </Button>
      </div>

      {loading ? (
        <div className="text-xs text-slate-500">Carregando...</div>
      ) : automations.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Zap size={24} className="text-slate-300 mb-2" />
          <div className="text-sm font-medium text-slate-600">Sem automações</div>
          <div className="text-xs text-slate-400 max-w-[200px] text-center mt-1">Crie sua primeira automação para agilizar os atendimentos.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {automations.map(a => (
            <div key={a.id} className="p-3 border border-slate-100 rounded-lg bg-slate-50 text-sm">
               {a.nome}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
