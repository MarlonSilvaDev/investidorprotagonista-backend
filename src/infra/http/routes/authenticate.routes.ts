import { Router } from 'express';
import { AuthenticateController } from '../controllers/AuthenticateController';

const authenticateRoutes = Router();
const authenticateController = new AuthenticateController();

authenticateRoutes.post('/login', authenticateController.login);
authenticateRoutes.post('/register', authenticateController.register);

export { authenticateRoutes };
