"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postRoutes = void 0;
const express_1 = require("express");
const FinancialController_1 = require("../modules/site/FinancialController");
const postRoutes = (0, express_1.Router)();
exports.postRoutes = postRoutes;
const controller = new FinancialController_1.FinancialController();
postRoutes.get('/', (req, res) => controller.list(req, res));
postRoutes.get('/:slug', (req, res) => controller.getBySlug(req, res));
//# sourceMappingURL=post.routes.js.map