import React, { useState } from 'react';
import { User } from '../../types';
import { api } from '../../lib/api';
import { UserCircle as UserIcon, Mail, Phone, Building2, Shield, Key, Eye, EyeOff, Save, Loader2, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ProfilePageProps {
  currentUser: User;
  onUpdate: (user: User) => void;
}

export const ProfilePage = ({ currentUser, onUpdate }: ProfilePageProps) => {
  const [loading, setLoading] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false });
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());

    try {
      await api.patch('/profile', data);
      const updated = await api.get<User>('/profile');
      onUpdate(updated);
      setSuccess('Dados de perfil atualizados com sucesso!');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar dados de perfil.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdLoading(true);
    setSuccess(null);
    setError(null);

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());

    if (data.newPassword !== data.confirmPassword) {
      setError('A confirmação de senha não confere.');
      setPwdLoading(false);
      return;
    }

    if ((data.newPassword as string).length < 8) {
      setError('A nova senha deve ter no mínimo 8 caracteres.');
      setPwdLoading(false);
      return;
    }

    try {
      await api.patch('/profile/password', data);
      setSuccess('Senha alterada com sucesso!');
      (e.target as HTMLFormElement).reset();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar senha.');
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="max-w-6xl space-y-10">
      <div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Meu Perfil</h2>
        <p className="text-slate-500 font-medium text-lg">Gerencie como você aparece para o time e configure sua segurança.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Lado Esquerdo: Info Fixa */}
        <div className="space-y-8">
           <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm text-center relative overflow-hidden group">
              <div className="absolute top-0 inset-x-0 h-32 bg-slate-900 -z-0"></div>
              <div className="relative z-10 space-y-6">
                <div className="relative inline-block">
                   <div className="w-36 h-36 rounded-[48px] bg-white border-8 border-white shadow-2xl flex items-center justify-center text-blue-600 font-black text-5xl uppercase overflow-hidden transition-transform group-hover:scale-105 duration-500">
                      {currentUser.foto ? (
                        <img src={currentUser.foto} alt="" className="w-full h-full object-cover" />
                      ) : (
                        currentUser.nome.charAt(0)
                      )}
                   </div>
                </div>
                <div>
                   <h3 className="font-black text-slate-900 text-2xl leading-tight mb-1">{currentUser.nome}</h3>
                   <div className="flex flex-col items-center gap-2">
                      <Badge variant="indigo" className="font-black tracking-[0.2em] px-4 py-1.5 uppercase text-[10px]">{currentUser.cargo || 'Membro do Time'}</Badge>
                      <span className="text-xs font-bold text-slate-400">{currentUser.email}</span>
                   </div>
                </div>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                   {currentUser.desenvolvedor && <Badge variant="indigo" className="rounded-full shadow-sm">Developer</Badge>}
                   {currentUser.administrador && <Badge variant="blue" className="rounded-full shadow-sm">Admin</Badge>}
                   <Badge variant="emerald" className="rounded-full shadow-sm">Conta Ativa</Badge>
                </div>
              </div>
           </div>

           <div className="bg-slate-900 p-8 rounded-[40px] text-white space-y-6 shadow-2xl shadow-slate-200">
              <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                 <Building2 size={12} className="text-blue-400" /> Vínculo Empresarial
              </h4>
              <div className="flex items-center gap-4">
                 <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-blue-400 border border-white/10">
                    <Building2 size={28} />
                 </div>
                 <div className="flex-1 min-w-0">
                    <div className="text-lg font-black truncate">{currentUser.empresa_nome || 'Gestifique Master'}</div>
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Instância Ativa</div>
                 </div>
              </div>
              <div className="pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">ID Membro</span>
                    <div className="text-sm font-mono font-bold text-blue-400">#000{currentUser.id}</div>
                 </div>
                 <div className="space-y-1">
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Desde</span>
                    <div className="text-sm font-mono font-bold text-blue-400">
                      {currentUser.created_at ? new Date(currentUser.created_at).toLocaleDateString() : '---'}
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Lado Direito: Formulários */}
        <div className="lg:col-span-2 space-y-8">
           <AnimatePresence mode="wait">
             {error && (
               <motion.div 
                 initial={{ opacity: 0, height: 0 }}
                 animate={{ opacity: 1, height: 'auto' }}
                 exit={{ opacity: 0, height: 0 }}
                 className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold overflow-hidden"
               >
                 <AlertCircle size={18} /> {error}
               </motion.div>
             )}
             {success && (
               <motion.div 
                 initial={{ opacity: 0, height: 0 }}
                 animate={{ opacity: 1, height: 'auto' }}
                 exit={{ opacity: 0, height: 0 }}
                 className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-600 text-xs font-bold overflow-hidden"
               >
                 <CheckCircle2 size={18} /> {success}
               </motion.div>
             )}
           </AnimatePresence>

           {/* Meus Dados */}
           <form onSubmit={handleUpdateProfile} className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                   <UserIcon size={20} />
                </div>
                <h4 className="font-black text-slate-900">Informações Pessoais</h4>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 pl-1">Nome Completo</label>
                    <input 
                      name="nome" 
                      defaultValue={currentUser.nome} 
                      className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold focus:ring-4 focus:ring-blue-100 transition-all outline-none" 
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 pl-1">E-mail Corporativo</label>
                    <input value={currentUser.email} readOnly className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold text-slate-400 cursor-not-allowed outline-none" />
                    <p className="text-[9px] font-bold text-slate-400 pl-1 uppercase tracking-tighter">* O e-mail não pode ser alterado diretamente</p>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 pl-1">Telefone / WhatsApp</label>
                    <input 
                      name="telefone" 
                      defaultValue={currentUser.telefone || ''} 
                      placeholder="Não informado"
                      className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold focus:ring-4 focus:ring-blue-100 transition-all outline-none" 
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 pl-1">Cargo / Função</label>
                    <input 
                      value={currentUser.cargo || 'Membro do Time'} 
                      readOnly
                      className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold text-slate-400 cursor-not-allowed outline-none" 
                    />
                    <p className="text-[9px] font-bold text-slate-400 pl-1 uppercase tracking-tighter">* O cargo é atribuído por um administrador</p>
                 </div>
              </div>

              <div className="pt-4 flex justify-end">
                 <button 
                  disabled={loading}
                  className="h-14 px-12 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center gap-3 active:scale-95"
                 >
                    {loading ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
                    Atualizar Dados
                 </button>
              </div>
           </form>

           {/* Segurança */}
           <form onSubmit={handleChangePassword} className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                   <Key size={20} />
                </div>
                <h4 className="font-black text-slate-900">Segurança da Conta</h4>
              </div>

              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Senha Atual</label>
                    <div className="relative">
                       <input 
                         name="currentPassword" 
                         type={showPwd.current ? 'text' : 'password'} 
                         required
                         className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold focus:ring-4 focus:ring-indigo-100 transition-all outline-none" 
                       />
                       <button type="button" onClick={() => setShowPwd(s => ({...s, current: !s.current}))} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600">
                          {showPwd.current ? <EyeOff size={20} /> : <Eye size={20} />}
                       </button>
                    </div>
                 </div>

                 <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nova Senha</label>
                       <div className="relative">
                          <input 
                            name="newPassword" 
                            type={showPwd.new ? 'text' : 'password'} 
                            required
                            className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold focus:ring-4 focus:ring-indigo-100 transition-all outline-none" 
                          />
                          <button type="button" onClick={() => setShowPwd(s => ({...s, new: !s.new}))} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600">
                             {showPwd.new ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Confirmar Nova Senha</label>
                       <div className="relative">
                          <input 
                            name="confirmPassword" 
                            type={showPwd.confirm ? 'text' : 'password'} 
                            required
                            className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold focus:ring-4 focus:ring-indigo-100 transition-all outline-none" 
                          />
                          <button type="button" onClick={() => setShowPwd(s => ({...s, confirm: !s.confirm}))} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600">
                             {showPwd.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="pt-4 flex justify-end">
                 <button 
                  disabled={pwdLoading}
                  className="h-14 px-12 bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-3 active:scale-95"
                 >
                    {pwdLoading ? <Loader2 size={24} className="animate-spin" /> : <Lock size={24} />}
                    Alterar Senha
                 </button>
              </div>
           </form>
        </div>
      </div>
    </div>
  );
};
