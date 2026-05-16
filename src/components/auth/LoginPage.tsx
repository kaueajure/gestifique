import React, { useState } from 'react';
import { ArrowRight, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { AppLogo } from '../ui/Logo';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { AuthLayout } from './AuthLayout';
import { AuthAlert } from './AuthAlert';

interface LoginPageProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  authError: string | null;
  onForgotPassword: () => void;
  onBackToSite: () => void;
  loading: boolean;
}

export const LoginPage = ({ onSubmit, authError, onForgotPassword, onBackToSite, loading }: LoginPageProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <AuthLayout>
      <div className="text-center lg:text-left mb-8">
        <div className="lg:hidden flex items-center justify-center gap-2 mb-6 grayscale opacity-80">
          <AppLogo size={24} />
          <span className="font-bold tracking-tight text-slate-800">Gestifique</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Entrar no Gestifique</h2>
        <p className="text-[15px] font-medium text-slate-500">Acesse sua central de atendimento.</p>
      </div>

      <Card className="p-6 md:p-8 border-slate-200/60 shadow-sm">
        <form onSubmit={onSubmit} className="space-y-5">
          {authError && <AuthAlert type="error" message={authError} />}

          <Input
            label="E-mail Corporativo"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="h-10 text-sm"
            placeholder="exemplo@empresa.com"
            disabled={loading}
          />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-semibold text-slate-700">Senha</label>
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline outline-none"
                disabled={loading}
              >
                Esqueceu a senha?
              </button>
            </div>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-10 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none disabled:opacity-50"
                placeholder="••••••••"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center text-slate-400 hover:text-slate-600 outline-none"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                disabled={loading}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" className="w-full h-10 text-[13px] font-bold shadow-sm" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" /> Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </div>
        </form>
      </Card>

      <div className="mt-8 text-center space-y-4">
        <button
          onClick={onBackToSite}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors outline-none inline-flex items-center gap-1.5"
          disabled={loading}
        >
          <ArrowRight size={14} className="rotate-180" /> Voltar ao site público
        </button>
        
        <div className="flex items-center justify-center gap-4 text-[11px] font-medium text-slate-400">
           <span className="flex items-center gap-1"><ShieldCheck size={12} className="text-emerald-500" /> Ambiente protegido</span>
           <span>Acesso restrito</span>
        </div>
      </div>
    </AuthLayout>
  );
};
