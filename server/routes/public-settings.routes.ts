
import { Router } from 'express';
import pool from '../db/connection.js';
import { authMiddleware, requireDeveloper } from '../middlewares/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';

const router = Router();

const DEFAULT_PRICING_SETTINGS = {
  header: {
    title: "Planos para diferentes fases da sua operação.",
    subtitle: "O Gestifique pode ser adaptado ao tamanho da sua equipe, volume de tickets e necessidade de gestão de desempenho."
  },
  plans: [
    {
      id: "inicial",
      name: "Inicial",
      target: "Equipes que estão organizando o fluxo.",
      highlightText: "Para sair da planilha",
      priceLabel: "Sob consulta",
      features: [
        "Atendentes limitados (até 5)",
        "Portal do cliente",
        "Criação de tickets padronizados",
        "Pesquisa de satisfação (CSAT)",
        "Relatórios básicos de operação"
      ],
      highlight: false,
      active: true,
      order: 1
    },
    {
      id: "profissional",
      name: "Profissional",
      target: "Operações B2B que precisam de controle.",
      highlightText: "Mais escolhido",
      priceLabel: "Sob consulta",
      features: [
        "Faixa de atendentes personalizada",
        "SLA Estrito (1ª resposta e resolução)",
        "Dashboard operacional",
        "Configurações operacionais",
        "Base de Conhecimento"
      ],
      highlight: true,
      active: true,
      order: 2
    },
    {
      id: "empresarial",
      name: "Empresarial",
      target: "Múltiplas áreas com alta complexidade.",
      highlightText: "Para operações complexas",
      priceLabel: "Sob consulta",
      features: [
        "Gestão Multi-empresa (Multi-tenant)",
        "Auditoria e Logs refinados",
        "Configuração por equipe",
        "Onboarding Dedicado (Implantação)",
        "Condições de suporte conforme proposta"
      ],
      highlight: false,
      active: true,
      order: 3
    }
  ],
  proposalFactors: [
    "Quantidade de Atendentes",
    "Volume mensal de atendimentos",
    "Multi-empresas e marcas",
    "Necessidade rigorosa de SLA",
    "Portal do Cliente para operações B2B",
    "Treinamento de Implantação"
  ],
  faq: [
    {
      question: "Posso começar pequeno?",
      answer: "Com certeza. Muitos clientes iniciam no Plano Inicial para organizar as demandas primárias e migram conforme ganham escala."
    },
    {
      question: "Existe custo de implantação (Setup)?",
      answer: "Depende da complexidade e do plano. Para operações mais estruturadas, recomendamos um setup dedicado para garantir treinamento e aderência."
    },
    {
      question: "Posso usar para atendimento interno apenas?",
      answer: "Sim! Se você for usar para Help Desk de TI ou DP, sem acesso de cliente externo, podemos adequar nossa proposta."
    },
    {
      question: "O preço é estritamente por usuário?",
      answer: "Avaliamos o escopo técnico todo: volume esperado, necessidades, integrações se houverem. Tudo sob consulta."
    },
    {
      question: "Posso solicitar demonstração antes de contratar?",
      answer: "Sim! É mandatório para que tenhamos plena certeza de que seremos a ferramenta correta para o momento de vocês."
    }
  ],
  cta: {
    title: "Vamos montar sua proposta?",
    subtitle: "Converse com nossa equipe para entendermos seu cenário e desenharmos o plano ideal.",
    buttonText: "Falar com consultor agora"
  }
};

// GET /api/public-settings/pricing - PUBLIC
router.get('/pricing', async (req, res) => {
  try {
    const [rows]: any = await pool.query(
      'SELECT settings_json FROM public_page_settings WHERE page_key = ?',
      ['pricing']
    );

    if (rows.length === 0) {
      return sendSuccess(res, DEFAULT_PRICING_SETTINGS);
    }

    let settings = rows[0].settings_json;
    if (typeof settings === 'string') {
      try {
        settings = JSON.parse(settings);
      } catch (e) {
        return sendSuccess(res, DEFAULT_PRICING_SETTINGS);
      }
    }

    sendSuccess(res, settings);
  } catch (error) {
    console.error('[PublicSettings] Error fetching pricing settings:', error);
    sendSuccess(res, DEFAULT_PRICING_SETTINGS);
  }
});

// PUT /api/public-settings/pricing - DEV ONLY
router.put('/pricing', authMiddleware, requireDeveloper, async (req: any, res) => {
  const { header, plans, proposalFactors, faq, cta } = req.body;

  if (!header || !header.title || !header.subtitle) {
    return sendError(res, 'Título e subtítulo do cabeçalho são obrigatórios.');
  }

  if (!Array.isArray(plans)) {
    return sendError(res, 'Os planos devem ser um array.');
  }

  if (!cta || !cta.title || !cta.buttonText) {
    return sendError(res, 'Dados do CTA incompletos.');
  }

  try {
    const settingsJson = JSON.stringify({
      header,
      plans,
      proposalFactors: Array.isArray(proposalFactors) ? proposalFactors : [],
      faq: Array.isArray(faq) ? faq : [],
      cta
    });

    await pool.query(`
      INSERT INTO public_page_settings (page_key, settings_json, updated_by)
      VALUES ('pricing', ?, ?)
      ON DUPLICATE KEY UPDATE
        settings_json = VALUES(settings_json),
        updated_by = VALUES(updated_by),
        updated_at = NOW()
    `, [settingsJson, req.user.id]);

    sendSuccess(res, JSON.parse(settingsJson), 'Configuração de preços atualizada com sucesso.');
  } catch (error) {
    console.error('[PublicSettings] Error updating pricing settings:', error);
    sendError(res, 'Erro ao salvar configurações de preços.');
  }
});

// POST /api/public-settings/pricing/reset - DEV ONLY
router.post('/pricing/reset', authMiddleware, requireDeveloper, async (req: any, res) => {
  try {
    const settingsJson = JSON.stringify(DEFAULT_PRICING_SETTINGS);

    await pool.query(`
      INSERT INTO public_page_settings (page_key, settings_json, updated_by)
      VALUES ('pricing', ?, ?)
      ON DUPLICATE KEY UPDATE
        settings_json = VALUES(settings_json),
        updated_by = VALUES(updated_by),
        updated_at = NOW()
    `, [settingsJson, req.user.id]);

    sendSuccess(res, DEFAULT_PRICING_SETTINGS, 'Configurações de preços restauradas para o padrão.');
  } catch (error) {
    console.error('[PublicSettings] Error resetting pricing settings:', error);
    sendError(res, 'Erro ao restaurar configurações padrão.');
  }
});

export default router;
