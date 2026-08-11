"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postRoutes = void 0;
const express_1 = require("express");
const PostController_1 = require("../../controllers/PostController");
const postRoutes = (0, express_1.Router)();
exports.postRoutes = postRoutes;
const controller = new PostController_1.PostController();
postRoutes.get('/', (req, res) => controller.listPublic(req, res));
postRoutes.get('/:slug', (req, res) => controller.getBySlug(req, res));
postRoutes.post('/:slug/view', (req, res) => controller.trackView(req, res));
//# sourceMappingURL=post.routes.js.map