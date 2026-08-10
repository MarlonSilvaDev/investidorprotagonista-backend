"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cardRoutes = void 0;
const express_1 = require("express");
const CardController_1 = require("../controllers/CardController");
const cardRoutes = (0, express_1.Router)();
exports.cardRoutes = cardRoutes;
const cardController = new CardController_1.CardController();
cardRoutes.get('/', cardController.list);
cardRoutes.post('/', cardController.create);
//# sourceMappingURL=card.routes.js.map