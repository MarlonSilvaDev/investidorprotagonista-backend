import { Router } from 'express';
import { IntegrationController } from '../controllers/IntegrationController';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';
import { checkLicensing } from '../middlewares/checkLicensing';

const integrationRoutes = Router();
const integrationController = new IntegrationController();

// Sincronização Manual (Protegida)
integrationRoutes.get('/pluggy/token', ensureAuthenticated, checkLicensing, integrationController.getPluggyToken);
integrationRoutes.post('/pluggy/sync', ensureAuthenticated, checkLicensing, integrationController.syncPluggyAccount);
integrationRoutes.post('/b3/update-prices', ensureAuthenticated, checkLicensing, integrationController.updateMarketPrices);
integrationRoutes.post('/whatsapp/daily-summary', ensureAuthenticated, checkLicensing, integrationController.sendDailySummary);
integrationRoutes.patch('/notifications/preferences', ensureAuthenticated, checkLicensing, integrationController.updateNotificationPrefs);

// Webhooks (Públicos - Validados por Provedor)
integrationRoutes.post('/webhook/whatsapp', integrationController.whatsappWebhook);

export { integrationRoutes };
