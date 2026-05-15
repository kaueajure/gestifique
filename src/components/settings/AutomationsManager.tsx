import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Select } from '../ui/Select';
import { Plus, Zap, Edit2, Trash2, X, PlusCircle, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';

const parseJsonArray = (value: any) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

export const AutomationsManager = ({ currentCompanyId }: { currentCompanyId: number }) => {
  const [automations, setAutomations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Form State
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [evento, setEvento] = useState('ticket_criado');
  const [ativo, setAtivo] = useState(true);
  const [ordem, setOrdem] = useState('0');
  const [condicoes, setCondicoes] = useState<any[]>([]);
  const [acoes, setAcoes] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    if (currentCompanyId) {
      setLoading(true);
      api.get(`/automations/company/${currentCompanyId}`).then(res => {
         setAutomations((res as any).data || res);
      }).catch(err => {
         console.error('Error fetching automations', err);
      }).finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    loadData();
  }, [currentCompanyId]);

  const handleOpenModal = (item?: any) => {
    setError(null);
    if (item) {
      setEditingItem(item);
      setNome(item.nome || '');
      setDescricao(item.descricao || '');
      setEvento(item.evento || 'ticket_criado');
      setAtivo(item.ativo === 1 || item.ativo === true);
      setOrdem(String(item.ordem || 0));
      try {
        setCondicoes(parseJsonArray(item.condicoes_json));
        setAcoes(parseJsonArray(item.acoes_json));
      } catch (e) {
        setCondicoes([]);
        setAcoes([]);
      }
    } else {
      setEditingItem(null);
      setNome('');
      setDescricao('');
      setEvento('ticket_criado');
      setAtivo(true);
      setOrdem('0');
      setCondicoes([]);
      setAcoes([]);
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!nome.trim() || !evento) {
      setError('Nome e evento são obrigatórios.');
      return;
    }
    setError(null);
    try {
      const payload = {
        nome,
        descricao,
        evento,
        ativo: ativo ? 1 : 0,
        ordem: parseInt(ordem) || 0,
        condicoes_json: condicoes,
        acoes_json: acoes
      };

      if (editingItem) {
        await api.patch(`/automations/${editingItem.id}`, payload);
      } else {
        await api.post(`/automations/company/${currentCompanyId}`, payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar automação.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Excluir automação? Essa ação é irreversível.')) return;
    try {
      await api.delete(`/automations/${id}`);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const addCondicao = () => setCondicoes([...condicoes, { campo: 'status', operador: 'igual', valor: '' }]);
  const updateCondicao = (index: number, key: string, value: string) => {
    const newConds = [...condicoes];
    newConds[index][key] = value;
    setCondicoes(newConds);
  };
  const removeCondicao = (index: number) => setCondicoes(condicoes.filter((_, i) => i !== index));

  const addAcao = () => setAcoes([...acoes, { tipo: 'alterar_status', valor: '' }]);
  const updateAcao = (index: number, key: string, value: string) => {
    const newAcoes = [...acoes];
    newAcoes[index][key] = value;
    setAcoes(newAcoes);
  };
  const removeAcao = (index: number) => setAcoes(acoes.filter((_, i) => i !== index));

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Zap size={16} className="text-yellow-500" /> Automações
          </h3>
          <p className="text-xs text-slate-500 mt-1">Crie regras automáticas para seus atendimentos.</p>
        </div>
        <Button size="sm" onClick={() => handleOpenModal()} className="h-8 text-xs bg-slate-900 text-white hover:bg-slate-800 shrink-0">
          <Plus size={14} className="mr-1" /> Nova regra
        </Button>
      </div>

      {loading ? (
        <div className="text-xs text-slate-500 p-4">Carregando...</div>
      ) : automations.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Zap size={24} className="text-slate-300 mb-2" />
          <div className="text-sm font-medium text-slate-600">Sem automações</div>
          <div className="text-xs text-slate-400 max-w-[200px] text-center mt-1">Automatize tarefas repetitivas criando sua primeira regra.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {automations.map(a => (
            <div key={a.id} className="p-4 border border-slate-200 rounded-lg bg-white flex flex-col sm:flex-row justify-between gap-3 shadow-sm hover:shadow-md transition-all">
               <div>
                 <div className="flex items-center gap-2 mb-1">
                   <h4 className="text-sm font-bold text-slate-800">{a.nome}</h4>
                   {a.ativo ? (
                     <Badge variant="emerald" className="text-[9px]">Ativa</Badge>
                   ) : (
                     <Badge variant="slate" className="text-[9px]">Inativa</Badge>
                   )}
                 </div>
                 <div className="text-xs text-slate-500 mb-2 font-medium">Evento: {a.evento}</div>
                 <div className="flex flex-wrap gap-2 text-[10px]">
                   <Badge variant="blue" className="bg-blue-50 text-blue-600 font-semibold">{parseJsonArray(a.condicoes_json).length} Condições</Badge>
                   <Badge variant="orange" className="bg-orange-50 text-orange-600 font-semibold">{parseJsonArray(a.acoes_json).length} Ações</Badge>
                 </div>
               </div>
               <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-8 px-2 border-slate-200" onClick={() => handleOpenModal(a)}>
                    <Edit2 size={14} />
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 px-2 text-red-600 border-slate-200 hover:bg-red-50 hover:border-red-200" onClick={() => handleDelete(a.id)}>
                    <Trash2 size={14} />
                  </Button>
               </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                <Zap size={16} className="text-yellow-500"/>
                {editingItem ? 'Editar Automação' : 'Nova Automação'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-semibold rounded-lg flex items-center gap-2">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              {/* Basic configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Nome da Regra *</label>
                  <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Fechar tickets inativos" className="text-sm" autoFocus />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Descrição</label>
                  <Input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="O que essa regra faz?" className="text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Gatilho (Evento) *</label>
                  <Select 
                    value={evento} 
                    onChange={setEvento}
                    options={[
                      {value: 'ticket_criado', label: 'Ticket foi criado'},
                      {value: 'status_alterado', label: 'Status foi alterado'},
                      {value: 'prioridade_alterada', label: 'Prioridade alterada'},
                      {value: 'responsavel_alterado', label: 'Atendente alterado'},
                      {value: 'ticket_atualizado', label: 'Ticket foi atualizado'},
                      {value: 'sla_vencido', label: 'SLA vencido'}
                    ]}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Ordem de Execução</label>
                  <Input type="number" value={ordem} onChange={e => setOrdem(e.target.value)} placeholder="0" className="text-sm" />
                </div>
              </div>

              {/* Conditions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-700 bg-blue-50 text-blue-700 px-2 py-1 rounded inline-block">Condições (E)</h4>
                  <Button variant="ghost" size="sm" onClick={addCondicao} className="h-6 text-[10px] uppercase font-bold text-blue-600 hover:bg-blue-50">
                    <PlusCircle size={12} className="mr-1" /> Adicionar Condição
                  </Button>
                </div>
                
                {condicoes.length === 0 ? (
                  <div className="text-[11px] text-slate-400 italic p-3 border border-slate-100 border-dashed rounded-lg text-center bg-slate-50/50">
                    Nenhuma condição definida. A regra executará sempre que o evento ocorrer.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {condicoes.map((cond, i) => (
                      <div key={i} className="flex flex-col sm:flex-row items-center gap-2 p-2 border border-slate-200 rounded-lg bg-slate-50">
                        <select 
                          className="w-full sm:w-1/3 h-8 text-xs border border-slate-200 rounded px-2 outline-none"
                          value={cond.campo}
                          onChange={e => updateCondicao(i, 'campo', e.target.value)}
                        >
                          <option value="status">Status</option>
                          <option value="prioridade">Prioridade</option>
                          <option value="categoria">Categoria</option>
                          <option value="servico">Serviço</option>
                          <option value="responsavel">ID do Responsável</option>
                          <option value="origem">Origem</option>
                        </select>
                        <select 
                          className="w-full sm:w-1/4 h-8 text-xs border border-slate-200 rounded px-2 outline-none"
                          value={cond.operador}
                          onChange={e => updateCondicao(i, 'operador', e.target.value)}
                        >
                          <option value="igual">É igual a</option>
                          <option value="diferente">É diferente de</option>
                          <option value="contem">Contém</option>
                        </select>
                        <input 
                          type="text" 
                          className="w-full sm:flex-1 h-8 text-xs border border-slate-200 rounded px-2 outline-none"
                          placeholder="Valor esperado"
                          value={cond.valor}
                          onChange={e => updateCondicao(i, 'valor', e.target.value)}
                        />
                        <button onClick={() => removeCondicao(i)} className="p-1.5 text-slate-400 hover:text-red-500 rounded bg-white border border-slate-200 shrink-0">
                          <X size={12}/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-700 bg-orange-50 text-orange-700 px-2 py-1 rounded inline-block">Ações a Executar</h4>
                  <Button variant="ghost" size="sm" onClick={addAcao} className="h-6 text-[10px] uppercase font-bold text-orange-600 hover:bg-orange-50">
                    <PlusCircle size={12} className="mr-1" /> Adicionar Ação
                  </Button>
                </div>
                
                {acoes.length === 0 ? (
                  <div className="text-[11px] text-slate-400 italic p-3 border border-slate-100 border-dashed rounded-lg text-center bg-slate-50/50">
                    Pelo menos uma ação é obrigatória para que a regra tenha efeito.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {acoes.map((acao, i) => (
                      <div key={i} className="flex flex-col sm:flex-row items-center gap-2 p-2 border border-slate-200 rounded-lg bg-slate-50">
                        <select 
                          className="w-full sm:w-1/2 h-8 text-xs border border-slate-200 rounded px-2 outline-none"
                          value={acao.tipo}
                          onChange={e => updateAcao(i, 'tipo', e.target.value)}
                        >
                          <option value="alterar_status">Alterar Status</option>
                          <option value="alterar_prioridade">Alterar Prioridade</option>
                          <option value="atribuir_responsavel">Atribuir Responsável (ID)</option>
                          <option value="adicionar_tag">Adicionar Tag</option>
                        </select>
                        <input 
                          type="text" 
                          className="w-full sm:flex-1 h-8 text-xs border border-slate-200 rounded px-2 outline-none"
                          placeholder="Novo valor"
                          value={acao.valor}
                          onChange={e => updateAcao(i, 'valor', e.target.value)}
                        />
                        <button onClick={() => removeAcao(i)} className="p-1.5 text-slate-400 hover:text-red-500 rounded bg-white border border-slate-200 shrink-0">
                          <X size={12}/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="ativo"
                  checked={ativo}
                  onChange={e => setAtivo(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="ativo" className="text-sm font-semibold text-slate-700 cursor-pointer">Automação ativa</label>
              </div>

            </div>
            <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700 px-6" onClick={handleSave}>Salvar</Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
