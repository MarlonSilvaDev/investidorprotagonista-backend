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
import { IntegrationController } from '../modules/integration/IntegrationController';
import { dashboardRoutes } from './dashboard.routes';
import { syncRoutes } from './sync.routes';
import { analyticsRoutes } from './analytics.routes';
import { categoryRoutes } from './category.routes';
import { sharedRoutes } from './shared.routes';
import { adminRoutes } from './admin.routes';
import { siteRoutes } from './site.routes';
import { ensureAuthenticated } from '../shared/middlewares/ensureAuthenticated';
import { ensureAdmin } from '../shared/middlewares/ensureAdmin';
import { checkLicensing } from '../shared/middlewares/checkLicensing';
import { rateLimiter } from '../shared/middlewares/rateLimiter';

const routes = Router();
const publicIntegrationController = new IntegrationController();

// Rate limiter global (120 req/min)
routes.use(rateLimiter(120));

// Health check / Ping endpoint
routes.get('/health', (_req, res) => res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() }));
routes.get('/ping', (_req, res) => res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() }));

// Rotas Públicas com Rate Limiter Estrito para Auth (20 req/min)
routes.use('/auth', rateLimiter(20), authenticateRoutes);
routes.use('/payment/webhook', paymentRoutes);
// Webhooks públicos (não montar o router inteiro — evita expor pluggy/token sem auth)
routes.post('/integrations/webhook/whatsapp', (req, res) =>
  publicIntegrationController.whatsappWebhook(req, res)
);
routes.post('/integrations/open-finance/webhook', (req, res) =>
  openFinanceController.webhook(req, res)
);
routes.use('/analytics', analyticsRoutes);
routes.use('/site', siteRoutes);

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
