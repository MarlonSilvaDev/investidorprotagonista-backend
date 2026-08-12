import { Router } from 'express';
import { GoalController } from '../modules/goal/GoalController';

const goalRoutes = Router();
const goalController = new GoalController();

goalRoutes.get('/', goalController.list);
goalRoutes.post('/', goalController.create);
goalRoutes.put('/:id', goalController.update);
goalRoutes.delete('/:id', goalController.delete);

export { goalRoutes };
