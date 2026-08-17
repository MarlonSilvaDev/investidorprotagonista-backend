import { Router } from 'express';
import { ReportController } from '../modules/report/ReportController';
import { ensureAuthenticated } from '../shared/middlewares/ensureAuthenticated';
import { checkLicensing, requirePlan } from '../shared/middlewares/checkLicensing';

const reportRoutes = Router();
const reportController = new ReportController();

reportRoutes.post(
  '/export',
  ensureAuthenticated,
  checkLicensing,
  requirePlan('pro_usuario'),
  (req, res) => reportController.exportReport(req, res)
);

export { reportRoutes };
