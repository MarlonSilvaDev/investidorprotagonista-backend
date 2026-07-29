import { Router } from 'express';
import { AuthenticateController } from '../controllers/AuthenticateController';

const authenticateRoutes = Router();
const authenticateController = new AuthenticateController();

authenticateRoutes.post('/login', (req, res) => authenticateController.login(req, res));
authenticateRoutes.post('/register', (req, res) => authenticateController.register(req, res));
authenticateRoutes.post('/google', (req, res) => authenticateController.google(req, res));
authenticateRoutes.post('/refresh', (req, res) => authenticateController.refresh(req, res));

export { authenticateRoutes };
