"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.goalRoutes = void 0;
const express_1 = require("express");
const GoalController_1 = require("../controllers/GoalController");
const goalRoutes = (0, express_1.Router)();
exports.goalRoutes = goalRoutes;
const goalController = new GoalController_1.GoalController();
goalRoutes.get('/', goalController.list);
goalRoutes.post('/', goalController.create);
goalRoutes.put('/:id', goalController.update);
//# sourceMappingURL=goal.routes.js.map