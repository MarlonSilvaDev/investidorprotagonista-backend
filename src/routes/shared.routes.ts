import { Router } from 'express';
import { SharedAccountController } from '../modules/sharedaccount/SharedAccountController';
import { requirePlan } from '../shared/middlewares/checkLicensing';

const sharedRoutes = Router();
const sharedAccountController = new SharedAccountController();

// POST /shared/invite  → envia/cria convite { email } (Requer plano Pro)
sharedRoutes.post('/invite', requirePlan('pro_usuario'), (req, res) => sharedAccountController.invite(req, res));

// POST /shared/accept  → aceita convite { invite_id } (Requer plano Pro)
sharedRoutes.post('/accept', requirePlan('pro_usuario'), (req, res) => sharedAccountController.accept(req, res));

// POST /shared/unlink  → desvincula conta compartilhada ativa (Requer plano Pro)
sharedRoutes.post('/unlink', requirePlan('pro_usuario'), (req, res) => sharedAccountController.unlink(req, res));

// GET  /shared/list | /shared/ → conta ativa + convites pendentes
sharedRoutes.get('/list', (req, res) => sharedAccountController.list(req, res));
sharedRoutes.get('/', (req, res) => sharedAccountController.list(req, res));

export { sharedRoutes };
