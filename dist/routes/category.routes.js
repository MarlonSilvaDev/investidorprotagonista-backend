"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryRoutes = void 0;
const express_1 = require("express");
const CategoryController_1 = require("../modules/category/CategoryController");
const categoryRoutes = (0, express_1.Router)();
exports.categoryRoutes = categoryRoutes;
const categoryController = new CategoryController_1.CategoryController();
// GET  /categories          → lista categorias do usuário (filtro ?type=income|expense)
categoryRoutes.get('/', categoryController.list);
// POST /categories          → cria nova categoria personalizada
categoryRoutes.post('/', categoryController.create);
// DELETE /categories/:id    → remove categoria personalizada
categoryRoutes.delete('/:id', categoryController.delete);
// POST /categories/seed     → semeia categorias padrão (usuários legados)
categoryRoutes.post('/seed', categoryController.seed);
//# sourceMappingURL=category.routes.js.map