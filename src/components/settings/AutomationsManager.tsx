import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Select } from '../ui/Select';
import { Plus, Zap, Edit2, Trash2, X, PlusCircle, AlertCircle, Info, ChevronRight } from 'lucide-react';
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

const STATUS_OPTIONS = [
  { value: 'aberto', label: 'Aberto' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'aguardando_cliente', label: 'Aguardando Cliente' },
  { value: 'resolvido', label: 'Resolvido' },
  { value: 'fechado', label: 'Fechado' },
];

const PRIORITY_OPTIONS = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Média' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' },
];

const GATILHOS = [
  { value: 'ticket_criado', label: 'Ticket Criado' },
  { value: 'status_alterado', label: 'Status Alterado' },
  { value: 'prioridade_alterada', label: 'Prioridade Alterada' },
  { value: 'responsavel_alterado', label: 'Responsável Alterado' },
  { value: 'ticket_atualizado', label: 'Ticket Atualizado' },
  { value: 'sla_primeira_resposta_vencido', label: 'SLA 1ª Resposta Vencido' },
  { value: 'sla_resolucao_vencido', label: 'SLA Resolução Vencido' },
  { value: 'tempo_sem_interacao', label: 'Tempo sem Interação' },
  { value: 'aguardando_cliente_por_tempo', label: 'Aguardando Cliente por Tempo' },
];

const CONDICAO_CAMPOS = [
  { value: 'status', label: 'Status' },
  { value: 'prioridade', label: 'Prioridade' },
  { value: 'categoria', label: 'Categoria' },
  { value: 'servico', label: 'Serviço' },
  { value: 'origem', label: 'Origem' },
  { value: 'responsavel_definido', label: 'Responsável Definido' },
  { value: 'tag', label: 'Tag' },
  { value: 'horas_desde_criacao', label: 'Horas desde Criação' },
  { value: 'horas_desde_atualizacao', label: 'Horas desde Atualização' },
  { value: 'sla_resolucao_vencido', label: 'SLA Resolução Vencido' },
];

const ACAO_TIPOS = [
  { value: 'alterar_status', label: 'Alterar Status' },
  { value: 'alterar_prioridade', label: 'Alterar Prioridade' },
  { value: 'atribuir_responsavel', label: 'Atribuir Responsável' },
  { value: 'remover_responsavel', label: 'Remover Responsável' },
  { value: 'adicionar_tag', label: 'Adicionar Tag' },
  { value: 'adicionar_comentario', label: 'Adicionar Comentário Interno' },
  { value: 'notificar_responsavel', label: 'Notificar Responsável' },
  { value: 'fechar_com_motivo', label: 'Fechar Chamado com Motivo' },
];

