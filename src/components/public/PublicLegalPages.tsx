import React from 'react';
import { Database, FileText, Lock, Mail, ShieldCheck, Users } from 'lucide-react';

const lastUpdated = '10 de junho de 2026';
const contactEmail = 'contato@gestifique.com.br';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-3">
    <h2 className="text-lg font-bold tracking-tight text-slate-900">{title}</h2>
    <div className="space-y-3 text-sm font-medium leading-relaxed text-slate-600">
      {children}
    </div>
  </section>
);

const BulletList = ({ items }: { items: string[] }) => (
  <ul className="space-y-2 pl-5 list-disc">
    {items.map((item) => (
      <li key={item}>{item}</li>
    ))}
  </ul>
);

const LegalHero = ({
  eyebrow,
  title,
  description,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ElementType;
}) => (
  <section className="pt-20 pb-12 px-6 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-700">
        <Icon size={14} />
        {eyebrow}
      </div>
      <div className="space-y-4">
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="max-w-3xl text-base lg:text-lg font-medium leading-relaxed text-slate-500">
          {description}
        </p>
        <p className="text-xs font-semibold text-slate-400">Última atualização: {lastUpdated}</p>
      </div>
    </div>
  </section>
);

export const PublicPrivacyPolicyPage = () => {
  return (
    <div className="flex flex-col bg-white">
      <LegalHero
        eyebrow="Privacidade"
        title="Política de Privacidade"
        description="Esta Política explica como o Gestifique coleta, utiliza, armazena e protege dados pessoais e dados operacionais tratados na plataforma."
        icon={ShieldCheck}
      />

      <main className="px-6 py-12 bg-white">
        <div className="max-w-4xl mx-auto grid gap-10">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: Lock, title: 'Acesso controlado', text: 'Dados ficam disponíveis apenas para usuários autorizados.' },
              { icon: Database, title: 'Uso operacional', text: 'Tratamos dados para entregar atendimento, tickets e relatórios.' },
              { icon: Mail, title: 'Contato oficial', text: contactEmail },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <item.icon size={18} className="mb-3 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">{item.text}</p>
              </div>
            ))}
          </div>

          <Section title="1. Quem somos">
            <p>
              O Gestifique é uma plataforma de gestão de atendimento, tickets, SLA, portal do cliente,
              relatórios, automações e comunicação por e-mail. Esta Política se aplica ao site público,
              ao painel administrativo, ao portal do cliente e às integrações disponibilizadas pela plataforma.
            </p>
          </Section>

          <Section title="2. Dados que podemos coletar">
            <BulletList
              items={[
                'Dados de cadastro, como nome, e-mail, telefone, empresa, cargo e perfil de acesso.',
                'Dados corporativos, como nome da empresa, CNPJ, domínio, dados de suporte e preferências visuais.',
                'Dados de atendimento, como tickets, mensagens, comentários internos, anexos, categorias, prioridades, status e histórico de eventos.',
                'Dados técnicos, como endereço IP, registros de autenticação, logs de auditoria, data e hora de ações e informações de dispositivo/navegador.',
                'Dados de integrações, como contas de e-mail conectadas, status de conexão OAuth, escopos autorizados e metadados necessários para envio de mensagens.',
              ]}
            />
          </Section>

          <Section title="3. Como usamos os dados">
            <BulletList
              items={[
                'Criar, organizar, distribuir e acompanhar chamados de atendimento.',
                'Permitir comunicação entre atendentes, gestores e clientes autorizados.',
                'Controlar prazos de SLA, prioridades, filas, responsáveis e histórico operacional.',
                'Gerar dashboards, relatórios, indicadores e registros de auditoria.',
                'Enviar notificações, respostas de tickets e mensagens transacionais relacionadas à operação.',
                'Manter a segurança da plataforma, prevenir abuso, diagnosticar erros e cumprir obrigações legais ou contratuais.',
              ]}
            />
          </Section>

          <Section title="4. Uso de Google OAuth e Gmail API">
            <p>
              Quando uma empresa escolhe conectar uma conta Google/Gmail ao Gestifique, solicitamos autorização
              OAuth para identificar a conta conectada e enviar respostas de tickets pelo endereço de e-mail autorizado.
            </p>
            <p>
              O Gestifique usa o escopo <strong>https://www.googleapis.com/auth/gmail.send</strong> somente para
              enviar mensagens pela Gmail API quando um usuário autorizado responde a um ticket. A plataforma não
              lê, lista, pesquisa, altera, exclui ou monitora a caixa de entrada do Gmail do usuário.
            </p>
            <p>
              Tokens OAuth são armazenados de forma criptografada e usados apenas para manter a conexão de envio.
              A empresa pode desconectar a conta Google a qualquer momento na configuração do canal de e-mail.
            </p>
          </Section>

          <Section title="5. Compartilhamento de dados">
            <p>
              Não vendemos dados pessoais. Podemos compartilhar dados apenas quando necessário para operar a
              plataforma, hospedar o sistema, enviar e-mails, armazenar arquivos, prestar suporte, cumprir contratos
              ou atender obrigações legais. Fornecedores e operadores devem tratar dados somente conforme instruções
              compatíveis com esta Política.
            </p>
          </Section>

          <Section title="6. Armazenamento e segurança">
            <p>
              Adotamos controles técnicos e administrativos razoáveis para proteger dados contra acesso não
              autorizado, perda, alteração ou divulgação indevida. Entre esses controles estão autenticação,
              permissões por perfil, logs de auditoria, criptografia de tokens sensíveis e restrição de acesso
              conforme necessidade operacional.
            </p>
          </Section>

          <Section title="7. Retenção e exclusão">
            <p>
              Mantemos dados enquanto forem necessários para prestar os serviços, preservar histórico de atendimento,
              cumprir obrigações legais, resolver disputas ou atender obrigações contratuais. Solicitações de exclusão
              serão avaliadas considerando requisitos legais, segurança, auditoria e continuidade operacional.
            </p>
          </Section>

          <Section title="8. Direitos dos titulares">
            <p>
              Conforme a legislação aplicável, titulares podem solicitar confirmação de tratamento, acesso, correção,
              portabilidade, anonimização, bloqueio, exclusão ou informações sobre compartilhamento de dados. Para
              solicitações, entre em contato pelo e-mail <strong>{contactEmail}</strong>.
            </p>
          </Section>

          <Section title="9. Alterações nesta Política">
            <p>
              Podemos atualizar esta Política para refletir mudanças na plataforma, nas integrações, em requisitos
              legais ou em práticas de segurança. A versão vigente será publicada nesta página com a data de atualização.
            </p>
          </Section>
        </div>
      </main>
    </div>
  );
};

