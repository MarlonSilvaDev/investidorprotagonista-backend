import { Router } from 'express';
import { TransactionController } from '../controllers/TransactionController';

const transactionRoutes = Router();
const transactionController = new TransactionController();

transactionRoutes.get('/', transactionController.list);
transactionRoutes.post('/', transactionController.create);
transactionRoutes.delete('/:id', transactionController.delete);

export { transactionRoutes };
