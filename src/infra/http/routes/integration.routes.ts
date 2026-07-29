import { Router } from 'express';
import { IntegrationController } from '../controllers/IntegrationController';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';
import { checkLicensing } from '../middlewares/checkLicensing';

const integrationRoutes = Router();
const integrationController = new IntegrationController();

// Sincronização Manual (Protegida)
integrationRoutes.get(
  '/pluggy/token',
  ensureAuthenticated,
  checkLicensing,
  (req, res) => integrationController.getPluggyToken(req, res)
);
integrationRoutes.post(
  '/pluggy/sync',
  ensureAuthenticated,
  checkLicensing,
  (req, res) => integrationController.syncPluggyAccount(req, res)
);
integrationRoutes.post(
  '/b3/update-prices',
  ensureAuthenticated,
  checkLicensing,
  (req, res) => integrationController.updateMarketPrices(req, res)
);
integrationRoutes.post(
  '/whatsapp/daily-summary',
  ensureAuthenticated,
  checkLicensing,
  (req, res) => integrationController.sendDailySummary(req, res)
);
integrationRoutes.patch(
  '/notifications/preferences',
  ensureAuthenticated,
  checkLicensing,
  (req, res) => integrationController.updateNotificationPrefs(req, res)
);

// Webhooks (Públicos - Validados por Provedor)
integrationRoutes.post('/webhook/whatsapp', (req, res) =>
  integrationController.whatsappWebhook(req, res)
);

export { integrationRoutes };
