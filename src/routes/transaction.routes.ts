import { Router } from 'express';
import { TransactionController } from '../modules/transaction/TransactionController';

const transactionRoutes = Router();
const transactionController = new TransactionController();

transactionRoutes.get('/', transactionController.list);
transactionRoutes.post('/', transactionController.create);
transactionRoutes.put('/:id', transactionController.update);
transactionRoutes.delete('/:id', transactionController.delete);

export { transactionRoutes };
