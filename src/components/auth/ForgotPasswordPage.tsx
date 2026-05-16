import React from 'react';
import { ArrowRight, Mail, Loader2, ShieldCheck } from 'lucide-react';
import { AppLogo } from '../ui/Logo';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { AuthLayout } from './AuthLayout';
import { AuthAlert } from './AuthAlert';

interface ForgotPasswordPageProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  authError: string | null;
  authSuccess: string | null;
  onBackToLogin: () => void;
  onBackToSite: () => void;
  loading: boolean;
}

export const ForgotPasswordPage = ({ onSubmit, authError, authSuccess, onBackToLogin, onBackToSite, loading }: ForgotPasswordPageProps) => {
  return (
    <AuthLayout>
      <div className="text-center lg:text-left mb-8">
        <div className="lg:hidden flex items-center justify-center gap-2 mb-6 grayscale opacity-80">
          <AppLogo size={24} />
          <span className="font-bold tracking-tight text-slate-800">Gestifique</span>
        </div>
        <div className="inline-flex w-12 h-12 bg-blue-50 rounded-xl items-center justify-center mb-4 lg:hidden">
          <Mail className="text-blue-600" size={20} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Recuperar senha</h2>
        <p className="text-[15px] font-medium text-slate-500">Enviaremos um código de recuperação para o e-mail informado.</p>
      </div>

      <Card className="p-6 md:p-8 border-slate-200/60 shadow-sm">
        <form onSubmit={onSubmit} className="space-y-5">
          {authError && <AuthAlert type="error" message={authError} />}
          {authSuccess && <AuthAlert type="success" message={authSuccess} />}

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

          <div className="pt-2">
            <Button type="submit" className="w-full h-10 text-[13px] font-bold shadow-sm" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" /> Processando...
                </>
              ) : (
                'Enviar código'
              )}
            </Button>
          </div>
        </form>
      </Card>

      <div className="mt-8 text-center space-y-4 flex flex-col items-center">
        <button
          onClick={onBackToLogin}
          className="text-[13px] font-semibold text-slate-600 hover:text-slate-900 transition-colors outline-none inline-flex items-center gap-1.5"
          disabled={loading}
        >
          <ArrowRight size={14} className="rotate-180" /> Voltar ao login
        </button>
        <button
          onClick={onBackToSite}
          className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors outline-none inline-flex items-center gap-1.5 mt-2"
          disabled={loading}
        >
           Ir para o site público
        </button>
        
        <div className="flex items-center justify-center gap-2 text-[11px] font-medium text-slate-400 pt-4">
           <ShieldCheck size={12} className="text-emerald-500" /> Ambiente protegido
        </div>
      </div>
    </AuthLayout>
  );
};
