import React, { useState } from 'react';
import { Mail, Clock, ShieldCheck, CheckCircle  } from 'lucide-react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export const PublicContactPage = () => {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="flex flex-col pb-20">
      <section className="pt-20 pb-12 px-6 bg-slate-50 border-b border-slate-100">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Vamos organizar seu atendimento?
          </h1>
          <p className="text-[15px] font-medium text-slate-500 leading-relaxed max-w-xl mx-auto">
            Fale com nossa equipe para tirar dúvidas ou agendar uma demonstração guiada pela plataforma.
          </p>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-[1fr_auto] gap-8">
          
          {/* Form */}
          <Card className="p-6 md:p-8">
             {sent ? (
               <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-10">
                 <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-2">
                   <CheckCircle size={32} />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900">Intenção de contato registrada!</h3>
                 <p className="text-sm font-medium text-slate-500 max-w-sm">
                   Sua intenção de contato foi registrada nesta tela. Em breve conectaremos este formulário ao envio automático. Por enquanto, fale conosco em contato@gestifique.com.br.
                 </p>
                 <Button onClick={() => setSent(false)} variant="outline" className="mt-4">
                   Enviar nova mensagem
                 </Button>
               </div>
             ) : (
               <form onSubmit={handleSubmit} className="space-y-4">
                 <h2 className="text-lg font-bold text-slate-900 mb-6">Solicite uma demonstração</h2>
                 
                 <div className="grid sm:grid-cols-2 gap-4">
                   <Input label="Seu Nome" required placeholder="Ex: João da Silva" />
                   <Input label="E-mail Corporativo" type="email" required placeholder="joao@empresa.com" />
                 </div>
                 
                 <div className="grid sm:grid-cols-2 gap-4">
                   <Input label="Empresa" required placeholder="Nome da Empresa" />
                   <Input label="WhatsApp / Telefone" required placeholder="(11) 99999-9999" />
                 </div>
                 
                 <div className="space-y-1">
                   <label className="text-xs font-semibold text-slate-700">Mensagem (opcional)</label>
                   <textarea 
                     className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none"
                     placeholder="Conte brevemente como podemos ajudar..."
                   />
                 </div>
                 
                 <div className="pt-2">
                   <Button type="submit" className="w-full h-10">
                     Enviar Solicitação
                   </Button>
                 </div>
                 <p className="text-[11px] font-medium text-slate-400 text-center mt-4">
                   Seus dados estão seguros conosco e não enviamos spam.
                 </p>
               </form>
             )}
          </Card>

          {/* Sidebar */}
          <div className="w-full md:w-[320px] space-y-4">
             <Card className="p-6 space-y-6 bg-slate-50 border-transparent">
                <div>
                   <h3 className="text-sm font-bold text-slate-900 mb-4">Informações de Contato</h3>
                   <div className="space-y-4">
                      <div className="flex items-start gap-3 text-slate-600">
                         <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center shrink-0">
                           <Mail size={14} className="text-blue-600" />
                         </div>
                         <div>
                           <div className="text-[11px] font-bold uppercase tracking-tight text-slate-400">E-mail Comercial</div>
                           <div className="text-sm font-semibold">contato@gestifique.com.br</div>
                         </div>
                      </div>
                      <div className="flex items-start gap-3 text-slate-600">
                         <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center shrink-0">
                           <Clock size={14} className="text-blue-600" />
                         </div>
                         <div>
                           <div className="text-[11px] font-bold uppercase tracking-tight text-slate-400">Horário Oficial</div>
                           <div className="text-sm font-semibold">Segunda a Sexta<br/>09h às 18h</div>
                         </div>
                      </div>
                   </div>
                </div>
                
                <div className="pt-6 border-t border-slate-200">
                   <h3 className="text-sm font-bold text-slate-900 mb-3 text-center">Por que falar conosco?</h3>
                   <ul className="space-y-2 text-xs font-medium text-slate-600">
                      <li className="flex items-center gap-2"><ShieldCheck size={14} className="text-emerald-500"/> Entenda a implantação.</li>
                      <li className="flex items-center gap-2"><ShieldCheck size={14} className="text-emerald-500"/> Veja a tela gerencial ao vivo.</li>
                      <li className="flex items-center gap-2"><ShieldCheck size={14} className="text-emerald-500"/> Tire dúvidas técnicas.</li>
                   </ul>
                </div>
             </Card>
          </div>
        </div>
      </section>
    </div>
  );
};
