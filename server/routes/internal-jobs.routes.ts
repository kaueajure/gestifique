import { Router } from 'express';
import { env } from '../config/env.js';
import { sendError, sendSuccess } from '../utils/response.js';
import { emailOutboxService } from '../services/email-outbox.service.js';

const router = Router();

function isAuthorized(req: any): boolean {
  const configuredToken = String(env.INTERNAL_JOB_TOKEN || '').trim();
  if (!configuredToken) return false;

  const headerToken = String(req.headers['x-internal-job-token'] || '').trim();
  const queryToken = typeof req.query.token === 'string' ? req.query.token.trim() : '';
  return headerToken === configuredToken || queryToken === configuredToken;
}

router.post('/process-email-outbox', async (req, res) => {
  if (!isAuthorized(req)) {
    return sendError(res, 'Nao autorizado', 401);
  }

  try {
    const limit = Number(req.query.limit || req.body?.limit || 20);
    const result = await emailOutboxService.processPending(limit);
    return sendSuccess(res, result, 'Outbox processada');
  } catch (error) {
    console.error('[InternalJobs] Falha ao processar outbox:', error);
    return sendError(res, 'Erro ao processar outbox', 500);
  }
});

router.get('/process-email-outbox', async (req, res) => {
  if (!isAuthorized(req)) {
    return sendError(res, 'Nao autorizado', 401);
  }

  try {
    const limit = Number(req.query.limit || 20);
    const result = await emailOutboxService.processPending(limit);
    return sendSuccess(res, result, 'Outbox processada');
  } catch (error) {
    console.error('[InternalJobs] Falha ao processar outbox:', error);
    return sendError(res, 'Erro ao processar outbox', 500);
  }
});

export default router;
