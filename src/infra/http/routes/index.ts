import { Router } from 'express';
import { authenticateRoutes } from './authenticate.routes';
import { transactionRoutes } from './transaction.routes';
import { investmentRoutes } from './investment.routes';
import { goalRoutes } from './goal.routes';
import { taskRoutes } from './task.routes';
import { cardRoutes } from './card.routes';
import { subscriptionRoutes } from './subscription.routes';
import { paymentRoutes } from './payment.routes';
import { integrationRoutes, openFinanceController } from './integration.routes';
import { IntegrationController } from '../controllers/IntegrationController';
import { dashboardRoutes } from './dashboard.routes';
import { syncRoutes } from './sync.routes';
import { analyticsRoutes } from './analytics.routes';
import { categoryRoutes } from './category.routes';
import { sharedRoutes } from './shared.routes';
import { postRoutes } from './post.routes';
import { adminRoutes } from './admin.routes';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';
import { ensureAdmin } from '../middlewares/ensureAdmin';
import { checkLicensing } from '../middlewares/checkLicensing';

const routes = Router();
const publicIntegrationController = new IntegrationController();

// Rotas Públicas
routes.use('/auth', authenticateRoutes);
routes.use('/payment/webhook', paymentRoutes);
// Webhooks públicos (não montar o router inteiro — evita expor pluggy/token sem auth)
routes.post('/integrations/webhook/whatsapp', (req, res) =>
  publicIntegrationController.whatsappWebhook(req, res)
);
routes.post('/integrations/open-finance/webhook', (req, res) =>
  openFinanceController.webhook(req, res)
);
routes.use('/analytics', analyticsRoutes);
routes.use('/posts', postRoutes);

// Admin (auth + role administrador) — sem checkLicensing
routes.use('/admin', ensureAuthenticated, ensureAdmin, adminRoutes);

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
routes.use('/shared', ensureAuthenticated, checkLicensing, sharedRoutes);

export { routes };
