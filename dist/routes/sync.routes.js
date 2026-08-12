"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncRoutes = void 0;
const express_1 = require("express");
const SyncController_1 = require("../modules/sync/SyncController");
const syncRoutes = (0, express_1.Router)();
exports.syncRoutes = syncRoutes;
const syncController = new SyncController_1.SyncController();
syncRoutes.post('/push', (request, response) => syncController.push(request, response));
syncRoutes.get('/pull', (request, response) => syncController.pull(request, response));
//# sourceMappingURL=sync.routes.js.map