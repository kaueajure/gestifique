import { Router } from 'express';
import macrosService from '../services/macros.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

const router = Router();

// Listar macros da empresa
router.get('/', async (req: any, res) => {
  try {
    const { empresa_id } = req.currentUser;
    const macros = await macrosService.list(empresa_id);
    sendSuccess(res, macros);
  } catch (error: any) {
    sendError(res, error.message);
  }
});

// Criar macro
router.post('/', async (req: any, res) => {
  try {
    const { empresa_id, id: usuario_id } = req.currentUser;
    const { titulo, conteudo, categoria } = req.body;
    
    if (!titulo || !conteudo) {
      return sendError(res, 'Título e conteúdo são obrigatórios', 400);
    }

    const macroId = await macrosService.create({
      empresa_id,
      titulo,
      conteudo,
      categoria,
      created_by: usuario_id
    });

    sendSuccess(res, { id: macroId }, 'Macro criada com sucesso', 201);
  } catch (error: any) {
    sendError(res, error.message);
  }
});

// Atualizar macro
router.put('/:id', async (req: any, res) => {
  try {
    const { empresa_id } = req.currentUser;
    const { id } = req.params;
    const { titulo, conteudo, categoria, ativo } = req.body;

    await macrosService.update(Number(id), empresa_id, {
      titulo,
      conteudo,
      categoria,
      ativo
    });

    sendSuccess(res, null, 'Macro atualizada com sucesso');
  } catch (error: any) {
    sendError(res, error.message);
  }
});

// Excluir macro
router.delete('/:id', async (req: any, res) => {
  try {
    const { empresa_id } = req.currentUser;
    const { id } = req.params;

    await macrosService.delete(Number(id), empresa_id);
    sendSuccess(res, null, 'Macro excluída com sucesso');
  } catch (error: any) {
    sendError(res, error.message);
  }
});

export default router;
