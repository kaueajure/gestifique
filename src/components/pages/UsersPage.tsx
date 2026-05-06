import React, { useState, useEffect } from 'react';
import { User, Empresa } from '../../types';
import { api } from '../../lib/api';
import { Users, Plus, Edit2, Shield, UserX, UserCheck, MoreVertical, Search, Mail, Briefcase } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { cn } from '../../lib/utils';

interface UsersPageProps {
  currentUser: User;
}

export const UsersPage = ({ currentUser }: UsersPageProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Partial<User> | null>(null);
  const [companies, setCompanies] = useState<Empresa[]>([]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.get<User[]>('/users');
      setUsers(data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchUsers();
    if (currentUser.desenvolvedor) {
      api.get<Empresa[]>('/companies').then(setCompanies).catch(console.error);
    }
  }, []);

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
      const payload = {
        ...data,
        is_admin: formData.get('is_admin') === 'true',
        is_dev: formData.get('is_dev') === 'true',
      };

      if (selectedUser?.id) {
        await api.patch(`/users/${selectedUser.id}`, payload);
      } else {
        await api.post('/users', payload);
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (error: any) { alert(error.message); }
  };

  const handleToggleStatus = async (user: User) => {
    if (!confirm(`Tem certeza que deseja ${user.ativo ? 'desativar' : 'ativar'} o usuário ${user.nome}?`)) return;
    try {
      await api.patch(`/users/${user.id}`, { ativo: !user.ativo });
      fetchUsers();
    } catch (error) { console.error(error); }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Equipe Gestifique</h2>
          <p className="text-slate-500 font-medium">Gerencie usuários, permissões e acessos da plataforma.</p>
        </div>
        <button 
          onClick={() => { setSelectedUser(null); setIsModalOpen(true); }}
          className="h-12 px-6 rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-95"
        >
          <Plus size={20} /> Novo Usuário
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 tracking-widest uppercase">Nome / E-mail</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 tracking-widest uppercase">Cargo / Empresa</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 tracking-widest uppercase">Permissões</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 tracking-widest uppercase">Status</th>
                <th className="px-8 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-8 py-6"><div className="w-48 h-4 bg-slate-100 rounded"></div></td>
                    <td className="px-8 py-6"><div className="w-32 h-4 bg-slate-100 rounded"></div></td>
                    <td className="px-8 py-6"><div className="w-24 h-4 bg-slate-100 rounded"></div></td>
                    <td className="px-8 py-6"><div className="w-16 h-4 bg-slate-100 rounded"></div></td>
                    <td className="px-8 py-6"></td>
                  </tr>
                ))
              ) : users.map((user) => (
                <tr key={user.id} className="group hover:bg-slate-50 transition-all">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs uppercase shadow-sm">
                          {user.nome.charAt(0)}
                       </div>
                       <div>
                          <div className="text-sm font-black text-slate-800">{user.nome}</div>
                          <div className="text-[10px] font-bold text-slate-400 lowercase">{user.email}</div>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-xs font-bold text-slate-700">{user.cargo || 'Membro'}</div>
                    <div className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">{user.empresa_nome || 'Gestifique'}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex gap-1 flex-wrap">
                       {user.desenvolvedor && <Badge variant="indigo">Dev</Badge>}
                       {user.administrador && <Badge variant="blue">Admin</Badge>}
                       {!user.administrador && !user.desenvolvedor && <Badge variant="slate">Usuário</Badge>}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <Badge variant={user.ativo ? 'emerald' : 'red'}>{user.ativo ? 'Ativo' : 'Inativo'}</Badge>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button 
                        onClick={() => { setSelectedUser(user); setIsModalOpen(true); }}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                       >
                          <Edit2 size={16} />
                       </button>
                       <button 
                        onClick={() => handleToggleStatus(user)}
                        className={cn("p-2 rounded-xl transition-all", user.ativo ? "text-slate-400 hover:text-red-600 hover:bg-red-50" : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50")}
                       >
                          {user.ativo ? <UserX size={16} /> : <UserCheck size={16} />}
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={selectedUser ? "Editar Usuário" : "Novo Usuário"}
        size="lg"
      >
        <form onSubmit={handleSaveUser} className="grid md:grid-cols-2 gap-6">
           <div className="space-y-4">
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nome Completo</label>
                 <input name="nome" defaultValue={selectedUser?.nome} required className="w-full h-12 bg-slate-50 border-none rounded-2xl px-4 text-sm font-medium focus:ring-2 focus:ring-blue-100 outline-none" placeholder="Ex: João da Silva" />
              </div>
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">E-mail Corporativo</label>
                 <input name="email" type="email" defaultValue={selectedUser?.email} required className="w-full h-12 bg-slate-50 border-none rounded-2xl px-4 text-sm font-medium focus:ring-2 focus:ring-blue-100 outline-none" placeholder="joao@empresa.com" />
              </div>
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Senha {selectedUser && "(Deixe vazio para manter)"}</label>
                 <input name="senha" type="password" required={!selectedUser} className="w-full h-12 bg-slate-50 border-none rounded-2xl px-4 text-sm font-medium focus:ring-2 focus:ring-blue-100 outline-none" />
              </div>
           </div>

           <div className="space-y-4">
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Cargo / Título</label>
                 <input name="cargo" defaultValue={selectedUser?.cargo || ''} className="w-full h-12 bg-slate-50 border-none rounded-2xl px-4 text-sm font-medium focus:ring-2 focus:ring-blue-100 outline-none" placeholder="Ex: Suporte N1" />
              </div>
              {currentUser.desenvolvedor && (
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Empresa</label>
                   <select name="empresa_id_target" className="w-full h-12 bg-slate-50 border-none rounded-2xl px-4 text-sm font-medium focus:ring-2 focus:ring-blue-100 outline-none">
                      <option value="">Nenhuma / Sistema</option>
                      {companies.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                   </select>
                </div>
              )}
              <div className="flex gap-4">
                 <label className="flex-1 p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-blue-100 cursor-pointer transition-all">
                    <input type="checkbox" name="is_admin" defaultChecked={selectedUser?.administrador} value="true" className="hidden peer" />
                    <div className="flex items-center gap-3">
                       <div className="w-4 h-4 rounded border border-slate-300 peer-checked:bg-blue-600 peer-checked:border-blue-600"></div>
                       <span className="text-xs font-bold text-slate-700">Administrador</span>
                    </div>
                 </label>
                 {currentUser.desenvolvedor && (
                   <label className="flex-1 p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-indigo-100 cursor-pointer transition-all">
                      <input type="checkbox" name="is_dev" defaultChecked={selectedUser?.desenvolvedor} value="true" className="hidden peer" />
                      <div className="flex items-center gap-3">
                         <div className="w-4 h-4 rounded border border-slate-300 peer-checked:bg-indigo-600 peer-checked:border-indigo-600"></div>
                         <span className="text-xs font-bold text-slate-700">Desenvolvedor</span>
                      </div>
                   </label>
                 )}
              </div>
           </div>

           <div className="md:col-span-2 flex justify-end gap-3 mt-4">
              <button type="button" onClick={() => setIsModalOpen(false)} className="h-12 px-6 font-bold text-slate-400 hover:text-slate-600 transition-all">Cancelar</button>
              <button type="submit" className="h-12 px-8 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">Salvar Usuário</button>
           </div>
        </form>
      </Modal>
    </div>
  );
};
