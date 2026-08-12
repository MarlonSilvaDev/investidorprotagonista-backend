import { Router } from 'express';
import { InvestmentController } from '../modules/investment/InvestmentController';

const investmentRoutes = Router();
const investmentController = new InvestmentController();

investmentRoutes.get('/', (req, res) => investmentController.list(req, res));
investmentRoutes.post('/sync', (req, res) => investmentController.sync(req, res));

export { investmentRoutes };
