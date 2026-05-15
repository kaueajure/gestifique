import { Router } from 'express';
import  authRoutes from  './auth.routes.js';
import  userRoutes from  './users.routes.js';
import  ticketRoutes from  './tickets.routes.js';
import  companyRoutes from  './companies.routes.js';
import  dashboardRoutes from  './dashboard.routes.js';
import  profileRoutes from  './profile.routes.js';
import  logsRoutes from  './logs.routes.js';
import  attachmentRoutes from  './attachments.routes.js';
import  reportsRoutes from  './reports.routes.js';
import  notificationsRoutes from  './notifications.routes.js';
import  macrosRoutes from './macros.routes.js';
import  satisfactionRoutes from './satisfaction.routes.js';
import  automationsRoutes from './automations.routes.js';
import { emailChannelsRoutes } from './email-channels.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/tickets', ticketRoutes);
router.use('/companies', companyRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/profile', profileRoutes);
router.use('/logs', logsRoutes);
router.use('/attachments', attachmentRoutes);
router.use('/reports', reportsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/macros', macrosRoutes);
router.use('/satisfaction', satisfactionRoutes);
router.use('/automations', automationsRoutes);
router.use('/', emailChannelsRoutes); // mounted at /api/companies/:companyId/email-channels

export default router;
