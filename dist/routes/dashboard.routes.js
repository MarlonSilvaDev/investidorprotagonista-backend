"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRoutes = void 0;
const express_1 = require("express");
const DashboardController_1 = require("../modules/dashboard/DashboardController");
const ensureAuthenticated_1 = require("../shared/middlewares/ensureAuthenticated");
const checkLicensing_1 = require("../shared/middlewares/checkLicensing");
const dashboardRoutes = (0, express_1.Router)();
exports.dashboardRoutes = dashboardRoutes;
const dashboardController = new DashboardController_1.DashboardController();
dashboardRoutes.get('/consolidated', ensureAuthenticated_1.ensureAuthenticated, checkLicensing_1.checkLicensing, dashboardController.getConsolidatedData);
//# sourceMappingURL=dashboard.routes.js.map