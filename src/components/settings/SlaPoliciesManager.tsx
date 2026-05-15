import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { api } from '../../lib/api';

export const SlaPoliciesManager = ({ currentCompanyId }: { currentCompanyId: number }) => {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentCompanyId) {
      api.get(`/companies/${currentCompanyId}/sla-policies`).then(res => {
         setPolicies((res as any).data || res);
         setLoading(false);
      }).catch(err => {
         console.error('Error loading SLAs', err);
         setLoading(false);
      });
    }
  }, [currentCompanyId]);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Políticas de SLA</h3>
          <p className="text-xs text-slate-500">Configure prazos de resolução por prioridade.</p>
        </div>
        <Button size="sm" variant="outline" className="text-xs h-7" disabled>
          <Plus size={14} className="mr-1" /> Nova política
        </Button>
      </div>

      {loading ? (
        <div className="text-xs text-slate-500">Carregando...</div>
      ) : policies.length === 0 ? (
        <div className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-lg text-center border border-slate-100">
          Nenhuma política configurada. Utilizando SLA padrão do sistema (Urgente: 4h, Alta: 12h, Média: 24h, Baixa: 48h).
        </div>
      ) : (
        <div className="space-y-2">
          {policies.map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg bg-slate-50">
               <div>
                 <div className="text-sm font-medium">{p.nome}</div>
                 <div className="text-[11px] text-slate-500">Prioridade: {p.prioridade || 'Todas'} • {p.tempo_resolucao_minutos / 60}h para resolver</div>
               </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
