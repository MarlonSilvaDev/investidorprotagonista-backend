import { Router } from 'express';
import { SyncController } from '../controllers/SyncController';

const syncRoutes = Router();
const syncController = new SyncController();

syncRoutes.post('/push', (request, response) => syncController.push(request, response));
syncRoutes.get('/pull', (request, response) => syncController.pull(request, response));

export { syncRoutes };
