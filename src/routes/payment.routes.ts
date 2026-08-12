import { Router } from 'express';
import { PaymentController } from '../modules/payment/PaymentController';
import { ensureAuthenticated } from '../shared/middlewares/ensureAuthenticated';

const paymentRoutes = Router();
const paymentController = new PaymentController();

// Checkout Session (Stripe)
paymentRoutes.post(
  '/checkout',
  ensureAuthenticated,
  paymentController.createCheckoutSession
);

// Verify In-App Purchase
paymentRoutes.post(
  '/verify-purchase',
  ensureAuthenticated,
  paymentController.verifyPurchase
);

// Direct Plan Update / Upgrade
paymentRoutes.post(
  '/update-plan',
  ensureAuthenticated,
  paymentController.updatePlan
);

// Webhook (Sem ensureAuthenticated, Stripe chama direto)
paymentRoutes.post(
  '/webhook/stripe',
  paymentController.stripeWebhook
);

export { paymentRoutes };
