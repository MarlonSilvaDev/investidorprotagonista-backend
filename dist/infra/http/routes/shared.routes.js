"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sharedRoutes = void 0;
const express_1 = require("express");
const SharedAccountController_1 = require("../../controllers/SharedAccountController");
const sharedRoutes = (0, express_1.Router)();
exports.sharedRoutes = sharedRoutes;
const sharedAccountController = new SharedAccountController_1.SharedAccountController();
// POST /shared/invite  → envia/cria convite { email }
sharedRoutes.post('/invite', (req, res) => sharedAccountController.invite(req, res));
// POST /shared/accept  → aceita convite { invite_id }
sharedRoutes.post('/accept', (req, res) => sharedAccountController.accept(req, res));
// POST /shared/unlink  → desvincula conta compartilhada ativa
sharedRoutes.post('/unlink', (req, res) => sharedAccountController.unlink(req, res));
// GET  /shared/list | /shared/ → conta ativa + convites pendentes
sharedRoutes.get('/list', (req, res) => sharedAccountController.list(req, res));
sharedRoutes.get('/', (req, res) => sharedAccountController.list(req, res));
//# sourceMappingURL=shared.routes.js.map