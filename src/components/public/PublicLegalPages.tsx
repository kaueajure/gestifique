import React from 'react';
import { Database, FileText, Lock, Mail, ShieldCheck, Users } from 'lucide-react';

const lastUpdated = '11 de junho de 2026';
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
        eyebrow="Privacidade e dados"
        title="Política de Privacidade"
        description="Esta Política descreve, de forma específica, como o Gestifique coleta, usa, armazena, protege, compartilha e exclui dados tratados na plataforma, incluindo dados recebidos por integrações de e-mail."
        icon={ShieldCheck}
      />

      <main className="px-6 py-12 bg-white">
        <div className="max-w-4xl mx-auto grid gap-10">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: Lock, title: 'Acesso restrito', text: 'Controles por perfil, autenticação e registros de auditoria.' },
              { icon: Database, title: 'Finalidade limitada', text: 'Dados usados para atendimento, tickets, SLA e suporte.' },
              { icon: Mail, title: 'Canal de privacidade', text: contactEmail },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <item.icon size={18} className="mb-3 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">{item.text}</p>
              </div>
            ))}
          </div>

          <Section title="1. Controlador e escopo desta Política">
            <p>
              O Gestifique é uma plataforma SaaS de gestão de atendimento, tickets, SLA, portal do cliente,
              base de conhecimento, relatórios, automações e integrações de e-mail. Esta Política se aplica ao
              site público, ao painel administrativo, ao portal do cliente, às APIs, aos canais de e-mail e às
              integrações OAuth disponibilizadas pela plataforma.
            </p>
            <p>
              A empresa contratante é responsável pela base de dados operacional inserida por seus usuários,
              clientes e representantes. O Gestifique trata esses dados para executar a plataforma, manter a
              segurança, prestar suporte e cumprir obrigações legais e contratuais.
            </p>
          </Section>

          <Section title="2. Dados coletados e tratados">
            <BulletList
              items={[
                'Dados de identificação e acesso: nome, e-mail, telefone, cargo, empresa, perfil, permissões, status da conta e registros de autenticação.',
                'Dados corporativos: nome da empresa, CNPJ, domínio, contatos de suporte, configurações de canais, identidade visual e preferências operacionais.',
                'Dados de atendimento: tickets, mensagens, comentários internos, anexos, categorias, prioridades, filas, responsáveis, SLA, eventos, histórico de alterações e satisfação do cliente.',
                'Dados técnicos e de segurança: IP, user agent, data e hora de acesso, logs de erro, logs de auditoria, tentativas de autenticação e informações necessárias para prevenção de abuso.',
                'Dados de e-mail e integrações: endereço conectado, escopos autorizados, identificadores de mensagens, remetente, destinatários, assunto, corpo, anexos, cabeçalhos de conversa, status OAuth e tokens criptografados.',
              ]}
            />
          </Section>

          <Section title="3. Finalidades de uso">
            <BulletList
              items={[
                'Criar, organizar, classificar, distribuir, acompanhar e encerrar tickets de atendimento.',
                'Vincular mensagens recebidas por e-mail a tickets novos ou existentes, evitando duplicidade por Message-ID, In-Reply-To, References e outros metadados de conversa.',
                'Permitir que usuários autorizados respondam tickets e acompanhem o histórico de atendimento.',
                'Controlar SLA, prioridades, responsáveis, filas, auditoria, relatórios e indicadores operacionais.',
                'Enviar mensagens transacionais, respostas de tickets, notificações e e-mails necessários à operação.',
                'Manter segurança, diagnosticar falhas, prevenir spam, abuso, fraude, acesso indevido e uso incompatível com estes documentos.',
              ]}
            />
          </Section>

          <Section title="4. Uso de Google OAuth e Gmail API">
            <p>
              Quando uma empresa conecta uma conta Google/Gmail ao Gestifique, solicitamos autorização OAuth
              apenas para as funcionalidades de atendimento vinculadas ao canal de e-mail. A conta conectada deve
              pertencer à empresa ou ser usada com autorização válida da empresa.
            </p>
            <p>
              O escopo <strong>https://www.googleapis.com/auth/gmail.send</strong> é usado somente para enviar
              respostas de tickets com o remetente autorizado. O escopo <strong>https://www.googleapis.com/auth/gmail.readonly</strong>,
              quando habilitado, é usado somente para ler mensagens recebidas, remetente, destinatários, assunto,
              corpo, anexos e cabeçalhos necessários para criar tickets, atualizar tickets existentes e preservar
              o histórico de atendimento.
            </p>
            <p>
              O Gestifique não usa dados do Gmail para publicidade, venda de dados, perfilamento, enriquecimento
              comercial, treinamento de modelos de terceiros ou qualquer finalidade não relacionada ao atendimento.
              Não excluímos e-mails da conta Google, não alteramos labels, não acessamos contatos e não solicitamos
              escopos mais amplos como <strong>https://mail.google.com/</strong> ou <strong>gmail.modify</strong>
              quando escopos mais restritos forem suficientes.
            </p>
            <p>
              O uso e a transferência de dados recebidos das APIs do Google para qualquer outro aplicativo seguem
              a Política de Dados do Usuário dos Serviços de API do Google, incluindo os requisitos de Uso Limitado.
              Dados do Google são usados exclusivamente para fornecer ou melhorar funcionalidades visíveis ao usuário
              dentro do Gestifique.
            </p>
          </Section>

          <Section title="5. Tokens, credenciais e segurança de integrações">
            <p>
              Tokens OAuth e credenciais sensíveis são armazenados de forma criptografada quando precisam ser
              preservados para manter a conexão. O acesso a esses dados é restrito a processos necessários para
              autenticar chamadas à API, renovar tokens, enviar mensagens, ler mensagens autorizadas e registrar
              eventos operacionais.
            </p>
            <p>
              A empresa pode desconectar uma conta Google pelo painel do canal. A desconexão remove a capacidade
              operacional do Gestifique de usar aquela autorização, sem impedir que a empresa também revogue o acesso
              diretamente na conta Google.
            </p>
          </Section>

          <Section title="6. Compartilhamento e subprocessadores">
            <p>
              Não vendemos dados pessoais ou dados de e-mail. Podemos compartilhar dados somente com fornecedores
              necessários à execução da plataforma, como hospedagem, banco de dados, armazenamento de arquivos,
              envio de e-mails, monitoramento, suporte técnico e provedores de autenticação. Esses fornecedores
              devem tratar os dados apenas conforme instruções compatíveis com esta Política.
            </p>
            <p>
              Também poderemos divulgar dados quando necessário para cumprir lei, ordem de autoridade competente,
              defesa de direitos, investigação de incidentes, prevenção de abuso ou proteção da segurança da plataforma.
            </p>
          </Section>

          <Section title="7. Retenção, exclusão e minimização">
            <p>
              Mantemos dados pelo tempo necessário para prestar o serviço, preservar histórico de atendimento,
              cumprir obrigações legais ou contratuais, resolver disputas, manter logs de auditoria e proteger a
              segurança da plataforma. Dados de tickets e mensagens podem ser mantidos enquanto a empresa mantiver
              a conta ativa ou enquanto houver necessidade operacional legítima.
            </p>
            <p>
              Mediante solicitação válida, avaliaremos exclusão, anonimização, bloqueio ou exportação de dados,
              respeitando obrigações legais, antifraude, auditoria, segurança e continuidade da relação contratual.
            </p>
          </Section>

          <Section title="8. Direitos dos titulares e canal de solicitação">
            <p>
              Conforme a legislação aplicável, titulares podem solicitar confirmação de tratamento, acesso, correção,
              anonimização, portabilidade, bloqueio, eliminação, informação sobre compartilhamento e revisão de decisões
              automatizadas, quando aplicável. Solicitações devem ser enviadas para <strong>{contactEmail}</strong>.
            </p>
            <p>
              Poderemos solicitar informações adicionais para confirmar a identidade do solicitante e proteger dados
              contra acesso indevido.
            </p>
          </Section>

          <Section title="9. Uso proibido dos dados">
            <p>
              Dados tratados pelo Gestifique, incluindo dados de Gmail, não podem ser usados por clientes ou usuários
              para spam, assédio, fraude, discriminação, scraping, venda de listas, envio de conteúdo ilegal, violação
              de direitos de terceiros ou qualquer finalidade incompatível com atendimento e suporte legítimos.
            </p>
          </Section>

          <Section title="10. Alterações nesta Política">
            <p>
              Podemos atualizar esta Política para refletir mudanças legais, técnicas, operacionais ou de integrações.
              A versão vigente ficará disponível nesta página, com data de atualização. Mudanças relevantes poderão
              ser comunicadas por meios razoáveis dentro da plataforma ou canais de contato cadastrados.
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
        eyebrow="Termos contratuais"
        title="Termos de Uso"
        description="Estes Termos definem regras rigorosas para acesso, uso, responsabilidades, limitações e integrações do Gestifique por empresas, usuários internos e clientes finais autorizados."
        icon={FileText}
      />

      <main className="px-6 py-12 bg-white">
        <div className="max-w-4xl mx-auto grid gap-10">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
            <div className="flex items-start gap-3">
              <Users size={20} className="mt-0.5 shrink-0 text-blue-700" />
              <p className="text-sm font-semibold leading-relaxed text-blue-900">
                Ao acessar ou usar o Gestifique, você confirma que leu, compreendeu e aceita estes Termos.
                Se estiver atuando em nome de uma empresa, declara possuir autorização para vinculá-la a estes Termos.
              </p>
            </div>
          </div>

          <Section title="1. Objeto e natureza do serviço">
            <p>
              O Gestifique é uma plataforma SaaS para gestão de atendimento, tickets, SLA, portal do cliente,
              usuários, permissões, relatórios, base de conhecimento, anexos, automações e integrações de e-mail.
              A plataforma não substitui consultoria jurídica, contábil, médica, financeira ou qualquer atividade
              regulada que dependa de profissional habilitado.
            </p>
          </Section>

          <Section title="2. Elegibilidade, contas e permissões">
            <BulletList
              items={[
                'A empresa é responsável por autorizar usuários, definir perfis, revisar permissões e remover acessos indevidos ou desnecessários.',
                'Cada usuário deve usar credenciais próprias, manter senha em sigilo e comunicar qualquer suspeita de acesso não autorizado.',
                'Administradores respondem por ações realizadas por usuários que tenham recebido permissões dentro da conta da empresa.',
                'É proibido compartilhar credenciais, burlar autenticação, explorar falhas, testar invasão sem autorização ou acessar dados de terceiros sem permissão.',
              ]}
            />
          </Section>

          <Section title="3. Responsabilidade pelo conteúdo">
            <p>
              A empresa e seus usuários são responsáveis por dados, mensagens, anexos, informações de clientes,
              bases de conhecimento e demais conteúdos inseridos, importados, encaminhados ou transmitidos pela
              plataforma. O Gestifique pode remover, bloquear ou restringir conteúdo quando houver indícios de uso
              ilícito, abusivo, inseguro ou incompatível com estes Termos.
            </p>
          </Section>

          <Section title="4. Uso permitido e condutas proibidas">
            <p>
              O Gestifique deve ser usado exclusivamente para atendimento, suporte, gestão operacional e comunicação
              legítima com clientes ou usuários autorizados. É proibido usar a plataforma para spam, phishing, malware,
              coleta indevida de dados, venda de listas, assédio, fraude, violação de propriedade intelectual, envio de
              conteúdo ilícito ou tentativa de degradar, sobrecarregar ou comprometer a segurança do serviço.
            </p>
          </Section>

          <Section title="5. Integrações de e-mail, Google OAuth e Gmail API">
            <p>
              A empresa pode conectar contas de e-mail por encaminhamento, IMAP ou Google OAuth, conforme recursos
              disponíveis. Ao conectar uma conta Google, a empresa declara que possui direito e autorização para usar
              esse endereço como canal de atendimento e que informará seus usuários e clientes sobre o tratamento de
              mensagens relacionado a tickets.
            </p>
            <p>
              A integração Gmail pode usar permissões estritamente necessárias para enviar respostas e, quando habilitado,
              ler mensagens recebidas para criar ou atualizar tickets. O Gestifique não se compromete a aprovar, manter
              ou garantir disponibilidade de APIs de terceiros. Google, provedores de e-mail, DNS, hospedagem e demais
              serviços externos podem impor limites, verificações, suspensões, mudanças de política ou indisponibilidades.
            </p>
          </Section>

          <Section title="6. Obrigações da empresa sobre e-mail e dados de clientes">
            <BulletList
              items={[
                'Obter autorizações internas necessárias antes de conectar caixas de e-mail corporativas ou pessoais usadas para atendimento.',
                'Não conectar caixas de e-mail que contenham dados sem relação com a operação de suporte, salvo se houver base legal e autorização adequadas.',
                'Não usar o Gestifique para monitoramento secreto, vigilância indevida ou tratamento incompatível com leis de privacidade e trabalho.',
                'Manter informações de clientes corretas e remover dados desnecessários, excessivos ou inseridos por engano.',
              ]}
            />
          </Section>

          <Section title="7. Segurança e resposta a incidentes">
            <p>
              Empregamos medidas razoáveis de segurança técnica e administrativa, mas nenhum sistema é imune a riscos.
              A empresa deve manter dispositivos, senhas, contas Google, DNS, provedores de e-mail e usuários sob
              controle adequado. Incidentes, vazamentos suspeitos ou acessos não autorizados devem ser comunicados
              imediatamente pelo e-mail <strong>{contactEmail}</strong>.
            </p>
          </Section>

          <Section title="8. Funcionalidades beta e mudanças no produto">
            <p>
              Recursos identificados como beta, teste, experimental ou pré-lançamento podem apresentar instabilidade,
              limitações, mudanças de comportamento, suspensão ou remoção sem aviso prévio. O uso desses recursos
              ocorre por conta e risco da empresa, especialmente quando depender de APIs externas em processo de
              verificação ou aprovação.
            </p>
          </Section>

          <Section title="9. Planos, cobrança, suspensão e cancelamento">
            <p>
              Condições comerciais, preços, limites, cobrança, suporte, vigência e cancelamento podem ser definidos
              em proposta, contrato ou página de planos vigente. Poderemos suspender ou limitar acesso em caso de
              inadimplência, risco de segurança, abuso, violação destes Termos, ordem legal ou uso que comprometa a
              plataforma ou terceiros.
            </p>
          </Section>

          <Section title="10. Propriedade intelectual">
            <p>
              O Gestifique, incluindo marca, software, código, design, textos, fluxos, documentação, interfaces,
              relatórios e recursos, pertence aos seus titulares. Estes Termos concedem apenas licença limitada,
              revogável, não exclusiva e intransferível para uso da plataforma durante a relação contratual.
            </p>
          </Section>

          <Section title="11. Disponibilidade e limitações de responsabilidade">
            <p>
              Buscamos manter a plataforma disponível, segura e funcional, mas não garantimos operação ininterrupta
              ou livre de falhas. Na máxima extensão permitida por lei, não respondemos por lucros cessantes, perda
              de receita, danos indiretos, falhas de terceiros, indisponibilidade de APIs externas, erros de configuração
              da empresa, dados inseridos incorretamente ou decisões tomadas com base em informações cadastradas pelos usuários.
            </p>
          </Section>

          <Section title="12. Privacidade e proteção de dados">
            <p>
              O tratamento de dados pessoais e dados de Gmail é regulado pela Política de Privacidade do Gestifique,
              que integra estes Termos. Ao usar a plataforma, a empresa declara possuir base legal adequada para inserir,
              conectar, encaminhar, armazenar e tratar dados de seus usuários, clientes e canais de atendimento.
            </p>
          </Section>

          <Section title="13. Alterações dos Termos">
            <p>
              Podemos atualizar estes Termos para refletir mudanças legais, técnicas, operacionais, comerciais ou de
              segurança. O uso continuado da plataforma após a publicação da nova versão indica aceitação dos Termos
              atualizados, salvo quando exigida aceitação expressa.
            </p>
          </Section>

          <Section title="14. Contato">
            <p>
              Dúvidas sobre estes Termos, privacidade, segurança, contratos ou uso da plataforma devem ser enviadas
              para <strong>{contactEmail}</strong>.
            </p>
          </Section>
        </div>
      </main>
    </div>
  );
};
