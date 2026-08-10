"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionRoutes = void 0;
const express_1 = require("express");
const SubscriptionController_1 = require("../controllers/SubscriptionController");
const subscriptionRoutes = (0, express_1.Router)();
exports.subscriptionRoutes = subscriptionRoutes;
const subscriptionController = new SubscriptionController_1.SubscriptionController();
// GET  /subscriptions                    → lista + totais mensais
subscriptionRoutes.get('/', subscriptionController.list);
// GET  /subscriptions/cumulative-totals → gráfico acumulado mês a mês
subscriptionRoutes.get('/cumulative-totals', subscriptionController.getCumulativeTotals);
// POST /subscriptions                    → cria assinatura
subscriptionRoutes.post('/', subscriptionController.create);
// PATCH /subscriptions/:id              → atualiza assinatura
subscriptionRoutes.patch('/:id', subscriptionController.update);
// PATCH /subscriptions/:id/toggle       → ativa/desativa
subscriptionRoutes.patch('/:id/toggle', subscriptionController.toggle);
// DELETE /subscriptions/:id             → remove assinatura
subscriptionRoutes.delete('/:id', subscriptionController.delete);
//# sourceMappingURL=subscription.routes.js.map