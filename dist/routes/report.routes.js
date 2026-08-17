"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportRoutes = void 0;
const express_1 = require("express");
const ReportController_1 = require("../modules/report/ReportController");
const ensureAuthenticated_1 = require("../shared/middlewares/ensureAuthenticated");
const checkLicensing_1 = require("../shared/middlewares/checkLicensing");
const reportRoutes = (0, express_1.Router)();
exports.reportRoutes = reportRoutes;
const reportController = new ReportController_1.ReportController();
reportRoutes.post('/export', ensureAuthenticated_1.ensureAuthenticated, checkLicensing_1.checkLicensing, (0, checkLicensing_1.requirePlan)('pro_usuario'), (req, res) => reportController.exportReport(req, res));
//# sourceMappingURL=report.routes.js.map