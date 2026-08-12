"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.siteRoutes = void 0;
const express_1 = require("express");
const FinancialController_1 = require("../modules/site/FinancialController");
const InvestmentsController_1 = require("../modules/site/InvestmentsController");
const BooksController_1 = require("../modules/site/BooksController");
const MarketAssetsController_1 = require("../modules/site/MarketAssetsController");
const siteRoutes = (0, express_1.Router)();
exports.siteRoutes = siteRoutes;
const financialCtrl = new FinancialController_1.FinancialController();
const investmentsCtrl = new InvestmentsController_1.InvestmentsController();
const booksCtrl = new BooksController_1.BooksController();
const marketAssetsCtrl = new MarketAssetsController_1.MarketAssetsController();
// ─── TABELA FINANCIAL (Público) ───
siteRoutes.get('/financial', (req, res) => financialCtrl.list(req, res));
siteRoutes.get('/financial/:slug', (req, res) => financialCtrl.getBySlug(req, res));
// ─── TABELA INVESTMENTS (Público) ───
siteRoutes.get('/investments', (req, res) => investmentsCtrl.list(req, res));
siteRoutes.get('/investments/:slug', (req, res) => investmentsCtrl.getBySlug(req, res));
// ─── TABELA BOOKS (Público) ───
siteRoutes.get('/books', (req, res) => booksCtrl.list(req, res));
// ─── TABELA MARKET ASSETS (Público) ───
siteRoutes.get('/market-assets', (req, res) => marketAssetsCtrl.list(req, res));
//# sourceMappingURL=site.routes.js.map