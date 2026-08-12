"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sharedRoutes = void 0;
const express_1 = require("express");
const SharedAccountController_1 = require("../modules/sharedaccount/SharedAccountController");
const checkLicensing_1 = require("../shared/middlewares/checkLicensing");
const sharedRoutes = (0, express_1.Router)();
exports.sharedRoutes = sharedRoutes;
const sharedAccountController = new SharedAccountController_1.SharedAccountController();
// POST /shared/invite  → envia/cria convite { email } (Requer plano Pro)
sharedRoutes.post('/invite', (0, checkLicensing_1.requirePlan)('pro_usuario'), (req, res) => sharedAccountController.invite(req, res));
// POST /shared/accept  → aceita convite { invite_id } (Requer plano Pro)
sharedRoutes.post('/accept', (0, checkLicensing_1.requirePlan)('pro_usuario'), (req, res) => sharedAccountController.accept(req, res));
// POST /shared/unlink  → desvincula conta compartilhada ativa (Requer plano Pro)
sharedRoutes.post('/unlink', (0, checkLicensing_1.requirePlan)('pro_usuario'), (req, res) => sharedAccountController.unlink(req, res));
// GET  /shared/list | /shared/ → conta ativa + convites pendentes
sharedRoutes.get('/list', (req, res) => sharedAccountController.list(req, res));
sharedRoutes.get('/', (req, res) => sharedAccountController.list(req, res));
//# sourceMappingURL=shared.routes.js.map