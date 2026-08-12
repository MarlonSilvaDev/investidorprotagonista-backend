import { Router } from 'express';
import { DashboardController } from '../modules/dashboard/DashboardController';
import { ensureAuthenticated } from '../shared/middlewares/ensureAuthenticated';
import { checkLicensing } from '../shared/middlewares/checkLicensing';

const dashboardRoutes = Router();
const dashboardController = new DashboardController();

dashboardRoutes.get('/consolidated', ensureAuthenticated, checkLicensing, dashboardController.getConsolidatedData);

export { dashboardRoutes };
