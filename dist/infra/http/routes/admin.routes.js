"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRoutes = void 0;
const express_1 = require("express");
const PostController_1 = require("../../controllers/PostController");
const adminRoutes = (0, express_1.Router)();
exports.adminRoutes = adminRoutes;
const controller = new PostController_1.PostController();
adminRoutes.get('/posts/analytics', (req, res) => controller.analytics(req, res));
adminRoutes.get('/posts', (req, res) => controller.listAdmin(req, res));
adminRoutes.get('/posts/:id', (req, res) => controller.getById(req, res));
adminRoutes.post('/posts', (req, res) => controller.create(req, res));
adminRoutes.put('/posts/:id', (req, res) => controller.update(req, res));
adminRoutes.delete('/posts/:id', (req, res) => controller.delete(req, res));
//# sourceMappingURL=admin.routes.js.map