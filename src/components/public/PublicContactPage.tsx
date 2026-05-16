import React, { useState } from 'react';
import { Mail, Clock, CheckCircle, ArrowRight } from 'lucide-react';
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
    <div className="flex flex-col bg-white">
      <section className="pt-20 pb-12 px-6 bg-white border-b border-slate-200 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Vamos entender sua operação de atendimento?
          </h1>
          <p className="text-base font-medium text-slate-500 leading-relaxed max-w-xl mx-auto">
            Conte um pouco sobre sua equipe e retornaremos com uma sugestão de implantação guiada.
          </p>
        </div>
      </section>

      <section className="py-20 px-6 -mt-8 bg-slate-50 flex-1">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_360px] gap-8">
          
          {/* Form */}
          <Card className="p-6 shadow-md border-slate-200">
             {sent ? (
               <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-8">
                 <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-2">
                   <CheckCircle size={24} />
                 </div>
                 <div>
                   <h3 className="text-xl font-bold text-slate-900 mb-2">Intenção de contato registrada</h3>
                   <p className="text-sm font-medium text-slate-500 max-w-md mx-auto">
                     Agradecemos o seu interesse. O formulário público ainda não possui envio automático. Sua intenção de contato foi registrada localmente. Por favor, envie um e-mail para <span className="font-bold">contato@gestifique.com.br</span>.
                   </p>
                 </div>
                 <Button onClick={() => setSent(false)} variant="outline" className="mt-4 h-10 px-6">
                   Enviar nova mensagem
                 </Button>
               </div>
             ) : (
               <form onSubmit={handleSubmit} className="space-y-4">
                 <h2 className="text-lg font-bold text-slate-900 mb-1">Agende uma demonstração</h2>
                 <p className="text-[13px] font-medium text-slate-500 mb-6 border-b border-slate-100 pb-4">Preencha os dados para organizar sua solicitação. No momento, o contato comercial oficial deve ser feito por contato@gestifique.com.br.</p>
                 
                 <div className="grid sm:grid-cols-2 gap-4">
                   <Input label="Seu Nome Completo" required placeholder="Ex: João Silva" className="h-10" />
                   <Input label="E-mail Corporativo" type="email" required placeholder="joao@suaempresa.com.br" className="h-10" />
                 </div>
                 
                 <div className="grid sm:grid-cols-2 gap-4">
                   <Input label="Empresa" required placeholder="Nome da sua empresa" className="h-10" />
                   <Input label="WhatsApp / Telefone" required placeholder="(11) 99999-9999" className="h-10" />
                 </div>

                 <div className="grid sm:grid-cols-2 gap-4">
                   <div className="space-y-1">
                     <label className="text-xs font-semibold text-slate-700">Tamanho da equipe</label>
                     <select className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                       <option value="">Selecione...</option>
                       <option value="1 a 5">1 a 5 atendentes</option>
                       <option value="6 a 15">6 a 15 atendentes</option>
                       <option value="Mais de 15">Mais de 15 atendentes</option>
                     </select>
                   </div>
                   <div className="space-y-1">
                     <label className="text-xs font-semibold text-slate-700">Principal Formato Atual</label>
                     <select className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                       <option value="">Selecione o desafio...</option>
                       <option value="Email">Sendo atendido por E-mail</option>
                       <option value="WhatsApp">Sendo atendido por WhatsApp livre</option>
                       <option value="Outro Sistema">Usando outro sistema de tickets</option>
                       <option value="Planilhas">Controlando via Planilhas</option>
                     </select>
                   </div>
                 </div>
                 
                 <div className="space-y-1 pt-2">
                   <label className="text-xs font-semibold text-slate-700">Mensagem Adicional (opcional)</label>
                   <textarea 
                     className="w-full h-24 p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                     placeholder="Gostaria de resolver o problema de X e Y na minha equipe..."
                   />
                 </div>
                 
                 <div className="pt-2">
                   <button type="submit" className="w-full h-11 bg-blue-600 text-white rounded-lg font-bold text-[14px] shadow-sm hover:shadow-md hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                     Registrar intenção de contato <ArrowRight size={18} />
                   </button>
                 </div>
                 <p className="text-xs font-medium text-slate-400 text-center mt-3">
                   Nenhum cartão de crédito será exigido para a demonstração.
                 </p>
               </form>
             )}
          </Card>

          {/* Sidebar */}
          <div className="w-full space-y-6">
             <Card className="p-5 space-y-5 bg-white border-slate-200 shadow-sm">
                <div>
                   <h3 className="text-[15px] font-bold text-slate-900 mb-5">O que acontece depois?</h3>
                   <div className="space-y-5">
                      <div className="flex items-start gap-4">
                         <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">1</div>
                         <div>
                            <div className="text-[14px] font-bold text-slate-900">Entendemos a operação</div>
                            <div className="text-[13px] text-slate-500 mt-1 leading-relaxed">Nossa equipe entrará em contato para mapear seus gargalos atuais.</div>
                         </div>
                      </div>
                      <div className="flex items-start gap-4">
                         <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">2</div>
                         <div>
                            <div className="text-[14px] font-bold text-slate-900">Mostramos o sistema</div>
                            <div className="text-[13px] text-slate-500 mt-1 leading-relaxed">Você verá o Gestifique funcionando em uma demonstração focada no seu caso.</div>
                         </div>
                      </div>
                      <div className="flex items-start gap-4">
                         <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">3</div>
                         <div>
                            <div className="text-[14px] font-bold text-slate-900">Aprovamos e Implantamos</div>
                            <div className="text-[13px] text-slate-500 mt-1 leading-relaxed">Sugerimos o melhor plano de acompanhamento para ativar sua operação B2B.</div>
                         </div>
                      </div>
                   </div>
                </div>
             </Card>

             <Card className="p-5 space-y-4 bg-blue-50 text-slate-900 border border-blue-100 shadow-sm">
                 <h3 className="text-[11px] font-bold text-blue-600 uppercase tracking-widest text-center mb-4">Mais Contatos</h3>
                 <div className="space-y-3">
                    <div className="flex items-center gap-3">
                       <Mail size={16} className="text-blue-500" />
                       <span className="text-[13px] font-bold">contato@gestifique.com.br</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <Clock size={16} className="text-blue-500" />
                       <span className="text-[13px] font-bold">Dias úteis, 09h às 18h</span>
                    </div>
                 </div>
                 
                 <div className="pt-5 mt-5 border-t border-blue-100/50 space-y-3 font-semibold text-[12px] text-slate-600">
                   <div className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500"/> Sem compromisso</div>
                   <div className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500"/> Demonstração guiada</div>
                   <div className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500"/> Foco em operação B2B</div>
                 </div>
             </Card>
          </div>
        </div>
      </section>
    </div>
  );
};
