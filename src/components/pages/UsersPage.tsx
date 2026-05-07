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
  AlertCircle,
  Key,
  UserPlus
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { cn } from '../../lib/utils';

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
      if (permissionFilter !== 'todos') query.append('permission', permissionFilter);

      const [usersData, companiesData] = await Promise.all([
        api.get<User[]>(`/users?${query.toString()}`),
        currentUser.desenvolvedor ? api.get<Empresa[]>('/companies') : Promise.resolve([])
      ]);
      setUsers(usersData);
      setCompanies(companiesData);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, permissionFilter]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleSaveUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoadingSave(true);
    setSaveError(null);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const payload: any = {
        ...data,
        administrador: formData.get('administrador') === 'true',
        desenvolvedor: formData.get('desenvolvedor') === 'true',
      };

      if (!selectedUser?.id && (payload.password as string || '').length < 8) {
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
    } catch (err: any) {
      setSaveError(err.message || 'Erro ao salvar usuário.');
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
    } catch (err: any) {
      setSaveError(err.message || 'Erro ao alterar senha.');
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
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Time Gestifique</h2>
          <p className="text-sm text-slate-500 font-medium tracking-tight">Gerencie cargos, permissões e acesso dos colaboradores.</p>
        </div>
        <Button size="sm" className="h-9" onClick={() => { setSelectedUser(null); setSaveError(null); setIsModalOpen(true); }}>
          <Plus size={16} className="mr-2" /> Novo Usuário
        </Button>
      </div>

      <Card className="p-3">
        <div className="flex flex-col lg:flex-row gap-2">
          <div className="relative flex-1 group">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={14} />
             <input 
               type="text" 
               placeholder="Buscar por nome ou e-mail..." 
               className="w-full h-8 bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-100 transition-all font-sans"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          <div className="grid grid-cols-3 lg:flex items-center gap-2">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
            >
              <option value="todos">Status</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
            </select>
            <select 
              value={permissionFilter}
              onChange={(e) => setPermissionFilter(e.target.value)}
              className="h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
            >
              <option value="todos">Permissões</option>
              <option value="usuario">Usuários</option>
              <option value="administrador">Admins</option>
              <option value="desenvolvedor">Devs</option>
            </select>
          </div>
        </div>
      </Card>

      {successMsg && (
        <div className="p-2 px-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          {successMsg}
        </div>
      )}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-3">
             <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
             <p className="text-xs text-slate-500 font-bold tracking-tight uppercase">Carregando...</p>
          </div>
        ) : users.length === 0 ? (
           <div className="p-20 text-center flex flex-col items-center">
             <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mb-4">
                <UsersIcon size={24} />
             </div>
             <h3 className="text-sm font-semibold text-slate-900">Nenhum usuário encontrado</h3>
             <p className="text-xs text-slate-500 max-w-xs mx-auto mb-6">Crie um novo usuário ou ajuste os filtros.</p>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Usuário</th>
                  <th className="px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cargo / Empresa</th>
                  <th className="px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => {
                  const isDev = !!user.desenvolvedor;
                  const canManage = currentUser.desenvolvedor || (!isDev);
                  
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border shadow-sm transition-colors",
                            user.ativo ? "bg-slate-900 text-white border-slate-950" : "bg-slate-50 text-slate-400 border-slate-100"
                          )}>
                            {user.nome.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 leading-tight truncate">{user.nome}</div>
                            <div className="text-[10px] font-medium text-slate-400 truncate">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                         <div className="text-xs font-semibold text-slate-700">{user.cargo || 'Membro'}</div>
                         <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Building2 size={10} className="text-slate-300" /> {user.empresa_nome || 'Gestifique Master'}
                         </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {user.administrador && <Badge variant="blue" className="text-[9px] py-0 px-1.5 font-bold uppercase">Admin</Badge>}
                          {user.desenvolvedor && <Badge variant="indigo" className="text-[9px] py-0 px-1.5 font-bold uppercase">Dev</Badge>}
                          <Badge variant={user.ativo ? 'emerald' : 'slate'} className={cn("text-[9px] py-0 px-1.5 font-bold uppercase", !user.ativo && "bg-slate-100 text-slate-400 border-slate-100")}>
                            {user.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                         <div className="flex items-center justify-end gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
                            {canManage ? (
                              <>
                                <Button 
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => { setSelectedUser(user); setSaveError(null); setIsPasswordModalOpen(true); }}
                                  className="h-7 w-7 text-slate-400 hover:text-amber-600"
                                  title="Alterar Senha"
                                >
                                   <Key size={14} />
                                </Button>
                                <Button 
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => { setSelectedUser(user); setSaveError(null); setIsModalOpen(true); }}
                                  className="h-7 w-7 text-slate-400 hover:text-blue-600"
                                  title="Editar Dados"
                                >
                                   <Edit2 size={14} />
                                </Button>
                                <Button 
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => { setSelectedUser(user); setIsStatusConfirmOpen(true); }}
                                  className={cn(
                                    "h-7 w-7",
                                    user.ativo ? "text-slate-400 hover:text-red-600" : "text-slate-400 hover:text-emerald-600"
                                  )}
                                  title={user.ativo ? 'Desativar' : 'Ativar'}
                                >
                                   {user.ativo ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                                </Button>
                              </>
                            ) : (
                              <div className="w-7 h-7 flex items-center justify-center text-slate-200" title="Sem permissão">
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
        title={selectedUser ? 'Editar Usuário' : 'Novo Usuário do Time'}
        size="lg"
      >
        <form onSubmit={handleSaveUser} className="space-y-5">
           {saveError && (
             <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs font-semibold mb-4">
                {saveError}
             </div>
           )}
           <div className="grid md:grid-cols-2 gap-4">
              <Input 
                label="Nome Completo"
                name="nome" 
                defaultValue={selectedUser?.nome} 
                required 
                placeholder="Ex: João Silva"
              />
              <Input 
                label="E-mail de Acesso"
                name="email" 
                type="email" 
                defaultValue={selectedUser?.email} 
                required 
                disabled={!!selectedUser}
                placeholder="joao@gestifique.com"
              />
           </div>

           <div className="grid md:grid-cols-2 gap-4">
              <Input 
                label="Cargo"
                name="cargo" 
                defaultValue={selectedUser?.cargo || ''} 
                placeholder="Ex: Gerente de Suporte"
              />
              <Input 
                label="Telefone"
                name="telefone" 
                defaultValue={selectedUser?.telefone || ''} 
                placeholder="(00) 00000-0000"
              />
           </div>

           {currentUser.desenvolvedor && (
             <div className="space-y-1.5 flex flex-col">
               <label className="text-sm font-medium text-slate-700">Empresa Associada</label>
               <select 
                 name="empresa_id" 
                 defaultValue={selectedUser?.empresa_id || ''}
                 className="h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none cursor-pointer"
               >
                 <option value="">Gestifique Central</option>
                 {companies.map(c => (
                   <option key={c.id} value={c.id}>{c.nome}</option>
                 ))}
               </select>
               <p className="text-[11px] text-slate-500 px-1">Usuários comuns acessam apenas os tickets da sua empresa.</p>
             </div>
           )}

           {!selectedUser && (
             <Input 
               label="Senha Inicial"
               name="password" 
               type="password" 
               required 
               placeholder="••••••••"
             />
           )}

           <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-900 mb-3 ml-1 uppercase tracking-wider">Permissões do Sistema</h4>
              <div className="grid md:grid-cols-2 gap-3">
                 <label className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-all group">
                    <input 
                      type="checkbox" 
                      name="administrador" 
                      value="true" 
                      defaultChecked={selectedUser?.administrador}
                      className="mt-1 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-100" 
                    />
                    <div>
                       <div className="text-sm font-semibold text-slate-950">Administrador</div>
                       <div className="text-[11px] text-slate-500">Pode gerenciar usuários, empresas e relatórios do dashboard.</div>
                    </div>
                 </label>
                 {currentUser.desenvolvedor && (
                   <label className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-all">
                      <input 
                        type="checkbox" 
                        name="desenvolvedor" 
                        value="true" 
                        defaultChecked={selectedUser?.desenvolvedor}
                        className="mt-1 w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-100" 
                      />
                      <div>
                         <div className="text-sm font-semibold text-slate-950">Desenvolvedor</div>
                         <div className="text-[11px] text-slate-500">Acesso total ao núcleo do sistema e logs técnicos.</div>
                      </div>
                   </label>
                 )}
              </div>
           </div>

           <div className="pt-4 flex justify-end gap-2">
              <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" loading={loadingSave}>
                {selectedUser ? 'Atualizar Dados' : 'Convidar Usuário'}
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
        <form onSubmit={handleUpdatePassword} className="space-y-4">
           {saveError && (
             <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs font-semibold mb-4">
                {saveError}
             </div>
           )}
           <p className="text-xs text-slate-500 px-1">
              Alterando a senha de acesso para <span className="font-semibold text-slate-900">{selectedUser?.nome}</span>.
           </p>
           
           <Input 
             label="Nova Senha"
             name="password" 
             type="password" 
             required 
             placeholder="••••••••"
           />
           
           <Input 
             label="Confirmar Nova Senha"
             name="confirm_password" 
             type="password" 
             required 
             placeholder="••••••••"
           />

           <div className="pt-4 flex justify-end gap-2">
              <Button variant="ghost" type="button" onClick={() => setIsPasswordModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" loading={loadingSave} className="bg-amber-600 hover:bg-amber-700 border-amber-600">
                Alterar Senha
              </Button>
           </div>
        </form>
      </Modal>

      <ConfirmDialog 
        isOpen={isStatusConfirmOpen}
        onClose={() => setIsStatusConfirmOpen(false)}
        onConfirm={toggleUserStatus}
        title={selectedUser?.ativo ? 'Desativar Usuário' : 'Ativar Usuário'}
        description={`Tem certeza que deseja ${selectedUser?.ativo ? 'desativar' : 'ativar'} o acesso de ${selectedUser?.nome}?`}
        confirmLabel={selectedUser?.ativo ? 'Desativar' : 'Ativar'}
        variant={selectedUser?.ativo ? 'danger' : 'info'}
      />
    </div>
  );
};
