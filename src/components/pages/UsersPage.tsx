import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { User, Empresa } from '../../types';
import { 
  Users as UsersIcon, 
  Plus, 
  Search, 
  Shield, 
  Building2, 
  CheckCircle2,
  XCircle,
  Edit2,
  Loader2,
  Key
} from 'lucide-react';
import { PageHeader } from '../ui/PageHeader';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Card } from '../ui/Card';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { cn } from '../../lib/utils';

type UserPayload = {
  nome: string;
  email: string;
  password?: string;
  cargo: string;
  telefone: string;
  empresa_id: number | null;
  administrador: boolean;
  desenvolvedor: boolean;
};

interface UsersPageProps {
  currentUser: User;
}

export const UsersPage = ({ currentUser }: UsersPageProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [empresaId, setEmpresaId] = useState<string>('');
  const [loadingSave, setLoadingSave] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [permissionFilter, setPermissionFilter] = useState('todos');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      if (searchTerm) query.append('search', searchTerm);
      if (statusFilter !== 'todos') query.append('status', statusFilter);

      const [usersData, companiesData] = await Promise.all([
        api.get<User[]>(`/users?${query.toString()}`),
        currentUser.desenvolvedor ? api.get<Empresa[]>('/companies?status=ativo') : Promise.resolve([])
      ]);
      setUsers(usersData);
      setCompanies(companiesData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar usuários.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleSaveUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoadingSave(true);
    setSaveError(null);
    const formData = new FormData(e.currentTarget);

    try {
      const payload: UserPayload = {
        nome: String(formData.get('nome') || ''),
        email: String(formData.get('email') || ''),
        cargo: String(formData.get('cargo') || ''),
        telefone: String(formData.get('telefone') || ''),
        empresa_id: formData.get('empresa_id') ? Number(formData.get('empresa_id')) : null,
        administrador: formData.get('administrador') === 'true',
        desenvolvedor: formData.get('desenvolvedor') === 'true',
      };

      const password = formData.get('password') as string;
      if (password) {
        payload.password = password;
      }

      if (!selectedUser?.id && (!payload.password || payload.password.length < 8)) {
        setSaveError('A senha deve ter pelo menos 8 caracteres.');
        setLoadingSave(false);
        return;
      }

      if (selectedUser?.id) {
        await api.patch(`/users/${selectedUser.id}`, payload);
        showSuccess('Usuário atualizado com sucesso!');
      } else {
        await api.post('/users', payload);
        showSuccess('Usuário criado com sucesso!');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar usuário.';
      setSaveError(message);
    } finally {
      setLoadingSave(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUser) return;
    setLoadingSave(true);
    setSaveError(null);
    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirm_password') as string;

    if (password.length < 8) {
      setSaveError('A senha deve ter pelo menos 8 caracteres.');
      setLoadingSave(false);
      return;
    }

    if (password !== confirmPassword) {
      setSaveError('As senhas não coincidem.');
      setLoadingSave(false);
      return;
    }

    try {
      await api.patch(`/users/${selectedUser.id}/password`, { password });
      showSuccess('Senha alterada com sucesso!');
      setIsPasswordModalOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao alterar senha.';
      setSaveError(message);
    } finally {
      setLoadingSave(false);
    }
  };

  const toggleUserStatus = async () => {
    if (!selectedUser) return;
    try {
      await api.patch(`/users/${selectedUser.id}/status`, { ativo: !selectedUser.ativo });
      showSuccess(`Usuário ${!selectedUser.ativo ? 'ativado' : 'desativado'} com sucesso!`);
      fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao alterar status.';
      setError(message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Usuários"
        action={
          <Button size="sm" onClick={() => { setSelectedUser(null); setSaveError(null); setIsModalOpen(true); }} className="font-semibold text-xs h-9">
            <Plus size={14} className="mr-2" /> Novo Usuário
          </Button>
        }
      />

      <Card>
        <div className="p-4 border-b border-slate-50 flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
             <input 
               type="text" 
               placeholder="Buscar usuário..." 
               className="w-full h-9 bg-slate-50 border border-slate-100 rounded-lg pl-9 pr-4 text-xs font-medium text-slate-600 outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400 placeholder:font-normal transition-all"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select 
              size="sm"
              value={statusFilter}
              onChange={setStatusFilter}
              buttonClassName="h-9 text-xs font-semibold"
              options={[
                { value: 'todos', label: 'Todos os Status' },
                { value: 'ativo', label: 'Ativos' },
                { value: 'inativo', label: 'Inativos' }
              ]}
            />
          </div>
        </div>

        {successMsg && (
          <div className="mx-4 mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600 text-xs font-bold animate-in fade-in slide-in-from-top-2">
            {successMsg}
          </div>
        )}

        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-3">
             <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
             <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Carregando usuários...</p>
          </div>
        ) : users.length === 0 ? (
           <div className="p-20 text-center flex flex-col items-center">
             <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mb-4">
                <UsersIcon size={24} />
             </div>
             <h3 className="text-sm font-bold text-slate-900">Nenhum usuário encontrado</h3>
             <p className="text-xs font-medium text-slate-500 max-w-xs mx-auto mt-1">Ajuste os filtros ou crie um novo colaborador.</p>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/30">
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Usuário</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Empresa</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Status / Cargo</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
                {users.map((user) => {
                  const isDev = !!user.desenvolvedor;
                  const canManage = !!currentUser.desenvolvedor || (
                    !!currentUser.administrador && 
                    !isDev && 
                    !!currentUser.empresa_id && 
                    user.empresa_id === currentUser.empresa_id
                  );
                  
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm border",
                            user.ativo 
                              ? "bg-slate-900 text-white border-slate-950" 
                              : "bg-white text-slate-300 border-slate-100"
                          )}>
                            {(user.nome || "U").charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-slate-900 truncate tracking-tight">{user.nome || "Usuário"}</div>
                            <div className="text-[10px] font-bold text-slate-400 truncate tracking-tighter uppercase">{user.email || 'Email não informado'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                         <div className="flex items-center gap-2">
                           <Building2 size={12} className="text-slate-300" />
                           <span className="text-xs font-bold text-slate-600 truncate max-w-[180px]">{user.empresa_nome || 'Gestifique Master'}</span>
                         </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge 
                            variant={user.ativo ? 'emerald' : 'slate'} 
                            className="text-[9px] py-0 px-1.5 font-bold uppercase tracking-tight border-none"
                          >
                            {user.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{user.cargo || 'Membro'}</span>
                          {!!user.administrador && <Badge variant="blue" className="text-[8px] py-0 px-1 font-bold uppercase border-none opacity-80">Admin</Badge>}
                          {!!user.desenvolvedor && <Badge variant="indigo" className="text-[8px] py-0 px-1 font-bold uppercase border-none opacity-80">Dev</Badge>}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                         <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            {canManage ? (
                              <>
                                <button 
                                  onClick={() => { setSelectedUser(user); setSaveError(null); setIsPasswordModalOpen(true); }}
                                  className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-all"
                                  title="Alterar Senha"
                                >
                                   <Key size={14} />
                                </button>
                                <button 
                                  onClick={() => { setSelectedUser(user); setSaveError(null); setIsModalOpen(true); }}
                                  className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all"
                                  title="Editar"
                                >
                                   <Edit2 size={14} />
                                </button>
                                <button 
                                  onClick={() => { setSelectedUser(user); setIsStatusConfirmOpen(true); }}
                                  className={cn(
                                    "h-8 w-8 flex items-center justify-center rounded-lg transition-all",
                                    user.ativo 
                                      ? "text-slate-400 hover:bg-red-50 hover:text-red-500" 
                                      : "text-slate-400 hover:bg-emerald-50 hover:text-emerald-500"
                                  )}
                                  title={user.ativo ? 'Desativar' : 'Ativar'}
                                >
                                   {user.ativo ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                                </button>
                              </>
                            ) : (
                               <div className="w-8 h-8 flex items-center justify-center text-slate-200" title="Sem permissão">
                                  <Shield size={14} />
                               </div>
                            )}
                         </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedUser ? 'Editar Usuário' : 'Novo Usuário'}
        size="lg"
      >
        <form onSubmit={handleSaveUser} className="space-y-6">
           {saveError && (
             <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs font-bold mb-4">
                {saveError}
             </div>
           )}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                 <label className="text-xs font-medium text-slate-500 px-1">Nome Completo</label>
                 <Input 
                   name="nome" 
                   defaultValue={selectedUser?.nome} 
                   required 
                   placeholder="Ex: João Silva"
                   className="h-10 bg-slate-50/50 border-slate-100 font-bold text-xs"
                 />
              </div>
              <div className="space-y-1.5">
                 <label className="text-xs font-medium text-slate-500 px-1">E-mail</label>
                 <Input 
                   name="email" 
                   type="email" 
                   defaultValue={selectedUser?.email} 
                   required 
                   disabled={!!selectedUser}
                   placeholder="joao@exemplo.com"
                   className="h-10 bg-slate-50/50 border-slate-100 font-bold text-xs"
                 />
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                 <label className="text-xs font-medium text-slate-500 px-1">Cargo</label>
                 <Input 
                   name="cargo" 
                   defaultValue={selectedUser?.cargo || ''} 
                   placeholder="Ex: Analista de Suporte"
                   className="h-10 bg-slate-50/50 border-slate-100 font-bold text-xs"
                 />
              </div>
              <div className="space-y-1.5">
                 <label className="text-xs font-medium text-slate-500 px-1">Telefone</label>
                 <Input 
                   name="telefone" 
                   defaultValue={selectedUser?.telefone || ''} 
                   placeholder="(00) 00000-0000"
                   className="h-10 bg-slate-50/50 border-slate-100 font-bold text-xs"
                 />
              </div>
           </div>

           {!!currentUser.desenvolvedor ? (
              <div className="space-y-1.5">
                 <label className="text-xs font-medium text-slate-500 px-1">Empresa</label>
                 <Select
                   name="empresa_id"
                   value={selectedUser?.empresa_id ? String(selectedUser.empresa_id) : empresaId}
                   onChange={setEmpresaId}
                   disabled={!!selectedUser}
                   placeholder="Gestifique Central"
                   options={[
                     { value: '', label: 'Gestifique Central' },
                     ...companies.map(c => ({
                       value: String(c.id),
                       label: c.nome
                     }))
                   ]}
                 />
              </div>
           ) : !!currentUser.empresa_id && (
              <div className="space-y-1.5">
                 <label className="text-xs font-medium text-slate-500 px-1">Empresa</label>
                 <div className="h-10 bg-slate-50/50 border border-slate-100 rounded-lg px-3 flex items-center text-xs font-bold text-slate-400 select-none">
                    {currentUser.empresa_nome || 'Sua Empresa'}
                 </div>
              </div>
           )}

           {!selectedUser && (
              <div className="space-y-1.5">
                 <label className="text-xs font-medium text-slate-500 px-1">Senha Inicial</label>
                 <Input 
                   name="password" 
                   type="password" 
                   required 
                   placeholder="Mínimo 8 caracteres"
                   className="h-10 bg-slate-50/50 border-slate-100 font-bold text-xs"
                 />
              </div>
           )}

           <div className="pt-4 border-t border-slate-50">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Permissões de Acesso</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 <label className={cn(
                   "flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer group",
                   "bg-white hover:border-blue-200 hover:bg-blue-50/30 border-slate-100"
                 )}>
                    <input 
                      type="checkbox" 
                      name="administrador" 
                      value="true" 
                      defaultChecked={selectedUser?.administrador}
                      className="mt-1 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-100" 
                    />
                    <div className="min-w-0">
                       <div className="text-xs font-bold text-slate-900 uppercase tracking-tight">Administrador</div>
                       <div className="text-[10px] font-medium text-slate-400 mt-0.5 leading-tight">Pode gerenciar usuários da própria empresa e acompanhar registros permitidos.</div>
                    </div>
                 </label>
                 {!!currentUser.desenvolvedor && (
                   <label className={cn(
                     "flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer group",
                     "bg-white hover:border-indigo-200 hover:bg-indigo-50/30 border-slate-100"
                   )}>
                      <input 
                        type="checkbox" 
                        name="desenvolvedor" 
                        value="true" 
                        defaultChecked={selectedUser?.desenvolvedor}
                        className="mt-1 w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-100" 
                      />
                      <div className="min-w-0">
                         <div className="text-xs font-bold text-slate-900 uppercase tracking-tight">Desenvolvedor</div>
                         <div className="text-[10px] font-medium text-slate-400 mt-0.5 leading-tight">Acesso total ao sistema, logs técnicos e instâncias master.</div>
                      </div>
                   </label>
                 )}
              </div>
           </div>

           <div className="pt-6 flex items-center justify-end gap-3 border-t border-slate-50">
              <Button variant="ghost" size="sm" type="button" onClick={() => setIsModalOpen(false)} className="font-bold text-[10px] uppercase tracking-widest text-slate-400">
                Cancelar
              </Button>
              <Button type="submit" loading={loadingSave} size="sm" className="font-bold text-[10px] uppercase tracking-widest px-6 h-9">
                {selectedUser ? 'Atualizar Dados' : 'Criar Conta'}
              </Button>
           </div>
        </form>
      </Modal>

      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Alterar Senha"
        size="md"
      >
        <form onSubmit={handleUpdatePassword} className="space-y-5">
           {saveError && (
             <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs font-bold mb-4">
                {saveError}
             </div>
           )}
           <p className="text-[11px] font-medium text-slate-500 leading-relaxed px-1">
              Defina uma nova senha de acesso para <b>{selectedUser?.nome || 'este usuário'}</b>. Recomendamos o uso de caracteres especiais e números.
           </p>
           
           <div className="space-y-4">
             <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 px-1">Nova Senha</label>
                <Input 
                  name="password" 
                  type="password" 
                  required 
                  placeholder="Mínimo 8 caracteres"
                  className="h-10 bg-slate-50/50 border-slate-100 font-bold text-xs"
                />
             </div>
             <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 px-1">Confirmar Senha</label>
                <Input 
                  name="confirm_password" 
                  type="password" 
                  required 
                  placeholder="Confirme a nova senha"
                  className="h-10 bg-slate-50/50 border-slate-100 font-bold text-xs"
                />
             </div>
           </div>

           <div className="pt-6 flex justify-end gap-3">
              <Button variant="ghost" size="sm" type="button" onClick={() => setIsPasswordModalOpen(false)} className="font-bold text-[10px] uppercase tracking-widest text-slate-400">
                Cancelar
              </Button>
              <Button type="submit" loading={loadingSave} size="sm" className="bg-amber-600 hover:bg-amber-700 font-bold text-[10px] uppercase tracking-widest h-9 px-6 border-none">
                Confirmar Alteração
              </Button>
           </div>
        </form>
      </Modal>

      <ConfirmDialog 
        isOpen={isStatusConfirmOpen}
        onClose={() => setIsStatusConfirmOpen(false)}
        onConfirm={toggleUserStatus}
        title={selectedUser?.ativo ? 'Desativar Usuário?' : 'Ativar Usuário?'}
        description={`Ao ${selectedUser?.ativo ? 'desativar' : 'ativar'}, o colaborador ${selectedUser?.nome || 'selecionado'} ${selectedUser?.ativo ? 'perderá' : 'recuperará'} o acesso imediato ao sistema.`}
        confirmLabel={selectedUser?.ativo ? 'Desativar' : 'Ativar'}
        variant={selectedUser?.ativo ? 'danger' : 'info'}
      />
    </div>
  );
};
