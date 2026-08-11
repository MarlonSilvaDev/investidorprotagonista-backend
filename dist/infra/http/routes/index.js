"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routes = void 0;
const express_1 = require("express");
const authenticate_routes_1 = require("./authenticate.routes");
const transaction_routes_1 = require("./transaction.routes");
const investment_routes_1 = require("./investment.routes");
const goal_routes_1 = require("./goal.routes");
const task_routes_1 = require("./task.routes");
const card_routes_1 = require("./card.routes");
const subscription_routes_1 = require("./subscription.routes");
const payment_routes_1 = require("./payment.routes");
const integration_routes_1 = require("./integration.routes");
const IntegrationController_1 = require("../../controllers/IntegrationController");
const dashboard_routes_1 = require("./dashboard.routes");
const sync_routes_1 = require("./sync.routes");
const analytics_routes_1 = require("./analytics.routes");
const category_routes_1 = require("./category.routes");
const shared_routes_1 = require("./shared.routes");
const post_routes_1 = require("./post.routes");
const admin_routes_1 = require("./admin.routes");
const ensureAuthenticated_1 = require("../middlewares/ensureAuthenticated");
const ensureAdmin_1 = require("../middlewares/ensureAdmin");
const checkLicensing_1 = require("../middlewares/checkLicensing");
const routes = (0, express_1.Router)();
exports.routes = routes;
const publicIntegrationController = new IntegrationController_1.IntegrationController();
// Rotas Públicas
routes.use('/auth', authenticate_routes_1.authenticateRoutes);
routes.use('/payment/webhook', payment_routes_1.paymentRoutes);
// Webhooks públicos (não montar o router inteiro — evita expor pluggy/token sem auth)
routes.post('/integrations/webhook/whatsapp', (req, res) => publicIntegrationController.whatsappWebhook(req, res));
routes.post('/integrations/open-finance/webhook', (req, res) => integration_routes_1.openFinanceController.webhook(req, res));
routes.use('/analytics', analytics_routes_1.analyticsRoutes);
routes.use('/posts', post_routes_1.postRoutes);
// Admin (auth + role administrador) — sem checkLicensing
routes.use('/admin', ensureAuthenticated_1.ensureAuthenticated, ensureAdmin_1.ensureAdmin, admin_routes_1.adminRoutes);
// Rotas Protegidas por Auth + Licenciamento
routes.use('/payment', ensureAuthenticated_1.ensureAuthenticated, payment_routes_1.paymentRoutes);
routes.use('/integrations', ensureAuthenticated_1.ensureAuthenticated, checkLicensing_1.checkLicensing, integration_routes_1.integrationRoutes);
routes.use('/dashboard', ensureAuthenticated_1.ensureAuthenticated, checkLicensing_1.checkLicensing, dashboard_routes_1.dashboardRoutes);
routes.use('/sync', ensureAuthenticated_1.ensureAuthenticated, checkLicensing_1.checkLicensing, sync_routes_1.syncRoutes);
routes.use('/transactions', ensureAuthenticated_1.ensureAuthenticated, checkLicensing_1.checkLicensing, transaction_routes_1.transactionRoutes);
routes.use('/investments', ensureAuthenticated_1.ensureAuthenticated, checkLicensing_1.checkLicensing, investment_routes_1.investmentRoutes);
routes.use('/goals', ensureAuthenticated_1.ensureAuthenticated, checkLicensing_1.checkLicensing, goal_routes_1.goalRoutes);
routes.use('/tasks', ensureAuthenticated_1.ensureAuthenticated, checkLicensing_1.checkLicensing, task_routes_1.taskRoutes);
routes.use('/cards', ensureAuthenticated_1.ensureAuthenticated, checkLicensing_1.checkLicensing, card_routes_1.cardRoutes);
routes.use('/subscriptions', ensureAuthenticated_1.ensureAuthenticated, checkLicensing_1.checkLicensing, subscription_routes_1.subscriptionRoutes);
routes.use('/categories', ensureAuthenticated_1.ensureAuthenticated, checkLicensing_1.checkLicensing, category_routes_1.categoryRoutes);
routes.use('/shared', ensureAuthenticated_1.ensureAuthenticated, checkLicensing_1.checkLicensing, shared_routes_1.sharedRoutes);
//# sourceMappingURL=index.js.map