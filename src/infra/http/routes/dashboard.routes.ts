import { Router } from 'express';
import { DashboardController } from '../../controllers/DashboardController';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';
import { checkLicensing } from '../middlewares/checkLicensing';

const dashboardRoutes = Router();
const dashboardController = new DashboardController();

dashboardRoutes.get('/consolidated', ensureAuthenticated, checkLicensing, dashboardController.getConsolidatedData);

export { dashboardRoutes };
