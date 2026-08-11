import { Router } from 'express';
import { TaskController } from '../../controllers/TaskController';

const taskRoutes = Router();
const taskController = new TaskController();

taskRoutes.get('/', taskController.list);
taskRoutes.post('/', taskController.create);
taskRoutes.put('/:id', taskController.update);
taskRoutes.patch('/:id/toggle', taskController.toggle);
taskRoutes.delete('/:id', taskController.delete);

export { taskRoutes };
