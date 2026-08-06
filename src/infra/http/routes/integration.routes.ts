import { Router } from 'express';
import { IntegrationController } from '../controllers/IntegrationController';
import { OpenFinanceController } from '../controllers/OpenFinanceController';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';
import { checkLicensing } from '../middlewares/checkLicensing';

const integrationRoutes = Router();
const integrationController = new IntegrationController();
const openFinanceController = new OpenFinanceController();

// ─── OPEN FINANCE (Opção A: proxy + snapshot; extrato só no Drift) ───
integrationRoutes.post(
  '/open-finance/connect-token',
  ensureAuthenticated,
  checkLicensing,
  (req, res) => openFinanceController.createConnectToken(req, res)
);
integrationRoutes.get(
  '/open-finance/items',
  ensureAuthenticated,
  checkLicensing,
  (req, res) => openFinanceController.listItems(req, res)
);
integrationRoutes.get(
  '/open-finance/items/:itemId/snapshot',
  ensureAuthenticated,
  checkLicensing,
  (req, res) => openFinanceController.getSnapshot(req, res)
);
integrationRoutes.post(
  '/open-finance/items/:itemId/refresh',
  ensureAuthenticated,
  checkLicensing,
  (req, res) => openFinanceController.refreshItem(req, res)
);
integrationRoutes.delete(
  '/open-finance/items/:itemId',
  ensureAuthenticated,
  checkLicensing,
  (req, res) => openFinanceController.deleteItem(req, res)
);

// Legado Pluggy — token redireciona internamente; sync desativado (410)
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

export { integrationRoutes, openFinanceController };
