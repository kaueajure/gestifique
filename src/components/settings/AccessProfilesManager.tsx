import React, { useEffect, useState } from "react";
import {
  Plus,
  Shield,
  Edit2,
  Trash2,
  Users,
  Loader2,
  Lock,
} from "lucide-react";
import { api } from "../../lib/api";
import { AccessProfile, User } from "../../types";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { hasPermission } from "../../lib/permissions";
import { AccessProfilePermissionsModal } from "./AccessProfilePermissionsModal";

interface AccessProfilesManagerProps {
  currentUser: User;
}

export const AccessProfilesManager = ({
  currentUser,
}: AccessProfilesManagerProps) => {
  const [profiles, setProfiles] = useState<AccessProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<AccessProfile | null>(
    null,
  );
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [saving, setSaving] = useState(false);
  const [permissionsProfileId, setPermissionsProfileId] = useState<
    number | null
  >(null);
  const [deleteProfile, setDeleteProfile] = useState<AccessProfile | null>(
    null,
  );

  const canManage = hasPermission(currentUser, "usuarios.gerenciar_permissoes");
  const canView = hasPermission(currentUser, "usuarios.ver_permissoes");

  const fetchProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<AccessProfile[]>("/access-profiles");
      setProfiles(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar perfis.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) fetchProfiles();
  }, [canView]);

  const openCreate = () => {
    setEditingProfile(null);
    setNome("");
    setDescricao("");
    setIsFormOpen(true);
  };

  const openEdit = (profile: AccessProfile) => {
    setEditingProfile(profile);
    setNome(profile.nome);
    setDescricao(profile.descricao || "");
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (editingProfile) {
        await api.patch(`/access-profiles/${editingProfile.id}`, {
          nome: nome.trim(),
          descricao: descricao.trim() || null,
        });
        setSuccess("Perfil atualizado com sucesso.");
      } else {
        await api.post("/access-profiles", {
          nome: nome.trim(),
          descricao: descricao.trim() || null,
        });
        setSuccess("Perfil criado com sucesso.");
      }
      setIsFormOpen(false);
      fetchProfiles();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar perfil.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteProfile) return;
    try {
      await api.delete(`/access-profiles/${deleteProfile.id}`);
      setSuccess("Perfil removido com sucesso.");
      setDeleteProfile(null);
      fetchProfiles();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover perfil.");
      setDeleteProfile(null);
    }
  };

  if (!canView) {
    return (
      <Card className="p-8 text-center">
        <Lock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-xs text-slate-500">
          Você não tem permissão para visualizar perfis de acesso.
        </p>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Perfis de Acesso
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Defina cargos com conjuntos de permissões reutilizáveis para sua
              equipe.
            </p>
          </div>
          {canManage && (
            <Button size="sm" onClick={openCreate}>
              <Plus size={14} className="mr-1.5" /> Novo Perfil
            </Button>
          )}
        </div>

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700 text-xs">
            {success}
          </div>
        )}
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-xs">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
          </div>
        ) : profiles.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500">
            Nenhum perfil de acesso cadastrado.
          </div>
        ) : (
          <div className="grid gap-3">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="border border-slate-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:border-slate-200 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-900">
                      {profile.nome}
                    </span>
                    {profile.sistema && (
                      <Badge
                        variant="slate"
                        className="text-[9px] border-none uppercase"
                      >
                        Padrão
                      </Badge>
                    )}
                  </div>
                  {profile.descricao && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {profile.descricao}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Users size={12} /> {profile.usuarios_count || 0}{" "}
                      usuário(s)
                    </span>
                    <span className="flex items-center gap-1">
                      <Shield size={12} /> {profile.permissions_count || 0}{" "}
                      permissão(ões)
                    </span>
                  </div>
                </div>

                {canManage && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPermissionsProfileId(profile.id)}
                      className="h-8 px-3 rounded-lg text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
                    >
                      <Shield size={13} /> Permissões
                    </button>
                    <button
                      onClick={() => openEdit(profile)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                      title="Editar"
                    >
                      <Edit2 size={14} />
                    </button>
                    {!profile.sistema && (
                      <button
                        onClick={() => setDeleteProfile(profile)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingProfile ? "Editar Perfil" : "Novo Perfil de Acesso"}
        size="sm"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Nome</label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              placeholder="Ex: Atendente N1"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">
              Descrição
            </label>
            <Input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Opcional"
              className="h-8 text-xs"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsFormOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" loading={saving}>
              {editingProfile ? "Salvar" : "Criar"}
            </Button>
          </div>
        </form>
      </Modal>

      {permissionsProfileId && (
        <AccessProfilePermissionsModal
          profileId={permissionsProfileId}
          isOpen={!!permissionsProfileId}
          onClose={() => setPermissionsProfileId(null)}
          onSaved={fetchProfiles}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteProfile}
        onClose={() => setDeleteProfile(null)}
        onConfirm={handleDelete}
        title="Excluir perfil de acesso?"
        description={`O perfil "${deleteProfile?.nome}" será arquivado. Só é possível excluir perfis sem usuários vinculados.`}
        confirmLabel="Excluir"
        variant="danger"
      />
    </>
  );
};
