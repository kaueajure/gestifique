import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  Loader2,
  Shield,
  Search,
  Check,
  Ban,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { api } from "../../lib/api";
import { AccessProfile } from "../../types";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { cn } from "../../lib/utils";

interface PermissionCatalogItem {
  key: string;
  modulo: string;
  grupo: string;
  nome: string;
  descricao: string | null;
  nivel_risk: "baixo" | "medio" | "alto" | "critico";
}

interface ProfileMatrix {
  profile: AccessProfile;
  permissions: string[];
  catalog: PermissionCatalogItem[];
}

interface AccessProfilePermissionsModalProps {
  profileId: number;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const AccessProfilePermissionsModal = ({
  profileId,
  isOpen,
  onClose,
  onSaved,
}: AccessProfilePermissionsModalProps) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [matrix, setMatrix] = useState<ProfileMatrix | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchMatrix = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<ProfileMatrix>(
        `/access-profiles/${profileId}/matrix`,
      );
      setMatrix(data);
      setSelected(new Set(data.permissions));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar permissões.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && profileId) {
      setSearchQuery("");
      setActiveTab("all");
      setSuccess(null);
      fetchMatrix();
    }
  }, [isOpen, profileId]);

  const modulos = useMemo(() => {
    if (!matrix) return [];
    return Array.from(new Set(matrix.catalog.map((item) => item.modulo))).sort();
  }, [matrix]);

  const filteredCatalog = useMemo(() => {
    if (!matrix) return [];
    return matrix.catalog.filter((item) => {
      if (activeTab !== "all" && item.modulo !== activeTab) return false;
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        item.nome.toLowerCase().includes(query) ||
        item.key.toLowerCase().includes(query) ||
        (item.descricao || "").toLowerCase().includes(query) ||
        item.grupo.toLowerCase().includes(query)
      );
    });
  }, [matrix, activeTab, searchQuery]);

  const grouped = useMemo(() => {
    const groups: Record<string, Record<string, PermissionCatalogItem[]>> = {};
    filteredCatalog.forEach((item) => {
      if (!groups[item.modulo]) groups[item.modulo] = {};
      if (!groups[item.modulo][item.grupo]) groups[item.modulo][item.grupo] = [];
      groups[item.modulo][item.grupo].push(item);
    });
    return groups;
  }, [filteredCatalog]);

  const togglePermission = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleModule = (keys: string[], allow: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      keys.forEach((key) => {
        if (allow) next.add(key);
        else next.delete(key);
      });
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api.patch(`/access-profiles/${profileId}`, {
        permissions: Array.from(selected),
      });
      setSuccess("Permissões do perfil salvas com sucesso.");
      onSaved?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao salvar permissões.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
              <Shield size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Permissões do Perfil
              </h3>
              <p className="text-xs text-slate-500">
                {matrix?.profile.nome || "Carregando..."} — alterações afetam
                todos os usuários vinculados.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            <div className="w-52 border-r border-slate-100 bg-slate-50/50 p-4 space-y-4 overflow-y-auto">
              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-3 top-2.5 text-slate-400"
                />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full h-8 bg-white border border-slate-200 rounded-lg pl-8 pr-3 text-xs outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab("all")}
                  className={cn(
                    "w-full text-left px-3 py-2 text-xs font-semibold rounded-lg",
                    activeTab === "all"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-600 hover:bg-slate-100",
                  )}
                >
                  Todos
                </button>
                {modulos.map((mod) => (
                  <button
                    key={mod}
                    onClick={() => setActiveTab(mod)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-xs font-semibold rounded-lg truncate",
                      activeTab === mod
                        ? "bg-indigo-50 text-indigo-800 border border-indigo-100"
                        : "text-slate-600 hover:bg-slate-100",
                    )}
                  >
                    {mod}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/20">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-xs flex items-center gap-2">
                  <AlertTriangle size={14} />
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700 text-xs flex items-center gap-2">
                  <CheckCircle2 size={14} />
                  {success}
                </div>
              )}

              {Object.keys(grouped).length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500">
                  Nenhuma permissão encontrada.
                </div>
              ) : (
                Object.entries(grouped).map(([modulo, grupos]) => {
                  const moduleKeys = matrix?.catalog
                    .filter((i) => i.modulo === modulo)
                    .map((i) => i.key) || [];

                  return (
                    <div
                      key={modulo}
                      className="bg-white border border-slate-100 rounded-xl p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                          {modulo}
                        </h4>
                        <div className="flex gap-1">
                          <button
                            onClick={() => toggleModule(moduleKeys, true)}
                            className="h-6 px-2 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100"
                          >
                            Permitir todos
                          </button>
                          <button
                            onClick={() => toggleModule(moduleKeys, false)}
                            className="h-6 px-2 text-[10px] font-bold rounded-md bg-red-50 text-red-700 border border-red-100"
                          >
                            Remover todos
                          </button>
                        </div>
                      </div>

                      {Object.entries(grupos).map(([grupo, items]) => (
                        <div key={grupo} className="space-y-2">
                          <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
                            {grupo}
                          </h5>
                          <div className="grid gap-2">
                            {items.map((item) => {
                              const isAllowed = selected.has(item.key);
                              return (
                                <button
                                  key={item.key}
                                  type="button"
                                  onClick={() => togglePermission(item.key)}
                                  className={cn(
                                    "w-full text-left border rounded-lg p-3 flex items-start gap-3 transition-all",
                                    isAllowed
                                      ? "border-emerald-100 bg-emerald-50/30"
                                      : "border-slate-150 bg-white hover:bg-slate-50",
                                  )}
                                >
                                  <div
                                    className={cn(
                                      "w-7 h-7 rounded-md flex items-center justify-center border flex-shrink-0",
                                      isAllowed
                                        ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                                        : "bg-slate-100 border-slate-200 text-slate-400",
                                    )}
                                  >
                                    {isAllowed ? (
                                      <Check size={14} />
                                    ) : (
                                      <Ban size={12} />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs font-semibold text-slate-800">
                                        {item.nome}
                                      </span>
                                      <Badge
                                        variant="slate"
                                        className="text-[9px] font-mono border-none"
                                      >
                                        {item.key}
                                      </Badge>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                      {item.descricao || "Sem descrição."}
                                    </p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white">
          <span className="text-xs text-slate-500">
            {selected.size} permissão(ões) ativa(s)
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Fechar
            </Button>
            <Button size="sm" loading={saving} onClick={handleSave}>
              Salvar Permissões
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