export const PublicTermsOfUsePage = () => {
  return (
    <div className="flex flex-col bg-white">
      <LegalHero
        eyebrow="Termos"
        title="Termos de Uso"
        description="Estes Termos regulam o acesso e uso do Gestifique por empresas, administradores, atendentes, gestores e clientes finais autorizados."
        icon={FileText}
      />

      <main className="px-6 py-12 bg-white">
        <div className="max-w-4xl mx-auto grid gap-10">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
            <div className="flex items-start gap-3">
              <Users size={20} className="mt-0.5 shrink-0 text-blue-700" />
              <p className="text-sm font-semibold leading-relaxed text-blue-900">
                Ao acessar ou utilizar o Gestifique, você declara que leu, compreendeu e concorda com estes Termos.
                Se estiver usando a plataforma em nome de uma empresa, você declara ter autorização para representá-la.
              </p>
            </div>
          </div>

          <Section title="1. Objeto">
            <p>
              O Gestifique é uma plataforma SaaS para gestão de atendimento, abertura e acompanhamento de tickets,
              controle de SLA, portal do cliente, relatórios, usuários, permissões, base de conhecimento, anexos,
              automações e integrações de comunicação.
            </p>
          </Section>

          <Section title="2. Cadastro e responsabilidades da conta">
            <BulletList
              items={[
                'A empresa contratante é responsável por manter dados cadastrais corretos e atualizados.',
                'Usuários devem proteger suas credenciais e não compartilhar acesso individual.',
                'Administradores são responsáveis por conceder, revisar e remover permissões de usuários.',
                'A empresa é responsável pelas informações inseridas por seus usuários, clientes e representantes.',
              ]}
            />
          </Section>

          <Section title="3. Uso permitido">
            <p>
              A plataforma deve ser usada para finalidades legítimas de atendimento, suporte, gestão operacional,
              relacionamento com clientes e controle interno. É proibido usar o Gestifique para spam, abuso,
              fraude, violação de direitos de terceiros, envio de conteúdo ilícito ou tentativa de interferir na
              segurança, disponibilidade ou integridade do serviço.
            </p>
          </Section>

          <Section title="4. Conteúdo e dados inseridos">
            <p>
              A empresa mantém a titularidade dos dados e conteúdos que insere na plataforma. Ao utilizar o
              Gestifique, a empresa autoriza o tratamento desses dados na medida necessária para executar o serviço,
              prestar suporte, manter segurança, gerar relatórios e cumprir obrigações legais ou contratuais.
            </p>
          </Section>

          <Section title="5. Integrações de e-mail e Google OAuth">
            <p>
              A empresa pode configurar canais de e-mail por encaminhamento ou por Google OAuth, quando disponível.
              Ao conectar uma conta Google, a empresa declara ter autorização para usar aquele endereço como canal
              de atendimento e envio de respostas.
            </p>
            <p>
              A integração Gmail OAuth usa permissão de envio para que respostas de tickets saiam pelo e-mail
              autorizado. O Gestifique não garante aprovação, disponibilidade ou continuidade de integrações de
              terceiros, que podem depender de políticas, verificações e limites definidos pelo Google.
            </p>
          </Section>

          <Section title="6. Funcionalidades beta">
            <p>
              Recursos identificados como beta, teste ou pré-lançamento podem sofrer alterações, instabilidades,
              limitações, suspensão temporária ou remoção. O uso desses recursos deve ser feito com ciência de que
              a funcionalidade ainda está em validação técnica e operacional.
            </p>
          </Section>

          <Section title="7. Planos, cobrança e contratação">
            <p>
              Condições comerciais, preços, limites, forma de pagamento, vigência, cancelamento e suporte podem ser
              definidos em proposta, contrato, pedido comercial ou página de planos vigente. Em caso de divergência,
              o instrumento comercial aceito pela empresa prevalecerá sobre informações genéricas do site.
            </p>
          </Section>

          <Section title="8. Disponibilidade e suporte">
            <p>
              Empregamos esforços razoáveis para manter a plataforma disponível e segura. Podem ocorrer interrupções
              por manutenção, atualizações, incidentes técnicos, falhas de fornecedores, indisponibilidade de APIs
              externas, caso fortuito ou força maior.
            </p>
          </Section>

          <Section title="9. Propriedade intelectual">
            <p>
              O Gestifique, incluindo marca, interface, código, fluxos, design, documentação, textos e recursos da
              plataforma, pertence aos seus titulares e é protegido por leis de propriedade intelectual. Nenhum direito
              é transferido ao usuário além da licença limitada de uso da plataforma conforme estes Termos.
            </p>
          </Section>

          <Section title="10. Limitação de responsabilidade">
            <p>
              Na máxima extensão permitida pela lei, o Gestifique não será responsável por danos indiretos, lucros
              cessantes, perda de receita, perda de dados causada por uso inadequado, falhas de terceiros, indisponibilidade
              de integrações externas ou decisões operacionais tomadas com base em informações inseridas pelos usuários.
            </p>
          </Section>

          <Section title="11. Privacidade">
            <p>
              O tratamento de dados pessoais é descrito na Política de Privacidade do Gestifique, que integra estes
              Termos. O uso da plataforma pressupõe ciência sobre as práticas de coleta, uso, armazenamento, segurança
              e compartilhamento descritas naquela política.
            </p>
          </Section>

          <Section title="12. Contato">
            <p>
              Para dúvidas sobre estes Termos, privacidade, segurança ou uso da plataforma, entre em contato pelo
              e-mail <strong>{contactEmail}</strong>.
            </p>
          </Section>
        </div>
      </main>
    </div>
  );
};
