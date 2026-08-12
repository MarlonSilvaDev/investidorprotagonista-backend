"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRoutes = void 0;
const express_1 = require("express");
const PaymentController_1 = require("../modules/payment/PaymentController");
const ensureAuthenticated_1 = require("../shared/middlewares/ensureAuthenticated");
const paymentRoutes = (0, express_1.Router)();
exports.paymentRoutes = paymentRoutes;
const paymentController = new PaymentController_1.PaymentController();
// Checkout Session (Stripe)
paymentRoutes.post('/checkout', ensureAuthenticated_1.ensureAuthenticated, paymentController.createCheckoutSession);
// Verify In-App Purchase
paymentRoutes.post('/verify-purchase', ensureAuthenticated_1.ensureAuthenticated, paymentController.verifyPurchase);
// Direct Plan Update / Upgrade
paymentRoutes.post('/update-plan', ensureAuthenticated_1.ensureAuthenticated, paymentController.updatePlan);
// Webhook (Sem ensureAuthenticated, Stripe chama direto)
paymentRoutes.post('/webhook/stripe', paymentController.stripeWebhook);
//# sourceMappingURL=payment.routes.js.map