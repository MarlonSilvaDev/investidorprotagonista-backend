import { Router } from 'express';
import { InvestmentController } from '../controllers/InvestmentController';

const investmentRoutes = Router();
const investmentController = new InvestmentController();

investmentRoutes.get('/', investmentController.list);
investmentRoutes.post('/sync', investmentController.sync);

export { investmentRoutes };
