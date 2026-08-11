import { Router } from 'express';
import { SharedAccountController } from '../../controllers/SharedAccountController';

const sharedRoutes = Router();
const sharedAccountController = new SharedAccountController();

// POST /shared/invite  → envia/cria convite { email }
sharedRoutes.post('/invite', (req, res) => sharedAccountController.invite(req, res));

// POST /shared/accept  → aceita convite { invite_id }
sharedRoutes.post('/accept', (req, res) => sharedAccountController.accept(req, res));

// POST /shared/unlink  → desvincula conta compartilhada ativa
sharedRoutes.post('/unlink', (req, res) => sharedAccountController.unlink(req, res));

// GET  /shared/list | /shared/ → conta ativa + convites pendentes
sharedRoutes.get('/list', (req, res) => sharedAccountController.list(req, res));
sharedRoutes.get('/', (req, res) => sharedAccountController.list(req, res));

export { sharedRoutes };
