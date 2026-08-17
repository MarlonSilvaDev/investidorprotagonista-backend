import { Router } from 'express';
import { IntegrationController } from '../modules/integration/IntegrationController';
import { OpenFinanceController } from '../modules/openfinance/OpenFinanceController';
import { ensureAuthenticated } from '../shared/middlewares/ensureAuthenticated';
import { checkLicensing, requirePlan } from '../shared/middlewares/checkLicensing';

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
// ─── WHATSAPP INTEGRATION ───
integrationRoutes.get(
  '/whatsapp/status',
  ensureAuthenticated,
  checkLicensing,
  (req, res) => integrationController.getWhatsAppStatus(req, res)
);
integrationRoutes.post(
  '/whatsapp/link',
  ensureAuthenticated,
  checkLicensing,
  requirePlan('pro_usuario'),
  (req, res) => integrationController.linkWhatsApp(req, res)
);
integrationRoutes.post(
  '/whatsapp/daily-summary',
  ensureAuthenticated,
  checkLicensing,
  requirePlan('pro_usuario'),
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
