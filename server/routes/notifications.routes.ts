import { Router } from 'express';
import notificationsService from '../services/notifications.service.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { unread_only, limit, offset } = req.query;
    
    const items = await notificationsService.listForUser(userId, {
      unread_only: unread_only === 'true',
      limit: limit ? Number(limit) : 20,
      offset: offset ? Number(offset) : 0
    });
    
    const unread_count = await notificationsService.countUnread(userId);
    
    res.json({ items, unread_count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/unread-count', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const count = await notificationsService.countUnread(userId);
    res.json({ count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/read', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const id = Number(req.params.id);
    if (!isNaN(id)) {
      await notificationsService.markAsRead(id, userId);
    }
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/read-all', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    await notificationsService.markAllAsRead(userId);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const id = Number(req.params.id);
    if (!isNaN(id)) {
      await notificationsService.delete(id, userId);
    }
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
