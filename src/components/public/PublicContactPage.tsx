import React, { useState } from 'react';
import { Mail, Clock, ShieldCheck, CheckCircle, ArrowRight, Building2, Users } from 'lucide-react';
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
    <div className="flex flex-col bg-slate-50 min-h-screen">
      <section className="pt-24 pb-16 px-6 bg-slate-900 text-white text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-4xl font-bold tracking-tight">
            Vamos entender sua operação de atendimento?
          </h1>
          <p className="text-lg font-medium text-slate-400 leading-relaxed max-w-xl mx-auto">
            Conte um pouco sobre sua equipe e retornaremos com uma sugestão de implantação guiada.
          </p>
        </div>
      </section>

      <section className="py-20 px-6 -mt-8">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_360px] gap-8">
          
          {/* Form */}
          <Card className="p-8 shadow-xl border-slate-200">
             {sent ? (
               <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-16">
                 <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-2">
                   <CheckCircle size={40} />
                 </div>
                 <div>
                   <h3 className="text-2xl font-bold text-slate-900 mb-2">Solicitação enviada!</h3>
                   <p className="text-base font-medium text-slate-500 max-w-md mx-auto">
                     Agradecemos o seu interesse no Gestifique. O formulário público no momento funciona como registro de interesse local. 
                     Nossa equipe pode ser acionada diretamente através de <span className="font-bold">contato@gestifique.com.br</span>.
                   </p>
                 </div>
                 <Button onClick={() => setSent(false)} variant="outline" className="mt-4 h-12 px-6">
                   Enviar nova mensagem
                 </Button>
               </div>
             ) : (
               <form onSubmit={handleSubmit} className="space-y-6">
                 <h2 className="text-xl font-bold text-slate-900 mb-2">Agende uma demonstração</h2>
                 <p className="text-sm font-medium text-slate-500 mb-8 border-b border-slate-100 pb-6">Preencha os dados e entraremos em contato rapidamente.</p>
                 
                 <div className="grid sm:grid-cols-2 gap-6">
                   <Input label="Seu Nome Completo" required placeholder="Ex: João Silva" className="h-12" />
                   <Input label="E-mail Corporativo" type="email" required placeholder="joao@suaempresa.com.br" className="h-12" />
                 </div>
                 
                 <div className="grid sm:grid-cols-2 gap-6">
                   <Input label="Empresa" required placeholder="Nome da sua empresa" className="h-12" />
                   <Input label="WhatsApp / Telefone" required placeholder="(11) 99999-9999" className="h-12" />
                 </div>

                 <div className="grid sm:grid-cols-2 gap-6">
                   <div className="space-y-1">
                     <label className="text-[13px] font-bold text-slate-700">Tamanho da equipe</label>
                     <select className="w-full h-12 bg-white border border-slate-200 rounded-lg px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                       <option value="">Selecione...</option>
                       <option value="1 a 5">1 a 5 atendentes</option>
                       <option value="6 a 15">6 a 15 atendentes</option>
                       <option value="Mais de 15">Mais de 15 atendentes</option>
                     </select>
                   </div>
                   <div className="space-y-1">
                     <label className="text-[13px] font-bold text-slate-700">Principal Formato Atual</label>
                     <select className="w-full h-12 bg-white border border-slate-200 rounded-lg px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                       <option value="">Selecione o desafio...</option>
                       <option value="Email">Sendo atendido por E-mail</option>
                       <option value="WhatsApp">Sendo atendido por WhatsApp livre</option>
                       <option value="Outro Sistema">Usando outro sistema de tickets</option>
                       <option value="Planilhas">Controlando via Planilhas</option>
                     </select>
                   </div>
                 </div>
                 
                 <div className="space-y-1">
                   <label className="text-[13px] font-bold text-slate-700">Mensagem Adicional (opcional)</label>
                   <textarea 
                     className="w-full h-28 p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                     placeholder="Gostaria de resolver o problema de X e Y na minha equipe..."
                   />
                 </div>
                 
                 <div className="pt-4">
                   <button type="submit" className="w-full h-14 bg-blue-600 text-white rounded-lg font-bold text-[15px] shadow-md hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                     Solicitar Contato <ArrowRight size={18} />
                   </button>
                 </div>
                 <p className="text-xs font-medium text-slate-400 text-center mt-4">
                   Nenhum cartão de crédito será exigido para a demonstração.
                 </p>
               </form>
             )}
          </Card>

          {/* Sidebar */}
          <div className="w-full space-y-6">
             <Card className="p-6 space-y-6 bg-white border-slate-200 shadow-sm">
                <div>
                   <h3 className="text-base font-bold text-slate-900 mb-6">O que acontece depois?</h3>
                   <div className="space-y-6">
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

             <Card className="p-6 space-y-4 bg-slate-900 text-white border-transparent">
                 <h3 className="text-sm font-bold opacity-80 uppercase tracking-widest text-center mb-4">Mais Contatos</h3>
                 <div className="space-y-3">
                    <div className="flex items-center gap-3">
                       <Mail size={16} className="text-blue-400" />
                       <span className="text-sm font-bold">contato@gestifique.com.br</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <Clock size={16} className="text-blue-400" />
                       <span className="text-sm font-bold">Dias úteis, 09h às 18h</span>
                    </div>
                 </div>
                 
                 <div className="pt-6 mt-6 border-t border-slate-800 space-y-3 font-semibold text-[13px]">
                   <div className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-400"/> Sem compromisso</div>
                   <div className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-400"/> Demonstração guiada</div>
                   <div className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-400"/> Foco em operação B2B</div>
                 </div>
             </Card>
          </div>
        </div>
      </section>
    </div>
  );
};
