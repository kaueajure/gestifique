import React, { useState } from 'react';
import { User } from '../../types';
import { api } from '../../lib/api';
import { UserCircle as UserIcon, Mail, Phone, Building2, Shield, Key, Eye, EyeOff, Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ProfilePageProps {
  currentUser: User;
  onUpdate: (user: User) => void;
}

export const ProfilePage = ({ currentUser, onUpdate }: ProfilePageProps) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());

    // If password is blank, don't send it
    if (!data.password) {
      delete data.password;
    }

    try {
      await api.patch('/profile', data);
      
      // Update local state by re-fetching
      const updated = await api.get<User>('/profile');
      onUpdate(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar informações de perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl space-y-10">
      <div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Meu Perfil</h2>
        <p className="text-slate-500 font-medium text-lg">Gerencie como você aparece para o time e configure sua segurança.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
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
                   <button className="absolute -bottom-2 -right-2 w-12 h-12 bg-blue-600 text-white rounded-2xl shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all border-4 border-white">
                      <UserIcon size={24} />
                   </button>
                </div>
                <div>
                   <h3 className="font-black text-slate-900 text-2xl leading-tight mb-1">{currentUser.nome}</h3>
                   <Badge variant="indigo" className="font-black tracking-[0.2em] px-4 py-1.5 uppercase text-[10px]">{currentUser.cargo || 'Membro do Time'}</Badge>
                </div>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                   {currentUser.desenvolvedor && <Badge variant="indigo" className="rounded-full shadow-sm">Developer</Badge>}
                   {currentUser.administrador && <Badge variant="blue" className="rounded-full shadow-sm">Admin</Badge>}
                   <Badge variant="success" className="rounded-full shadow-sm">Conta Ativa</Badge>
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
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest text-[9px]">ID Membro</span>
                    <div className="text-sm font-mono font-bold text-blue-400">#000{currentUser.id}</div>
                 </div>
                 <div className="space-y-1">
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest text-[9px]">Ingresso</span>
                    <div className="text-sm font-mono font-bold text-blue-400">---</div>
                 </div>
              </div>
           </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
           <form onSubmit={handleUpdateProfile} className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-8">
              <AnimatePresence>
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
                    <CheckCircle2 size={18} /> Informações atualizadas com sucesso!
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid md:grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 pl-1">
                       <UserIcon size={12} className="text-blue-500" /> Nome Completo
                    </label>
                    <input 
                      name="nome" 
                      defaultValue={currentUser.nome} 
                      className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold focus:ring-4 focus:ring-blue-100/50 transition-all outline-none" 
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 pl-1">
                       <Mail size={12} className="text-blue-500" /> E-mail Corporativo
                    </label>
                    <input 
                      value={currentUser.email} 
                      readOnly 
                      className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold text-slate-400 cursor-not-allowed outline-none" 
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 pl-1">
                       <Phone size={12} className="text-blue-500" /> Telefone / WhatsApp
                    </label>
                    <input 
                      name="telefone" 
                      defaultValue={currentUser.telefone || ''} 
                      className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold focus:ring-4 focus:ring-blue-100/50 transition-all outline-none" 
                      placeholder="(00) 00000-0000" 
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 pl-1">
                       <Shield size={12} className="text-blue-500" /> Cargo Atual
                    </label>
                    <input 
                      name="cargo" 
                      defaultValue={currentUser.cargo || ''} 
                      className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold focus:ring-4 focus:ring-blue-100/50 transition-all outline-none" 
                    />
                 </div>
              </div>

              <div className="pt-8 border-t border-slate-50 space-y-6">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                      <Key size={20} />
                   </div>
                   <h4 className="font-black text-slate-900">Segurança da Conta</h4>
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 pl-1">
                       Alterar Senha de Acesso
                    </label>
                    <div className="relative group">
                       <input 
                         name="password" 
                         type={showPassword ? 'text' : 'password'} 
                         className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold focus:ring-4 focus:ring-blue-100/50 transition-all outline-none" 
                         placeholder="Digite uma nova senha ou deixe em branco" 
                       />
                       <button 
                         type="button" 
                         onClick={() => setShowPassword(!showPassword)}
                         className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                       >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                       </button>
                    </div>
                 </div>
              </div>

              <div className="pt-6 flex justify-end">
                 <button 
                  disabled={loading}
                  className="h-14 px-12 bg-blue-600 text-white font-black rounded-2xl shadow-2xl shadow-blue-100 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-3 active:scale-95"
                 >
                    {loading ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
                    Salvar Alterações
                 </button>
              </div>
           </form>
        </div>
      </div>
    </div>
  );
};
