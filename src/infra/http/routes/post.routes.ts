import { Router } from 'express';
import { PostController } from '../controllers/PostController';

const postRoutes = Router();
const controller = new PostController();

postRoutes.get('/', (req, res) => controller.listPublic(req, res));
postRoutes.get('/:slug', (req, res) => controller.getBySlug(req, res));
postRoutes.post('/:slug/view', (req, res) => controller.trackView(req, res));

export { postRoutes };
