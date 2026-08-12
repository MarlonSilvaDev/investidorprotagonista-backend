"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRoutes = void 0;
const express_1 = require("express");
const FinancialController_1 = require("../modules/site/FinancialController");
const InvestmentsController_1 = require("../modules/site/InvestmentsController");
const BooksController_1 = require("../modules/site/BooksController");
const MarketAssetsController_1 = require("../modules/site/MarketAssetsController");
const adminRoutes = (0, express_1.Router)();
exports.adminRoutes = adminRoutes;
const financialCtrl = new FinancialController_1.FinancialController();
const investmentsCtrl = new InvestmentsController_1.InvestmentsController();
const booksCtrl = new BooksController_1.BooksController();
const marketAssetsCtrl = new MarketAssetsController_1.MarketAssetsController();
// ─── TABELA FINANCIAL (Artigos / Finanças) ───
adminRoutes.get('/financial', (req, res) => financialCtrl.list(req, res));
adminRoutes.get('/financial/:id', (req, res) => financialCtrl.getById(req, res));
adminRoutes.post('/financial', (req, res) => financialCtrl.create(req, res));
adminRoutes.put('/financial/:id', (req, res) => financialCtrl.update(req, res));
adminRoutes.delete('/financial/:id', (req, res) => financialCtrl.delete(req, res));
// ─── TABELA INVESTMENTS (Artigos / Investimentos) ───
adminRoutes.get('/investments', (req, res) => investmentsCtrl.list(req, res));
adminRoutes.get('/investments/:id', (req, res) => investmentsCtrl.getById(req, res));
adminRoutes.post('/investments', (req, res) => investmentsCtrl.create(req, res));
adminRoutes.put('/investments/:id', (req, res) => investmentsCtrl.update(req, res));
adminRoutes.delete('/investments/:id', (req, res) => investmentsCtrl.delete(req, res));
// ─── TABELA BOOKS (Livros Recomendados) ───
adminRoutes.get('/books', (req, res) => booksCtrl.list(req, res));
adminRoutes.get('/books/:id', (req, res) => booksCtrl.getById(req, res));
adminRoutes.post('/books', (req, res) => booksCtrl.create(req, res));
adminRoutes.put('/books/:id', (req, res) => booksCtrl.update(req, res));
adminRoutes.delete('/books/:id', (req, res) => booksCtrl.delete(req, res));
// ─── TABELA MARKET ASSETS (Cotações de Mercado) ───
adminRoutes.get('/market-assets', (req, res) => marketAssetsCtrl.list(req, res));
adminRoutes.get('/market-assets/:id', (req, res) => marketAssetsCtrl.getById(req, res));
adminRoutes.post('/market-assets', (req, res) => marketAssetsCtrl.create(req, res));
adminRoutes.put('/market-assets/:id', (req, res) => marketAssetsCtrl.update(req, res));
adminRoutes.delete('/market-assets/:id', (req, res) => marketAssetsCtrl.delete(req, res));
// ─── COMPATIBILIDADE / ARTICLES ALIAS ───
adminRoutes.get('/articles', (req, res) => financialCtrl.list(req, res));
adminRoutes.get('/articles/:id', (req, res) => financialCtrl.getById(req, res));
adminRoutes.post('/articles', (req, res) => financialCtrl.create(req, res));
adminRoutes.put('/articles/:id', (req, res) => financialCtrl.update(req, res));
adminRoutes.delete('/articles/:id', (req, res) => financialCtrl.delete(req, res));
//# sourceMappingURL=admin.routes.js.map