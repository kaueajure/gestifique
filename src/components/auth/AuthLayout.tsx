import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Target, Users } from 'lucide-react';
import { AppLogo } from '../ui/Logo';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Esquerda: Branding Institucional (Oculto no mobile) */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Elemento de background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-[128px] opacity-20 -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative z-10 flex items-center gap-2 grayscale brightness-200">
          <AppLogo size={28} />
          <span className="text-xl font-bold tracking-tight">Gestifique</span>
        </div>

        <div className="relative z-10 max-w-md space-y-8">
          <h1 className="text-4xl font-bold tracking-tight leading-tight">
            Organize atendimentos, prazos e equipes em um só lugar.
          </h1>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                <Target className="text-blue-400" size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Gestão de tickets</h3>
                <p className="text-sm font-medium text-slate-400 leading-relaxed">Estruturação por prioridades, categorias e status claros.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="text-emerald-400" size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Controle de SLA</h3>
                <p className="text-sm font-medium text-slate-400 leading-relaxed">Monitoramento de prazos de primeira resposta e resolução.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                <Users className="text-purple-400" size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Portal do cliente</h3>
                <p className="text-sm font-medium text-slate-400 leading-relaxed">Acompanhamento transparente das demandas B2B.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 font-medium text-xs text-slate-500">
          © {new Date().getFullYear()} Gestifique. Enterprise Ticket Management.
        </div>
      </div>

      {/* Direita: Formulário de Autenticação */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[380px]"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
};
