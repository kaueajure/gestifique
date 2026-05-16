import React from 'react';
import { ArrowRight, Ticket, Clock, CheckCircle2, ShieldCheck } from 'lucide-react';

interface PublicHomePageProps {
  onNavigate: (path: string) => void;
  onLogin: () => void;
}

export const PublicHomePage = ({ onNavigate, onLogin }: PublicHomePageProps) => {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="pt-20 pb-16 px-6">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-6 text-center lg:text-left">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 leading-[1.2]">
              Pare de perder chamados em e-mails e planilhas.
            </h1>
            <p className="text-[15px] text-slate-500 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
              O Gestifique é a plataforma B2B enxuta que centraliza tickets, organiza equipes e garante as respostas dentro do prazo.
            </p>
            <div className="flex w-full sm:w-auto flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
               <button 
                 onClick={() => onNavigate('/contato')}
                 className="w-full sm:w-auto h-10 px-6 bg-blue-600 text-white text-[13px] font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-sm flex items-center justify-center gap-2"
               >
                 Solicitar demonstração <ArrowRight size={16} />
               </button>
               <button 
                 onClick={() => onNavigate('/funcionalidades')}
                 className="w-full sm:w-auto h-10 px-6 bg-white border border-slate-200 text-slate-700 text-[13px] font-semibold rounded-lg hover:bg-slate-50 transition-all flex items-center justify-center"
               >
                 Ver funcionalidades
               </button>
            </div>
            
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-6 text-[11px] font-semibold text-slate-400">
               <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-500"/> Rápida Implantação </span>
               <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-500"/> Focado em B2B </span>
            </div>
          </div>
          
          <div className="flex-1 w-full max-w-lg relative">
             <div className="absolute -inset-4 bg-blue-50 blur-2xl rounded-full -z-10 opacity-70"></div>
             <div className="bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden flex flex-col h-[320px]">
               <div className="h-10 bg-slate-50 border-b border-slate-200 flex items-center px-4 gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
               </div>
               <div className="flex-1 p-5 space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1 h-20 rounded-lg bg-orange-50 border border-orange-100 flex flex-col justify-center px-4">
                       <span className="text-[10px] font-bold text-orange-600 uppercase tracking-tight">Em Atraso</span>
                       <span className="text-2xl font-bold text-slate-900 leading-none mt-1">3</span>
                    </div>
                    <div className="flex-1 h-20 rounded-lg bg-blue-50 border border-blue-100 flex flex-col justify-center px-4">
                       <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">Abertos</span>
                       <span className="text-2xl font-bold text-slate-900 leading-none mt-1">12</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                     {[1,2,3].map(i => (
                       <div key={i} className="h-12 border border-slate-100 rounded-lg bg-slate-50/50 flex items-center px-3 gap-3">
                          <Ticket size={14} className="text-slate-400" />
                          <div className="flex-1 space-y-1.5">
                            <div className="h-2 bg-slate-200 rounded w-1/2"></div>
                            <div className="h-1.5 bg-slate-200 rounded w-1/4"></div>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* Como Ajudamos / Problema vs Solução */}
      <section className="py-16 px-6 bg-slate-50">
         <div className="max-w-6xl mx-auto space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Menos ferramentas soltas, mais processos claros.</h2>
              <p className="text-sm font-medium text-slate-500">Substitua a confusão de canais informais por uma esteira de operação estruturada.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Ticket, title: 'Centralização Total', desc: 'Acabe com demandas espalhadas.' },
                { icon: Clock, title: 'Gestão de SLA', desc: 'Metas claras para tempos de primeira resposta e resolução.' },
                { icon: ShieldCheck, title: 'Controle Multi-empresa', desc: 'Gerencie múltiplos clientes B2B na mesma base.' }
              ].map((item, i) => (
                 <div key={i} className="p-5 bg-white border border-slate-200 rounded-xl flex flex-col gap-3 shadow-sm">
                   <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                     <item.icon size={20} />
                   </div>
                   <div>
                     <h3 className="text-sm font-bold text-slate-900 mb-1">{item.title}</h3>
                     <p className="text-xs font-medium text-slate-500 leading-relaxed">{item.desc}</p>
                   </div>
                 </div>
              ))}
            </div>
         </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-6">
         <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Pronto para organizar sua operação?</h2>
            <p className="text-[15px] font-medium text-slate-500">Agende uma demonstração com nosso time e veja o Gestifique na prática.</p>
            <div className="pt-2">
              <button 
                 onClick={() => onNavigate('/contato')}
                 className="h-10 px-8 bg-blue-600 text-white text-[13px] font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-sm"
               >
                 Falar com o time
               </button>
            </div>
         </div>
      </section>
    </div>
  );
};
