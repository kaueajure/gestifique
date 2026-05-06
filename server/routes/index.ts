import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './users.routes';
import ticketRoutes from './tickets.routes';
import companyRoutes from './companies.routes';
import dashboardRoutes from './dashboard.routes';
import profileRoutes from './profile.routes';
import logsRoutes from './logs.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/tickets', ticketRoutes);
router.use('/companies', companyRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/profile', profileRoutes);
router.use('/logs', logsRoutes);

export default router;
