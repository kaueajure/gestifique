import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { User, Empresa } from '../../types';
import { 
  Users as UsersIcon, 
  Plus, 
  Search, 
  Shield, 
  Building2, 
  Mail, 
  Calendar, 
  MoreVertical,
  CheckCircle2,
  XCircle,
  Edit2,
  Loader2,
  AlertCircle,
  Lock,
  Phone,
  Key
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
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
      const payload = {
        ...data,
        administrador: formData.get('administrador') === 'true',
        desenvolvedor: formData.get('desenvolvedor') === 'true',
      };

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
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Time Gestifique</h2>
          <p className="text-slate-500 font-medium text-lg">Gerencie cargos, permissões e acesso dos colaboradores.</p>
        </div>
        <button 
          onClick={() => { setSelectedUser(null); setSaveError(null); setIsModalOpen(true); }}
          className="h-14 px-10 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-3 w-full md:w-auto justify-center"
        >
          <Plus size={24} /> Convidar Usuário
        </button>
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 group w-full">
           <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
           <input 
            type="text" 
            placeholder="Buscar por nome ou e-mail..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-14 bg-slate-50 border-none rounded-2xl pl-14 pr-6 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all" 
           />
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-[20px] w-full lg:w-auto">
           <button 
            onClick={() => setStatusFilter('todos')}
            className={cn(
              "h-11 px-6 rounded-[14px] font-black text-xs transition-all",
              statusFilter === 'todos' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
           >
            Todos
           </button>
           <button 
            onClick={() => setStatusFilter('ativo')}
            className={cn(
              "h-11 px-6 rounded-[14px] font-black text-xs transition-all",
              statusFilter === 'ativo' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
           >
            Ativos
           </button>
           <button 
            onClick={() => setStatusFilter('inativo')}
            className={cn(
              "h-11 px-6 rounded-[14px] font-black text-xs transition-all",
              statusFilter === 'inativo' ? "bg-white text-red-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
           >
            Inativos
           </button>
        </div>
        <select 
          value={permissionFilter}
          onChange={(e) => setPermissionFilter(e.target.value)}
          className="h-14 px-6 bg-slate-100 border-none rounded-2xl text-xs font-black text-slate-600 outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer w-full lg:w-auto appearance-none"
        >
           <option value="todos">Todas Permissões</option>
           <option value="usuario">Apenas Usuários</option>
           <option value="administrador">Apenas Admins</option>
           <option value="desenvolvedor">Apenas Devs</option>
        </select>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600 text-sm font-bold shadow-sm animate-in fade-in slide-in-from-top-2">
          {successMsg}
        </div>
      )}

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden font-medium">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-4">
             <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
             <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Carregando Colaboradores...</p>
          </div>
        ) : error ? (
           <div className="p-20 text-center flex flex-col items-center">
             <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
             <p className="text-slate-500">{error}</p>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 tracking-widest uppercase">Usuário</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 tracking-widest uppercase">Cargo / Empresa</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 tracking-widest uppercase">Permissões</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 tracking-widest uppercase text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((user) => {
                  const isDev = !!user.desenvolvedor;
                  const canManage = currentUser.desenvolvedor || (!isDev);
                  
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base transition-transform group-hover:scale-110 shadow-sm",
                            user.ativo ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-400"
                          )}>
                            {user.nome.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-black text-slate-900 leading-tight">{user.nome}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                         <div className="text-sm font-bold text-slate-700">{user.cargo || 'Membro'}</div>
                         <div className="text-[10px] font-bold text-blue-500 uppercase flex items-center gap-1">
                            <Building2 size={10} /> {user.empresa_nome || 'Gestifique Master'}
                         </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-wrap gap-2">
                          {user.administrador && <Badge variant="blue">Admin</Badge>}
                          {user.desenvolvedor && <Badge variant="indigo">Dev</Badge>}
                          <Badge variant={user.ativo ? 'emerald' : 'red'}>{user.ativo ? 'Ativo' : 'Inativo'}</Badge>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <div className="flex items-center justify-end gap-2">
                            {canManage ? (
                              <>
                                <button 
                                  onClick={() => { setSelectedUser(user); setSaveError(null); setIsPasswordModalOpen(true); }}
                                  className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-white hover:text-amber-600 rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-100"
                                  title="Alterar Senha"
                                >
                                   <Key size={16} />
                                </button>
                                <button 
                                  onClick={() => { setSelectedUser(user); setSaveError(null); setIsModalOpen(true); }}
                                  className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-white hover:text-blue-600 rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-100"
                                  title="Editar Dados"
                                >
                                   <Edit2 size={16} />
                                </button>
                                <button 
                                  onClick={() => { setSelectedUser(user); setIsStatusConfirmOpen(true); }}
                                  className={cn(
                                    "w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-100",
                                    user.ativo ? "text-red-400 hover:bg-white hover:text-red-600" : "text-emerald-400 hover:bg-white hover:text-emerald-600"
                                  )}
                                  title={user.ativo ? 'Desativar' : 'Ativar'}
                                >
                                   {user.ativo ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                                </button>
                              </>
                            ) : (
                              <div className="w-10 h-10 flex items-center justify-center text-slate-300" title="Sem permissão para editar usuários desenvolvedores">
                                <Shield size={16} />
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
      </div>

      {/* User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedUser ? 'Editar Usuário' : 'Novo Usuário do Time'}
        size="lg"
      >
        <form onSubmit={handleSaveUser} className="space-y-6">
           {saveError && (
             <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold mb-4">
                {saveError}
             </div>
           )}
           <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nome Completo</label>
                <input 
                  name="nome" 
                  defaultValue={selectedUser?.nome} 
                  required 
                  className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">E-mail de Acesso</label>
                <input 
                  name="email" 
                  type="email" 
                  defaultValue={selectedUser?.email} 
                  required 
                  className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all outline-none disabled:opacity-50"
                  disabled={!!selectedUser}
                />
              </div>
           </div>

               <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Cargo</label>
                    <input 
                      name="cargo" 
                      defaultValue={selectedUser?.cargo || ''} 
                      className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all outline-none" 
                      placeholder="Ex: Gerente de Suporte"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Telefone</label>
                    <input 
                      name="telefone" 
                      defaultValue={selectedUser?.telefone || ''} 
                      className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all outline-none" 
                      placeholder="(00) 00000-0000"
                    />
                  </div>
               </div>

               <div className="grid md:grid-cols-2 gap-6">
               {currentUser.desenvolvedor && (
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Empresa</label>
                   <select 
                     name="empresa_id" 
                     defaultValue={selectedUser?.empresa_id || ''}
                     className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all outline-none appearance-none"
                   >
                     <option value="">Gestifique Central</option>
                     {companies.map(c => (
                       <option key={c.id} value={c.id}>{c.nome}</option>
                     ))}
                   </select>
                 </div>
               )}
               </div>

           {!selectedUser && (
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Senha Inicial</label>
                <input 
                  name="password" 
                  type="password" 
                  required 
                  className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all outline-none" 
                  placeholder="••••••••"
                />
             </div>
           )}

           <div className="pt-4 border-t border-slate-50">
              <h4 className="text-xs font-black text-slate-800 mb-4">Permissões do Sistema</h4>
              <div className="grid md:grid-cols-2 gap-4">
                 <label className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-blue-50 transition-colors border border-slate-100">
                    <input 
                      type="checkbox" 
                      name="administrador" 
                      value="true" 
                      defaultChecked={selectedUser?.administrador}
                      className="w-5 h-5 rounded-lg text-blue-600 border-slate-200 focus:ring-blue-50" 
                    />
                    <div>
                       <div className="text-sm font-black text-slate-900">Administrador de Atendimento</div>
                       <div className="text-[10px] font-bold text-slate-400 uppercase">Pode gerenciar usuários e relatórios.</div>
                    </div>
                 </label>
                 {currentUser.desenvolvedor && (
                   <label className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-indigo-50 transition-colors border border-slate-100">
                      <input 
                        type="checkbox" 
                        name="desenvolvedor" 
                        value="true" 
                        defaultChecked={selectedUser?.desenvolvedor}
                        className="w-5 h-5 rounded-lg text-indigo-600 border-slate-200 focus:ring-indigo-50" 
                      />
                      <div>
                         <div className="text-sm font-black text-slate-900">Developer (System Admin)</div>
                         <div className="text-[10px] font-bold text-slate-400 uppercase">Acesso total ao núcleo do sistema.</div>
                      </div>
                   </label>
                 )}
              </div>
           </div>

           <div className="pt-6 flex justify-end gap-3 font-black text-sm uppercase tracking-widest">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="h-14 px-8 text-slate-400 hover:text-slate-600"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={loadingSave}
                className="h-14 px-12 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-3"
              >
                {loadingSave ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                {selectedUser ? 'Atualizar Membro' : 'Salvar e Convidar'}
              </button>
           </div>
        </form>
      </Modal>
      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Alterar Senha"
        size="md"
      >
        <form onSubmit={handleUpdatePassword} className="space-y-6">
           {saveError && (
             <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold mb-4">
                {saveError}
             </div>
           )}
           <p className="text-sm font-medium text-slate-500">
              Alterando a senha de acesso para <strong>{selectedUser?.nome}</strong>.
           </p>
           <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nova Senha</label>
              <input 
                name="password" 
                type="password" 
                required 
                className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all outline-none" 
                placeholder="••••••••"
              />
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Confirmar Nova Senha</label>
              <input 
                name="confirm_password" 
                type="password" 
                required 
                className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all outline-none" 
                placeholder="••••••••"
              />
           </div>
           <div className="pt-6 flex justify-end gap-3 font-black text-sm uppercase tracking-widest">
              <button 
                type="button" 
                onClick={() => setIsPasswordModalOpen(false)}
                className="h-14 px-8 text-slate-400 hover:text-slate-600"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={loadingSave}
                className="h-14 px-12 bg-amber-500 text-white rounded-2xl shadow-xl shadow-amber-100 hover:bg-amber-600 disabled:opacity-50 transition-all flex items-center gap-3"
              >
                {loadingSave ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                Alterar Senha
              </button>
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
        cancelLabel="Cancelar"
        variant={selectedUser?.ativo ? 'danger' : 'info'}
      />
    </div>
  );
};
