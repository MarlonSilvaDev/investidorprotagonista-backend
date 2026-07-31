import { Router } from 'express';
import { CategoryController } from '../controllers/CategoryController';

const categoryRoutes = Router();
const categoryController = new CategoryController();

// GET  /categories          → lista categorias do usuário (filtro ?type=income|expense)
categoryRoutes.get('/', categoryController.list);

// POST /categories          → cria nova categoria personalizada
categoryRoutes.post('/', categoryController.create);

// DELETE /categories/:id    → remove categoria personalizada
categoryRoutes.delete('/:id', categoryController.delete);

// POST /categories/seed     → semeia categorias padrão (usuários legados)
categoryRoutes.post('/seed', categoryController.seed);

export { categoryRoutes };
