import React, { useState } from 'react';
import { User } from '../../types';
import { api } from '../../lib/api';
import { UserCircle as UserIcon, Building2, Key, Eye, EyeOff, Save, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
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
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-950 tracking-tight">Meu Perfil</h2>
        <p className="text-sm text-slate-500">Gerencie como você aparece para o time e configure sua segurança.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lado Esquerdo: Info Fixa */}
        <div className="lg:col-span-4 space-y-6">
           <Card className="text-center overflow-hidden">
              <div className="h-20 bg-slate-100" />
              <div className="px-6 pb-6 -mt-10 relative">
                <div className="inline-block relative">
                   <div className="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-sm flex items-center justify-center text-blue-600 font-bold text-3xl uppercase overflow-hidden">
                      {currentUser.foto ? (
                        <img src={currentUser.foto} alt="" className="w-full h-full object-cover" />
                      ) : (
                        currentUser.nome.charAt(0)
                      )}
                   </div>
                </div>
                <div className="mt-4">
                   <h3 className="font-semibold text-slate-950 text-lg leading-tight mb-1">{currentUser.nome}</h3>
                   <p className="text-xs text-slate-500 font-medium mb-3">{currentUser.email}</p>
                   <div className="flex flex-wrap justify-center gap-1.5">
                      <Badge variant="indigo" className="text-[10px] font-bold uppercase tracking-tight">{currentUser.cargo || 'Membro'}</Badge>
                      {currentUser.administrador && <Badge variant="blue">Admin</Badge>}
                   </div>
                </div>
              </div>
           </Card>

           <Card className="p-5 bg-slate-950 text-white border-slate-900 shadow-md">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-4">
                 <Building2 size={12} className="text-blue-400" /> Vínculo Empresarial
              </h4>
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-blue-400">
                    <Building2 size={20} />
                 </div>
                 <div className="min-w-0">
                    <div className="text-sm font-semibold truncate leading-tight">{currentUser.empresa_nome || 'Gestifique Master'}</div>
                    <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Workspace Ativo</div>
                 </div>
              </div>
              <div className="mt-5 pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
                 <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Membro ID</span>
                    <div className="text-xs font-mono font-bold text-blue-400">#{currentUser.id?.toString().padStart(4, '0')}</div>
                 </div>
                 <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Desde</span>
                    <div className="text-xs font-mono font-bold text-blue-400">
                      {currentUser.created_at ? new Date(currentUser.created_at).toLocaleDateString() : '---'}
                    </div>
                 </div>
              </div>
           </Card>
        </div>

        {/* Lado Direito: Formulários */}
        <div className="lg:col-span-8 space-y-6">
           <AnimatePresence mode="wait">
             {error && (
               <motion.div 
                 initial={{ opacity: 0, y: -10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2.5 text-red-600 text-xs font-semibold"
               >
                 <AlertCircle size={16} /> {error}
               </motion.div>
             )}
             {success && (
               <motion.div 
                 initial={{ opacity: 0, y: -10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-2.5 text-emerald-600 text-xs font-semibold"
               >
                 <CheckCircle2 size={16} /> {success}
               </motion.div>
             )}
           </AnimatePresence>

           {/* Meus Dados */}
           <Card>
              <form onSubmit={handleUpdateProfile} className="p-6 space-y-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                     <UserIcon size={18} />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900">Informações Pessoais</h4>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                   <Input 
                     label="Nome Completo"
                     name="nome" 
                     defaultValue={currentUser.nome} 
                     required
                     placeholder="Ex: João Silva"
                   />
                   <div className="space-y-1.5 flex flex-col">
                      <label className="text-sm font-medium text-slate-700">E-mail Corporativo</label>
                      <input 
                        value={currentUser.email} 
                        readOnly 
                        className="h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm font-medium text-slate-400 cursor-not-allowed outline-none" 
                      />
                      <p className="text-[10px] text-slate-400 font-medium px-1">O e-mail é gerido pelo administrador.</p>
                   </div>
                   <Input 
                     label="Telefone / WhatsApp"
                     name="telefone" 
                     defaultValue={currentUser.telefone || ''} 
                     placeholder="(00) 00000-0000"
                   />
                   <div className="space-y-1.5 flex flex-col">
                      <label className="text-sm font-medium text-slate-700">Cargo / Função</label>
                      <input 
                        value={currentUser.cargo || 'Membro do Time'} 
                        readOnly
                        className="h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm font-medium text-slate-400 cursor-not-allowed outline-none" 
                      />
                   </div>
                </div>

                <div className="pt-2 flex justify-end">
                   <Button type="submit" loading={loading} className="w-full sm:w-auto">
                      <Save size={16} className="mr-2" /> Salvar Alterações
                   </Button>
                </div>
              </form>
           </Card>

           {/* Segurança */}
           <Card>
              <form onSubmit={handleChangePassword} className="p-6 space-y-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                     <Key size={18} />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900">Segurança & Senha</h4>
                </div>

                <div className="space-y-4">
                   <div className="relative">
                      <Input 
                        label="Senha Atual"
                        name="currentPassword" 
                        type={showPwd.current ? 'text' : 'password'} 
                        required
                        placeholder="••••••••"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPwd(s => ({...s, current: !s.current}))} 
                        className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
                      >
                         {showPwd.current ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                   </div>

                   <div className="grid md:grid-cols-2 gap-4">
                      <div className="relative">
                         <Input 
                           label="Nova Senha"
                           name="newPassword" 
                           type={showPwd.new ? 'text' : 'password'} 
                           required
                           placeholder="••••••••"
                         />
                         <button 
                           type="button" 
                           onClick={() => setShowPwd(s => ({...s, new: !s.new}))} 
                           className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
                         >
                            {showPwd.new ? <EyeOff size={16} /> : <Eye size={16} />}
                         </button>
                      </div>
                      <div className="relative">
                         <Input 
                           label="Confirmar Nova Senha"
                           name="confirmPassword" 
                           type={showPwd.confirm ? 'text' : 'password'} 
                           required
                           placeholder="••••••••"
                         />
                         <button 
                           type="button" 
                           onClick={() => setShowPwd(s => ({...s, confirm: !s.confirm}))} 
                           className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
                         >
                            {showPwd.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                         </button>
                      </div>
                   </div>
                </div>

                <div className="pt-2 flex justify-end">
                   <Button 
                    type="submit" 
                    loading={pwdLoading}
                    variant="outline"
                    className="w-full sm:w-auto border-amber-200 hover:bg-amber-50 text-amber-700"
                   >
                      <Lock size={16} className="mr-2" /> Atualizar Senha
                   </Button>
                </div>
              </form>
           </Card>
        </div>
      </div>
    </div>
  );
};
