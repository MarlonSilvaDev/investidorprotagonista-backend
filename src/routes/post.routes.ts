import { Router } from 'express';
import { FinancialController } from '../modules/site/FinancialController';

const postRoutes = Router();
const controller = new FinancialController();

postRoutes.get('/', (req, res) => controller.list(req, res));
postRoutes.get('/:slug', (req, res) => controller.getBySlug(req, res));

export { postRoutes };
