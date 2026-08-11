"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.investmentRoutes = void 0;
const express_1 = require("express");
const InvestmentController_1 = require("../../controllers/InvestmentController");
const investmentRoutes = (0, express_1.Router)();
exports.investmentRoutes = investmentRoutes;
const investmentController = new InvestmentController_1.InvestmentController();
investmentRoutes.get('/', investmentController.list);
investmentRoutes.post('/sync', investmentController.sync);
//# sourceMappingURL=investment.routes.js.map