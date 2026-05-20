import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { 
  Shield, 
  X, 
  Loader2, 
  Check, 
  Ban, 
  RotateCcw,
  AlertTriangle,
  HelpCircle,
  Eye,
  Settings
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';

interface PermissionCatalogItem {
  key: string;
  modulo: string;
  grupo: string;
  nome: string;
  descricao: string | null;
  nivel_risk: 'baixo' | 'medio' | 'alto' | 'critico';
  ativo: boolean;
  ordem: number;
}

interface UserPermissionMatrix {
  user: {
    id: number;
    nome: string;
    email: string;
    perfil: string;
    administrador: boolean;
    desenvolvedor: boolean;
  };
  rolePermissions: string[];
  overrides: Array<{ permission_key: string; effect: 'allow' | 'deny'; motivo?: string }>;
  effectivePermissions: string[];
  catalog: PermissionCatalogItem[];
}

interface PermissionUserModalProps {
  userId: number;
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
}

export const PermissionUserModal = ({ userId, isOpen, onClose, currentUser }: PermissionUserModalProps) => {
  const [loading, setLoading] = useState(true);
  const [matrix, setMatrix] = useState<UserPermissionMatrix | null>(null);
  const [reason, setReason] = useState<string>('');
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');

  const fetchMatrix = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const resp = await api.get<any>(`/permissions/users/${userId}`);
      if (resp && resp.user) {
        setMatrix(resp);
      } else {
        setActionError('Erro ao carregar os dados de permissão.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Falha ao buscar matriz de permissões.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      fetchMatrix();
      setReason('');
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const handleOverride = async (key: string, effect: 'allow' | 'deny') => {
    setActionError(null);
    setSavingKey(key);
    try {
      await api.put(`/permissions/users/${userId}/override`, {
        permission_key: key,
        effect,
        motivo: reason
      });
      setReason('');
      await fetchMatrix();
    } catch (err: any) {
      setActionError(err.message || 'Falha ao salvar permissão personalizada.');
    } finally {
      setSavingKey(null);
    }
  };

  const handleResetOverride = async (key: string) => {
    setActionError(null);
    setSavingKey(key);
    try {
      await api.delete(`/permissions/users/${userId}/override/${key}`);
      await fetchMatrix();
    } catch (err: any) {
      setActionError(err.message || 'Falha ao redefinir override.');
    } finally {
      setSavingKey(null);
    }
  };

  const handleResetAll = async () => {
    setActionError(null);
    setLoading(true);
    try {
      await api.post(`/permissions/users/${userId}/reset`, {});
      setReason('');
      await fetchMatrix();
    } catch (err: any) {
      setActionError(err.message || 'Falha ao resetar permissões do usuário.');
    } finally {
      setLoading(false);
    }
  };

  // Group catalog items of matrix by modulo and group
  const getGroupedCatalog = () => {
    if (!matrix) return {};
    const grouped: Record<string, Record<string, PermissionCatalogItem[]>> = {};

    matrix.catalog.forEach(item => {
      if (!grouped[item.modulo]) {
        grouped[item.modulo] = {};
      }
      if (!grouped[item.modulo][item.grupo]) {
        grouped[item.modulo][item.grupo] = [];
      }
      grouped[item.modulo][item.grupo].push(item);
    });

    return grouped;
  };

  const renderRiskBadge = (risk: string) => {
    switch (risk) {
      case 'critico':
        return <Badge variant="red" className="text-[10px] font-semibold border-none">Crítico</Badge>;
      case 'alto':
        return <Badge variant="orange" className="text-[10px] font-semibold border-none">Alto</Badge>;
      case 'medio':
        return <Badge variant="blue" className="text-[10px] font-semibold border-none">Médio</Badge>;
      default:
        return <Badge variant="slate" className="text-[10px] font-semibold border-none">Baixo</Badge>;
    }
  };

  const grouped = getGroupedCatalog();
  const modulos = Object.keys(grouped);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm" onClick={onClose} />

      {/* Container */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-50 border border-indigo-150 rounded-lg flex items-center justify-center text-indigo-600">
              <Shield size={18} />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-slate-900">
                Gerenciador de Permissões
              </h3>
              <p className="text-[11px] text-slate-500">
                Ajuste permissões personalizadas (overrides) finas para usuários específicos
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Content Area */}
        {loading && !matrix ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <span className="text-xs text-slate-500 font-medium">Carregando matriz de permissões...</span>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Action Warnings/Status banner */}
            {matrix && (
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div>
                  <div className="text-[13px] font-semibold text-slate-800">
                    {matrix.user.nome}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>{matrix.user.email}</span>
                    <span className="inline-block w-1 h-1 bg-slate-300 rounded-full" />
                    <span className="font-semibold text-indigo-600 uppercase">Perfil: {matrix.user.perfil}</span>
                  </div>
                </div>

                <div className="flex items-center justify-start md:justify-end gap-2 flex-wrap">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleResetAll}
                    className="text-xs h-8 text-slate-600 border-slate-200"
                    disabled={matrix.overrides.length === 0}
                  >
                    <RotateCcw size={12} className="mr-1.5" />
                    Resetar para Padrão
                  </Button>
                </div>
              </div>
            )}

            {actionError && (
              <div className="mx-5 my-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2.5 text-xs">
                <AlertTriangle size={14} className="flex-shrink-0 text-red-500" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Main scrollable grid panels */}
            <div className="flex-1 flex overflow-hidden">
              
              {/* Tab Selector left column */}
              <div className="w-48 bg-slate-50/50 border-r border-slate-100 p-3 overflow-y-auto space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2.5 mb-2">Módulos</div>
                <button 
                  onClick={() => setActiveTab('all')}
                  className={cn(
                    "w-full text-left px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-2",
                    activeTab === 'all' 
                      ? "bg-slate-100 text-slate-900 font-semibold" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <Settings size={12} />
                  Todos
                </button>
                {modulos.map(mod => (
                  <button 
                    key={mod}
                    onClick={() => setActiveTab(mod)}
                    className={cn(
                      "w-full text-left px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors truncate capitalize flex items-center gap-2",
                      activeTab === mod 
                        ? "bg-slate-100 text-slate-900 font-semibold" 
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                    )}
                  >
                    <div className="w-1.5 h-1.5 bg-indigo-505 bg-indigo-400 rounded-full" />
                    {mod}
                  </button>
                ))}
              </div>

              {/* Items Panel */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                
                {/* Reason override input banner */}
                <div className="bg-amber-50/80 border border-amber-100 rounded-lg p-3 text-xs mb-4">
                  <div className="font-semibold text-amber-900 flex items-center gap-1.5 mb-1.5">
                    <AlertTriangle size={13} className="text-amber-600" />
                    Justificativa Requerida para Auditoria
                  </div>
                  <input 
                    type="text"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Ex: Usuário precisa atuar temporariamente como Gestor do Suporte (necessário para logs)"
                    className="w-full bg-white border border-amber-205 border-amber-200 outline-none rounded px-2.5 py-1.5 text-slate-700 text-xs placeholder-slate-400 focus:border-amber-400"
                  />
                </div>

                {modulos
                  .filter(mod => activeTab === 'all' || activeTab === mod)
                  .map(modulo => (
                    <div key={modulo} className="space-y-4">
                      <div className="border-b border-slate-100 pb-1">
                        <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{modulo}</h4>
                      </div>

                      {Object.keys(grouped[modulo]).map(grupo => {
                        const items = grouped[modulo][grupo];
                        return (
                          <div key={grupo} className="space-y-2 pl-1">
                            <h5 className="text-[11px] font-semibold text-slate-600 pl-1">{grupo}</h5>
                            
                            <div className="grid gap-2">
                              {items.map(item => {
                                const isProfileAllowed = matrix?.rolePermissions.includes(item.key);
                                const override = matrix?.overrides.find(o => o.permission_key === item.key);
                                const isCurrentlyAllowed = matrix?.effectivePermissions.includes(item.key) || matrix?.effectivePermissions.includes('*');
                                const isSuper = !!(matrix?.user.desenvolvedor || matrix?.user.administrador);

                                return (
                                  <div 
                                    key={item.key} 
                                    className={cn(
                                      "border bg-white rounded-lg p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors",
                                      isCurrentlyAllowed ? "border-slate-100" : "border-slate-150 bg-slate-50/20"
                                    )}
                                  >
                                    <div className="space-y-1 min-w-0 flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[12px] font-semibold text-slate-800">{item.nome}</span>
                                        <span className="font-mono text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{item.key}</span>
                                        {renderRiskBadge(item.nivel_risk)}
                                        
                                        {override && (
                                          <Badge variant={override.effect === 'allow' ? 'emerald' : 'red'} className="text-[9px] font-semibold">
                                            Sobrescreveu: {override.effect === 'allow' ? 'Ativado' : 'Bloqueado'}
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-[11px] text-slate-500 max-w-xl leading-relaxed">
                                        {item.descricao || 'Sem descrição cadastrada para esta permissão.'}
                                      </p>
                                      
                                      {override?.motivo && (
                                        <div className="text-[10px] text-amber-700 font-medium bg-amber-50 rounded px-2 py-0.5 inline-block border border-amber-100/50">
                                          Motivo: "{override.motivo}"
                                        </div>
                                      )}
                                    </div>

                                    {/* Override Controls actions */}
                                    <div className="flex items-center gap-1.5 flex-shrink-0 self-end md:self-center">
                                      {savingKey === item.key ? (
                                        <Loader2 className="w-5 h-5 text-indigo-500 animate-spin mr-2" />
                                      ) : isSuper ? (
                                        <div className="text-[11px]" title="Super-usuários possuem wildcard '*' irrestrito">
                                          <Badge className="bg-slate-100 border border-slate-205 text-slate-700 font-medium">Herdado: Acesso Total (*)</Badge>
                                        </div>
                                      ) : (
                                        <>
                                          <button
                                            title="Usar o Padrão do perfil do Usuário"
                                            onClick={() => handleResetOverride(item.key)}
                                            className={cn(
                                              "h-7 px-2 text-[11px] font-medium rounded border transition-all flex items-center gap-1",
                                              !override 
                                                ? "bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed" 
                                                : "bg-white border-slate-250 text-slate-600 hover:bg-slate-50 hover:border-slate-350"
                                            )}
                                            disabled={!override}
                                          >
                                            <RotateCcw size={10} />
                                            Padrão ({isProfileAllowed ? 'Permitido' : 'Bloqueado'})
                                          </button>

                                          <button
                                            title="Ativar esta permissão para este usuário"
                                            onClick={() => handleOverride(item.key, 'allow')}
                                            className={cn(
                                              "h-7 px-2 text-[11px] font-medium rounded border transition-all flex items-center gap-1",
                                              override?.effect === 'allow'
                                                ? "bg-emerald-600 border-emerald-600 text-white font-semibold"
                                                : "bg-white border-slate-250 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                                            )}
                                          >
                                            <Check size={11} />
                                            Ativar
                                          </button>

                                          <button
                                            title="Bloquear/Negar esta permissão para este usuário"
                                            onClick={() => handleOverride(item.key, 'deny')}
                                            className={cn(
                                              "h-7 px-2 text-[11px] font-medium rounded border transition-all flex items-center gap-1",
                                              override?.effect === 'deny'
                                                ? "bg-red-600 border-red-600 text-white font-semibold"
                                                : "bg-white border-slate-250 text-slate-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                                            )}
                                          >
                                            <Ban size={10} />
                                            Bloquear
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
