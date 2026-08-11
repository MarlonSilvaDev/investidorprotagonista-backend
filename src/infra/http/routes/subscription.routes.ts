import { Router } from 'express';
import { SubscriptionController } from '../../controllers/SubscriptionController';

const subscriptionRoutes = Router();
const subscriptionController = new SubscriptionController();

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

export { subscriptionRoutes };
