import { Router } from 'express';
import { CardController } from '../controllers/CardController';

const cardRoutes = Router();
const cardController = new CardController();

cardRoutes.get('/', cardController.list);
cardRoutes.post('/', cardController.create);
cardRoutes.put('/:id', cardController.update);
cardRoutes.delete('/:id', cardController.delete);

export { cardRoutes };
