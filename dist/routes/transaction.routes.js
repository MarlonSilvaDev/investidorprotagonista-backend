"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionRoutes = void 0;
const express_1 = require("express");
const TransactionController_1 = require("../modules/transaction/TransactionController");
const transactionRoutes = (0, express_1.Router)();
exports.transactionRoutes = transactionRoutes;
const transactionController = new TransactionController_1.TransactionController();
transactionRoutes.get('/', transactionController.list);
transactionRoutes.post('/', transactionController.create);
transactionRoutes.put('/:id', transactionController.update);
transactionRoutes.delete('/:id', transactionController.delete);
//# sourceMappingURL=transaction.routes.js.map