import { Router } from 'express';
import { PaymentController } from '../controllers/PaymentController';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';

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

// Webhook (Sem ensureAuthenticated, Stripe chama direto)
paymentRoutes.post(
  '/webhook/stripe', 
  paymentController.stripeWebhook
);

export { paymentRoutes };
