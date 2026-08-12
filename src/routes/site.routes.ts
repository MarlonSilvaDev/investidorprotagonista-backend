import { Router } from 'express';
import { FinancialController } from '../modules/site/FinancialController';
import { InvestmentsController } from '../modules/site/InvestmentsController';
import { BooksController } from '../modules/site/BooksController';
import { MarketAssetsController } from '../modules/site/MarketAssetsController';

const siteRoutes = Router();

const financialCtrl = new FinancialController();
const investmentsCtrl = new InvestmentsController();
const booksCtrl = new BooksController();
const marketAssetsCtrl = new MarketAssetsController();

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

export { siteRoutes };
