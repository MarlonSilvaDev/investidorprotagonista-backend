import { Router } from 'express';
import { authenticateRoutes } from './authenticate.routes';
import { transactionRoutes } from './transaction.routes';
import { investmentRoutes } from './investment.routes';
import { goalRoutes } from './goal.routes';
import { taskRoutes } from './task.routes';
import { cardRoutes } from './card.routes';
import { subscriptionRoutes } from './subscription.routes';
import { paymentRoutes } from './payment.routes';
import { integrationRoutes } from './integration.routes';
import { dashboardRoutes } from './dashboard.routes';
import { syncRoutes } from './sync.routes';
import { analyticsRoutes } from './analytics.routes';
import { categoryRoutes } from './category.routes';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';
import { checkLicensing } from '../middlewares/checkLicensing';

const routes = Router();

// Rotas Públicas
routes.use('/auth', authenticateRoutes);
routes.use('/payment/webhook', paymentRoutes);
routes.use('/integrations/webhook', integrationRoutes); // Webhooks públicos
routes.use('/analytics', analyticsRoutes);

// Rotas Protegidas por Auth + Licenciamento
routes.use('/payment', ensureAuthenticated, paymentRoutes);
routes.use('/integrations', ensureAuthenticated, checkLicensing, integrationRoutes);
routes.use('/dashboard', ensureAuthenticated, checkLicensing, dashboardRoutes);
routes.use('/sync', ensureAuthenticated, checkLicensing, syncRoutes);
routes.use('/transactions', ensureAuthenticated, checkLicensing, transactionRoutes);
routes.use('/investments', ensureAuthenticated, checkLicensing, investmentRoutes);
routes.use('/goals', ensureAuthenticated, checkLicensing, goalRoutes);
routes.use('/tasks', ensureAuthenticated, checkLicensing, taskRoutes);
routes.use('/cards', ensureAuthenticated, checkLicensing, cardRoutes);
routes.use('/subscriptions', ensureAuthenticated, checkLicensing, subscriptionRoutes);
routes.use('/categories', ensureAuthenticated, checkLicensing, categoryRoutes);

export { routes };
