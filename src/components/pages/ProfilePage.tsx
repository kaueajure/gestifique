import React, { useState } from 'react';
import { User } from '../../types';
import { api } from '../../lib/api';
import { UserCircle as UserIcon, Building2, Key, Eye, EyeOff, Save, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { PageHeader } from '../ui/PageHeader';
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
    
    try {
      const payload = {
        nome: String(formData.get('nome') || ''),
        telefone: String(formData.get('telefone') || '')
      };

      await api.patch('/profile', payload);
      const updated = await api.get<User>('/profile');
      onUpdate(updated);
      setSuccess('Dados de perfil atualizados com sucesso!');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar dados de perfil.';
      setError(message);
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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao alterar senha.';
      setError(message);
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="w-full max-w-none space-y-4">
      <PageHeader title="Meu Perfil" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Lado Esquerdo: Info Fixa */}
        <div className="lg:col-span-3 space-y-4">
           <Card className="text-center overflow-hidden">
              <div className="h-12 bg-slate-50" />
              <div className="px-4 pb-4 -mt-8 relative">
                <div className="inline-block relative">
                   <div className="w-16 h-16 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-800 font-bold text-xl uppercase overflow-hidden">
                      {currentUser.foto ? (
                        <img src={currentUser.foto} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (currentUser.nome || 'U').charAt(0)
                      )}
                   </div>
                </div>
                <div className="mt-2">
                   <h3 className="font-semibold text-slate-900 text-sm leading-tight mb-0.5">{currentUser.nome || 'Usuário'}</h3>
                   <p className="text-[10px] text-slate-500 font-medium mb-2 truncate">{currentUser.email || 'Email não informado'}</p>
                   <div className="flex flex-wrap justify-center gap-1.5">
                      <Badge variant="indigo" className="text-[9px] font-semibold px-1.5 py-0">{currentUser.cargo || 'Membro'}</Badge>
                      {!!currentUser.administrador && <Badge variant="blue" className="text-[9px] font-semibold px-1.5 py-0">Admin</Badge>}
                   </div>
                </div>
              </div>
           </Card>

           <Card className="p-4 bg-white border-slate-200 shadow-sm text-slate-800">
              <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-3">
                 <Building2 size={12} className="text-blue-500" /> Empresa
              </h4>
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <Building2 size={16} />
                 </div>
                 <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate leading-tight">{currentUser.empresa_nome || 'Gestifique Central'}</div>
                    <div className="text-[10px] font-medium text-emerald-600 mt-0.5 flex items-center gap-1">
                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block" />
                       Conectado
                    </div>
                 </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3">
                 <div className="space-y-0.5">
                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">ID Membro</span>
                    <div className="text-xs font-mono font-medium text-slate-700">#{currentUser.id?.toString().padStart(4, '0')}</div>
                 </div>
              </div>
           </Card>
        </div>

        {/* Lado Direito: Formulários */}
        <div className="lg:col-span-9 space-y-4">
           <AnimatePresence mode="wait">
             {error && (
               <motion.div 
                 initial={{ opacity: 0, y: -5 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -5 }}
                 className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-xs font-medium"
               >
                 <AlertCircle size={14} /> {error}
               </motion.div>
             )}
             {success && (
               <motion.div 
                 initial={{ opacity: 0, y: -5 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -5 }}
                 className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-2 text-emerald-600 text-xs font-medium"
               >
                 <CheckCircle2 size={14} /> {success}
               </motion.div>
             )}
           </AnimatePresence>

           {/* Meus Dados */}
           <Card>
              <form onSubmit={handleUpdateProfile} className="p-5 space-y-4">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-md flex items-center justify-center border border-blue-100">
                     <UserIcon size={16} />
                  </div>
                  <div>
                     <h4 className="text-sm font-semibold text-slate-900">Informações Pessoais</h4>
                     <p className="text-[11px] text-slate-500">Atualize seus dados de contato e identificação.</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                   <Input 
                     label="Nome Completo"
                     name="nome" 
                     defaultValue={currentUser.nome || ''} 
                     required
                     placeholder="Ex: João Silva"
                   />
                   <div className="space-y-1.5 flex flex-col">
                      <label className="text-xs font-medium text-slate-700">E-mail Corporativo</label>
                      <input 
                        value={currentUser.email || ''} 
                        readOnly 
                        className="h-9 bg-slate-50 border border-slate-200 rounded-md px-3 text-xs font-medium text-slate-400 cursor-not-allowed outline-none" 
                      />
                      <p className="text-[10px] text-slate-400 font-medium px-1">Gerido pelo administrador.</p>
                   </div>
                   <Input 
                     label="Telefone / WhatsApp"
                     name="telefone" 
                     defaultValue={currentUser.telefone || ''} 
                     placeholder="(00) 00000-0000"
                   />
                   <div className="space-y-1.5 flex flex-col">
                      <label className="text-xs font-medium text-slate-700">Cargo / Função</label>
                      <input 
                        value={currentUser.cargo || 'Membro do Time'} 
                        readOnly
                        className="h-9 bg-slate-50 border border-slate-200 rounded-md px-3 text-xs font-medium text-slate-400 cursor-not-allowed outline-none" 
                      />
                   </div>
                </div>

                <div className="pt-2 flex justify-end">
                   <Button type="submit" loading={loading} size="sm" className="w-full sm:w-auto">
                      <Save size={14} className="mr-1.5" /> Salvar Alterações
                   </Button>
                </div>
              </form>
           </Card>

           {/* Segurança */}
           <Card>
              <form onSubmit={handleChangePassword} className="p-5 space-y-4">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-md flex items-center justify-center border border-amber-100">
                     <Key size={16} />
                  </div>
                  <div>
                     <h4 className="text-sm font-semibold text-slate-900">Segurança & Senha</h4>
                     <p className="text-[11px] text-slate-500">Mantenha sua conta protegida alterando a senha regularmente.</p>
                  </div>
                </div>

                <div className="space-y-3">
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
                        className="absolute right-3 top-[26px] text-slate-400 hover:text-slate-600"
                      >
                         {showPwd.current ? <EyeOff size={14} /> : <Eye size={14} />}
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
                           className="absolute right-3 top-[26px] text-slate-400 hover:text-slate-600"
                         >
                            {showPwd.new ? <EyeOff size={14} /> : <Eye size={14} />}
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
                           className="absolute right-3 top-[26px] text-slate-400 hover:text-slate-600"
                         >
                            {showPwd.confirm ? <EyeOff size={14} /> : <Eye size={14} />}
                         </button>
                      </div>
                   </div>
                </div>

                <div className="pt-2 flex justify-end">
                   <Button 
                    type="submit" 
                    loading={pwdLoading}
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                   >
                      <Lock size={14} className="mr-1.5 text-slate-400" /> Atualizar Senha
                   </Button>
                </div>
              </form>
           </Card>
        </div>
      </div>
    </div>
  );
};
