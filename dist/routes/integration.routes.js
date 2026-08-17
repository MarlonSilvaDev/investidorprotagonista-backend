"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openFinanceController = exports.integrationRoutes = void 0;
const express_1 = require("express");
const IntegrationController_1 = require("../modules/integration/IntegrationController");
const OpenFinanceController_1 = require("../modules/openfinance/OpenFinanceController");
const ensureAuthenticated_1 = require("../shared/middlewares/ensureAuthenticated");
const checkLicensing_1 = require("../shared/middlewares/checkLicensing");
const integrationRoutes = (0, express_1.Router)();
exports.integrationRoutes = integrationRoutes;
const integrationController = new IntegrationController_1.IntegrationController();
const openFinanceController = new OpenFinanceController_1.OpenFinanceController();
exports.openFinanceController = openFinanceController;
// ─── OPEN FINANCE (Opção A: proxy + snapshot; extrato só no Drift) ───
integrationRoutes.post('/open-finance/connect-token', ensureAuthenticated_1.ensureAuthenticated, checkLicensing_1.checkLicensing, (req, res) => openFinanceController.createConnectToken(req, res));
integrationRoutes.get('/open-finance/items', ensureAuthenticated_1.ensureAuthenticated, checkLicensing_1.checkLicensing, (req, res) => openFinanceController.listItems(req, res));
integrationRoutes.get('/open-finance/items/:itemId/snapshot', ensureAuthenticated_1.ensureAuthenticated, checkLicensing_1.checkLicensing, (req, res) => openFinanceController.getSnapshot(req, res));
integrationRoutes.post('/open-finance/items/:itemId/refresh', ensureAuthenticated_1.ensureAuthenticated, checkLicensing_1.checkLicensing, (req, res) => openFinanceController.refreshItem(req, res));
integrationRoutes.delete('/open-finance/items/:itemId', ensureAuthenticated_1.ensureAuthenticated, checkLicensing_1.checkLicensing, (req, res) => openFinanceController.deleteItem(req, res));
// Legado Pluggy — token redireciona internamente; sync desativado (410)
integrationRoutes.get('/pluggy/token', ensureAuthenticated_1.ensureAuthenticated, checkLicensing_1.checkLicensing, (req, res) => integrationController.getPluggyToken(req, res));
integrationRoutes.post('/pluggy/sync', ensureAuthenticated_1.ensureAuthenticated, checkLicensing_1.checkLicensing, (req, res) => integrationController.syncPluggyAccount(req, res));
integrationRoutes.post('/b3/update-prices', ensureAuthenticated_1.ensureAuthenticated, checkLicensing_1.checkLicensing, (req, res) => integrationController.updateMarketPrices(req, res));
// ─── WHATSAPP INTEGRATION ───
integrationRoutes.get('/whatsapp/status', ensureAuthenticated_1.ensureAuthenticated, checkLicensing_1.checkLicensing, (req, res) => integrationController.getWhatsAppStatus(req, res));
integrationRoutes.post('/whatsapp/link', ensureAuthenticated_1.ensureAuthenticated, checkLicensing_1.checkLicensing, (0, checkLicensing_1.requirePlan)('pro_usuario'), (req, res) => integrationController.linkWhatsApp(req, res));
integrationRoutes.post('/whatsapp/daily-summary', ensureAuthenticated_1.ensureAuthenticated, checkLicensing_1.checkLicensing, (0, checkLicensing_1.requirePlan)('pro_usuario'), (req, res) => integrationController.sendDailySummary(req, res));
integrationRoutes.patch('/notifications/preferences', ensureAuthenticated_1.ensureAuthenticated, checkLicensing_1.checkLicensing, (req, res) => integrationController.updateNotificationPrefs(req, res));
// Webhooks (Públicos - Validados por Provedor)
integrationRoutes.post('/webhook/whatsapp', (req, res) => integrationController.whatsappWebhook(req, res));
//# sourceMappingURL=integration.routes.js.map