export const AutomationsManager = ({ currentCompanyId }: { currentCompanyId: number }) => {
  const [automations, setAutomations] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
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
      Promise.all([
        api.get(`/automations/company/${currentCompanyId}`),
        api.get(`/usuarios/empresa/${currentCompanyId}`)
      ]).then(([autoRes, userRes]) => {
         setAutomations((autoRes as any).data || autoRes);
         const allUsers = (userRes as any).data || userRes;
         setAgents(allUsers.filter((u: any) => u.atendente || u.administrador));
      }).catch(err => {
         console.error('Error fetching data', err);
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
      setCondicoes(parseJsonArray(item.condicoes_json));
      setAcoes(parseJsonArray(item.acoes_json));
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
    if (acoes.length === 0) {
      setError('Pelo menos uma ação é obrigatória.');
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
    // Reset defaults if field changes
    if (key === 'campo') {
       if (value === 'responsavel_definido') newConds[index].valor = 'true';
       else if (value.includes('horas')) newConds[index].valor = '24';
       else newConds[index].valor = '';
    }
    setCondicoes(newConds);
  };
  const removeCondicao = (index: number) => setCondicoes(condicoes.filter((_, i) => i !== index));

  const addAcao = () => setAcoes([...acoes, { tipo: 'alterar_status', valor: '' }]);
  const updateAcao = (index: number, key: string, value: string) => {
    const newAcoes = [...acoes];
    newAcoes[index][key] = value;
    if (key === 'tipo') {
       if (value === 'alterar_status') newAcoes[index].valor = 'aberto';
       else if (value === 'alterar_prioridade') newAcoes[index].valor = 'media';
       else newAcoes[index].valor = '';
    }
    setAcoes(newAcoes);
  };
  const removeAcao = (index: number) => setAcoes(acoes.filter((_, i) => i !== index));

  const getSummary = (item: any) => {
    const cCount = parseJsonArray(item.condicoes_json).length;
    const aCount = parseJsonArray(item.acoes_json).length;
    const trigger = GATILHOS.find(g => g.value === item.evento)?.label || item.evento;
    return `Quando "${trigger}", se atender ${cCount} condições, executar ${aCount} ações.`;
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Zap size={16} className="text-yellow-500" /> Automações Avançadas
          </h3>
          <p className="text-xs text-slate-500 mt-1">Configure o motor de regras automáticas do Gestifique.</p>
        </div>
        <Button size="sm" onClick={() => handleOpenModal()} className="h-8 text-xs bg-slate-900 text-white hover:bg-slate-800 shrink-0">
          <Plus size={14} className="mr-1" /> Criar nova regra
        </Button>
      </div>

      {loading ? (
        <div className="text-xs text-slate-500 p-4">Carregando engine de automações...</div>
      ) : automations.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
             <Zap size={24} className="text-slate-300" />
          </div>
          <div className="text-sm font-bold text-slate-600">Nenhuma automação ativa</div>
          <div className="text-xs text-slate-400 max-w-[250px] text-center mt-2 leading-relaxed">
            Automatize priorização, atribuição e encerramento de chamados baseados em eventos ou tempo.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {automations.map(a => (
            <div key={a.id} className="group p-4 border border-slate-200 rounded-lg bg-white flex flex-col sm:flex-row justify-between gap-4 hover:border-blue-200 hover:shadow-md transition-all">
               <div className="flex-1">
                 <div className="flex items-center gap-2 mb-1">
                   <h4 className="text-sm font-bold text-slate-800">{a.nome}</h4>
                   {a.ativo ? (
                     <Badge variant="emerald" className="text-[9px] uppercase tracking-wider h-4">Ativa</Badge>
                   ) : (
                     <Badge variant="slate" className="text-[9px] uppercase tracking-wider h-4">Inativa</Badge>
                   )}
                 </div>
                 <p className="text-[11px] text-slate-500 mb-2 line-clamp-1">{a.descricao || 'Sem descrição'}</p>
                 <div className="flex items-center gap-2 text-[10px] bg-slate-50 p-2 rounded border border-slate-100 group-hover:bg-blue-50/30 group-hover:border-blue-100 transition-colors">
                    <span className="font-bold text-slate-500 uppercase">Regra:</span>
                    <span className="text-slate-600 font-medium">{getSummary(a)}</span>
                 </div>
               </div>
               <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Button variant="outline" size="sm" className="h-8 px-3 border-slate-200 shadow-sm" onClick={() => handleOpenModal(a)}>
                    <Edit2 size={13} className="mr-1" /> Editar
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 px-3 text-red-600 border-slate-200 hover:bg-red-50 hover:border-red-200 shadow-sm" onClick={() => handleDelete(a.id)}>
                    <Trash2 size={13} />
                  </Button>
               </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl relative flex flex-col max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
                    <Zap size={18} />
                 </div>
                 <div>
                    <h3 className="font-bold text-slate-800 text-sm">
                      {editingItem ? 'Editar Automação' : 'Configurar Nova Automação'}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sprint 5: Automação 2.0</p>
                 </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-semibold rounded-lg flex items-center gap-2">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              {/* Informações Básicas */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                   <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                   <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Identidade</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-8 space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Título Amigável *</label>
                    <Input 
                      value={nome} 
                      onChange={e => setNome(e.target.value)} 
                      placeholder="Ex: Auto-fechamento tickets inativos" 
                      className="text-sm font-medium h-9"
                    />
                  </div>
                  <div className="sm:col-span-4 space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Prioridade de Execução</label>
                    <Input 
                      type="number" 
                      value={ordem} 
                      onChange={e => setOrdem(e.target.value)} 
                      className="text-sm font-medium h-9"
                      placeholder="0"
                    />
                  </div>
                  <div className="sm:col-span-12 space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Descrição Funcional</label>
                    <Input 
                      value={descricao} 
                      onChange={e => setDescricao(e.target.value)} 
                      placeholder="Descreva o propósito desta regra para outros administradores" 
                      className="text-sm font-medium h-9"
                    />
                  </div>
                </div>
              </section>

              {/* Gatilho */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                   <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
                   <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Gatilho (Trigger)</h4>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Quando este evento ocorrer:</label>
                  <Select 
                    value={evento} 
                    onChange={setEvento}
                    options={GATILHOS}
                   />
                </div>
              </section>

              {/* Condições */}
              <section className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                   <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Condições de Aplicabilidade (Filtros)</h4>
                   </div>
                   <Button variant="ghost" size="sm" onClick={addCondicao} className="h-7 text-[10px] font-bold text-blue-600 hover:bg-blue-50">
                     <PlusCircle size={14} className="mr-1.5" /> Adicionar Filtro
                   </Button>
                </div>
                
                {condicoes.length === 0 ? (
                  <div className="p-6 border-2 border-dashed border-slate-100 rounded-xl flex flex-col items-center justify-center text-center bg-slate-50/50">
                    <Info size={20} className="text-slate-300 mb-2" />
                    <p className="text-xs text-slate-400 font-medium max-w-[300px]">
                      Sem filtros. A automação será aplicada a <span className="font-bold text-slate-500">todos os chamados</span> que dispararem o gatilho.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {condicoes.map((cond, i) => (
                      <div key={i} className="group relative flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 border border-slate-200 rounded-xl bg-white hover:border-blue-200 hover:bg-blue-50/10 transition-all">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                          <select 
                            className="h-9 text-xs border border-slate-200 rounded-lg px-3 outline-none font-bold text-slate-700"
                            value={cond.campo}
                            onChange={e => updateCondicao(i, 'campo', e.target.value)}
                          >
                            {CONDICAO_CAMPOS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                          </select>

                          {/* Operador depends on type of field */}
                          {['status', 'prioridade', 'categoria', 'servico', 'origem', 'responsavel_definido'].includes(cond.campo) ? (
                            <select 
                              className="h-9 text-xs border border-slate-200 rounded-lg px-3 outline-none font-bold text-slate-600"
                              value={cond.operador}
                              onChange={e => updateCondicao(i, 'operador', e.target.value)}
                            >
                              <option value="igual">É igual a</option>
                              <option value="diferente">É diferente de</option>
                              {['categoria', 'servico', 'tag'].includes(cond.campo) && <option value="contem">Contém</option>}
                            </select>
                          ) : (
                            <div className="h-9 flex items-center px-3 text-xs bg-slate-100 rounded-lg text-slate-500 font-bold uppercase tracking-wider">
                                {cond.campo === 'sla_resolucao_vencido' ? 'Sempre' : 'For maior que'}
                            </div>
                          )}

                          {/* Value Input depends on field */}
                          {cond.campo === 'status' ? (
                            <select 
                              className="h-9 text-xs border border-slate-200 rounded-lg px-3 outline-none font-medium"
                              value={cond.valor}
                              onChange={e => updateCondicao(i, 'valor', e.target.value)}
                            >
                              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                          ) : cond.campo === 'prioridade' ? (
                            <select 
                              className="h-9 text-xs border border-slate-200 rounded-lg px-3 outline-none font-medium"
                              value={cond.valor}
                              onChange={e => updateCondicao(i, 'valor', e.target.value)}
                            >
                              {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                          ) : cond.campo === 'responsavel_definido' ? (
                            <select 
                              className="h-9 text-xs border border-slate-200 rounded-lg px-3 outline-none font-medium"
                              value={cond.valor}
                              onChange={e => updateCondicao(i, 'valor', e.target.value)}
                            >
                              <option value="true">Sim (Definido)</option>
                              <option value="false">Não (Vazio)</option>
                            </select>
                          ) : cond.campo === 'sla_resolucao_vencido' ? (
                             <div className="h-9 flex items-center px-3 text-xs text-slate-400 font-medium">Auto-avaliado</div>
                          ) : (
                            <Input 
                              type={cond.campo.includes('horas') ? 'number' : 'text'} 
                              className="h-9 text-xs font-medium"
                              placeholder={cond.campo.includes('horas') ? 'Ex: 24' : 'Valor'}
                              value={cond.valor}
                              onChange={e => updateCondicao(i, 'valor', e.target.value)}
                            />
                          )}
                        </div>
                        <button 
                          onClick={() => removeCondicao(i)} 
                          className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg hover:bg-white transition-colors"
                        >
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Ações */}
              <section className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                   <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Execução das Ações</h4>
                   </div>
                   <Button variant="ghost" size="sm" onClick={addAcao} className="h-7 text-[10px] font-bold text-orange-600 hover:bg-orange-50">
                     <PlusCircle size={14} className="mr-1.5" /> Adicionar Ação
                   </Button>
                </div>
                
                {acoes.length === 0 ? (
                  <div className="p-6 border-2 border-dashed border-red-100 rounded-xl flex flex-col items-center justify-center text-center bg-red-50/30">
                    <AlertCircle size={20} className="text-red-300 mb-2" />
                    <p className="text-xs text-red-500 font-bold uppercase tracking-wide">
                      Atenção: Regra sem efeito
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-[250px]">
                      Você deve configurar pelo menos uma ação para que a regra automatize qualquer tarefa.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {acoes.map((acao, i) => (
                      <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 border border-slate-200 rounded-xl bg-white hover:border-orange-200 hover:bg-orange-50/10 transition-all">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                          <select 
                            className="h-9 text-xs border border-slate-200 rounded-lg px-3 outline-none font-bold text-slate-700"
                            value={acao.tipo}
                            onChange={e => updateAcao(i, 'tipo', e.target.value)}
                          >
                            {ACAO_TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>

                          {/* Value for action */}
                          {acao.tipo === 'alterar_status' ? (
                             <select 
                               className="h-9 text-xs border border-slate-200 rounded-lg px-3 outline-none font-medium"
                               value={acao.valor}
                               onChange={e => updateAcao(i, 'valor', e.target.value)}
                             >
                               {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                             </select>
                          ) : acao.tipo === 'alterar_prioridade' ? (
                             <select 
                               className="h-9 text-xs border border-slate-200 rounded-lg px-3 outline-none font-medium"
                               value={acao.valor}
                               onChange={e => updateAcao(i, 'valor', e.target.value)}
                             >
                               {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                             </select>
                          ) : acao.tipo === 'atribuir_responsavel' ? (
                             <select 
                               className="h-9 text-xs border border-slate-200 rounded-lg px-3 outline-none font-medium"
                               value={acao.valor}
                               onChange={e => updateAcao(i, 'valor', String(e.target.value))}
                             >
                               <option value="">Selecionar Atendente</option>
                               {agents.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                             </select>
                          ) : acao.tipo === 'remover_responsavel' || acao.tipo === 'notificar_responsavel' ? (
                             <div className="h-9 flex items-center px-3 text-[10px] text-slate-400 font-black uppercase tracking-widest bg-slate-100 rounded-lg">Ação Automática</div>
                          ) : (
                             <Input 
                               className="h-9 text-xs font-medium"
                               placeholder={acao.tipo === 'adicionar_comentario' ? 'Texto do comentário' : 'Valor'}
                               value={acao.valor}
                               onChange={e => updateAcao(i, 'valor', e.target.value)}
                             />
                          )}
                        </div>
                        <button 
                          onClick={() => removeAcao(i)} 
                          className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg hover:bg-white transition-colors"
                        >
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                 <div className="flex items-center gap-3">
                    <div className={`w-10 h-6 rounded-full p-1 transition-colors ${ativo ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                       <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${ativo ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                    <label htmlFor="ativo" className="text-sm font-bold text-slate-700 cursor-pointer" onClick={() => setAtivo(!ativo)}>
                       {ativo ? 'Automação Ativada' : 'Automação Suspensa'}
                    </label>
                 </div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase">Status Operacional</p>
              </div>

            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/80">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>Descartar Alterações</Button>
              <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800 px-8 shadow-lg shadow-slate-200" onClick={handleSave}>
                 {editingItem ? 'Salvar Regras' : 'Confirmar e Criar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

