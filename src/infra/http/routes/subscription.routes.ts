import { Router } from 'express';
import { SubscriptionController } from '../controllers/SubscriptionController';

const subscriptionRoutes = Router();
const subscriptionController = new SubscriptionController();

subscriptionRoutes.get('/', subscriptionController.list);
subscriptionRoutes.post('/', subscriptionController.create);

export { subscriptionRoutes };
