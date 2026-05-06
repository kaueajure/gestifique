import React, { useState } from 'react';
import { User } from '../../types';
import { api } from '../../lib/api';
import { UserCircle as UserIcon, Mail, Phone, Building2, Shield, Key, Eye, EyeOff, Save, Loader2 } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

interface ProfilePageProps {
  currentUser: User;
  onUpdate: (user: User) => void;
}

export const ProfilePage = ({ currentUser, onUpdate }: ProfilePageProps) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());

    try {
      await api.patch('/profile', data);
      
      // Update local state by re-fetching
      const updated = await api.get<User>('/profile');
      onUpdate(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Configurações de Perfil</h2>
        <p className="text-slate-500 font-medium">Mantenha seus dados atualizados para uma melhor experiência.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="space-y-6">
           <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
              <div className="relative inline-block group">
                 <div className="w-32 h-32 rounded-3xl bg-blue-50 border-4 border-white shadow-xl flex items-center justify-center text-blue-600 font-black text-4xl uppercase overflow-hidden">
                    {currentUser.foto ? (
                      <img src={currentUser.foto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      currentUser.nome.charAt(0)
                    )}
                 </div>
                 <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 text-white rounded-xl shadow-lg flex items-center justify-center hover:scale-110 transition-all border-2 border-white">
                    <UserIcon size={20} />
                 </button>
              </div>
              <div>
                 <h3 className="font-black text-slate-800 text-lg leading-tight">{currentUser.nome}</h3>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{currentUser.cargo || 'Membro'}</p>
              </div>
              <div className="flex justify-center gap-2">
                 {currentUser.desenvolvedor && <Badge variant="indigo">Desenvolvedor</Badge>}
                 {currentUser.administrador && <Badge variant="blue">Administrador</Badge>}
              </div>
           </div>

           <div className="bg-slate-900 p-6 rounded-3xl text-white space-y-4">
              <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Sua Empresa</h4>
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-blue-400">
                    <Building2 size={20} />
                 </div>
                 <div className="flex-1 min-w-0">
                    <div className="text-sm font-black truncate">{currentUser.empresa_nome || 'Gestifique Master'}</div>
                    <div className="text-[10px] font-bold text-white/50 lowercase">Workspace Primário</div>
                 </div>
              </div>
           </div>
        </div>

        <div className="md:col-span-2 space-y-8">
           <form onSubmit={handleUpdateProfile} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <UserIcon size={12} className="text-blue-500" /> Nome Completo
                    </label>
                    <input name="nome" defaultValue={currentUser.nome} className="w-full h-12 bg-slate-50 border-none rounded-2xl px-4 text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all outline-none" />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <Mail size={12} className="text-blue-500" /> E-mail (Apenas Leitura)
                    </label>
                    <input value={currentUser.email} readOnly className="w-full h-12 bg-slate-50 border-none rounded-2xl px-4 text-sm font-bold text-slate-400 cursor-not-allowed outline-none" />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <Phone size={12} className="text-blue-500" /> Telefone / WhatsApp
                    </label>
                    <input name="telefone" defaultValue={currentUser.telefone || ''} className="w-full h-12 bg-slate-50 border-none rounded-2xl px-4 text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all outline-none" placeholder="(00) 00000-0000" />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <Shield size={12} className="text-blue-500" /> Cargo Atual
                    </label>
                    <input name="cargo" defaultValue={currentUser.cargo || ''} className="w-full h-12 bg-slate-50 border-none rounded-2xl px-4 text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all outline-none" />
                 </div>
              </div>

              <div className="pt-6 border-t border-slate-100 space-y-4">
                 <h4 className="font-black text-slate-800 text-sm">Segurança da Conta</h4>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <Key size={12} className="text-blue-500" /> Alterar Senha
                    </label>
                    <div className="relative">
                       <input 
                         name="password" 
                         type={showPassword ? 'text' : 'password'} 
                         className="w-full h-12 bg-slate-50 border-none rounded-2xl px-4 text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all outline-none" 
                         placeholder="Deixe em branco para não alterar" 
                       />
                       <button 
                         type="button" 
                         onClick={() => setShowPassword(!showPassword)}
                         className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600"
                       >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                       </button>
                    </div>
                 </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                 {success && (
                   <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-emerald-600 text-xs font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100"
                   >
                     Perfil atualizado com sucesso!
                   </motion.span>
                 )}
                 <div className="ml-auto flex items-center gap-3">
                   <button 
                    disabled={loading}
                    className="h-12 px-10 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2"
                   >
                      {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                      Salvar Alterações
                   </button>
                 </div>
              </div>
           </form>
        </div>
      </div>
    </div>
  );
};

const IconWrapper = ({ icon, className }: { icon: any, className?: string }) => {
  const Icon = icon;
  return <Icon size={12} className={className} />;
};

const MessageSquare = ({ size, className }: { size: number, className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
