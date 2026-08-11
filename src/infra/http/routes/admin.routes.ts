import { Router } from 'express';
import { PostController } from '../../controllers/PostController';

const adminRoutes = Router();
const controller = new PostController();

adminRoutes.get('/posts/analytics', (req, res) => controller.analytics(req, res));
adminRoutes.get('/posts', (req, res) => controller.listAdmin(req, res));
adminRoutes.get('/posts/:id', (req, res) => controller.getById(req, res));
adminRoutes.post('/posts', (req, res) => controller.create(req, res));
adminRoutes.put('/posts/:id', (req, res) => controller.update(req, res));
adminRoutes.delete('/posts/:id', (req, res) => controller.delete(req, res));

export { adminRoutes };
