"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskRoutes = void 0;
const express_1 = require("express");
const TaskController_1 = require("../../controllers/TaskController");
const taskRoutes = (0, express_1.Router)();
exports.taskRoutes = taskRoutes;
const taskController = new TaskController_1.TaskController();
taskRoutes.get('/', taskController.list);
taskRoutes.post('/', taskController.create);
taskRoutes.put('/:id', taskController.update);
taskRoutes.patch('/:id/toggle', taskController.toggle);
taskRoutes.delete('/:id', taskController.delete);
//# sourceMappingURL=task.routes.js.map