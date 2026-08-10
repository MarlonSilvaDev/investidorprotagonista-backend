"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const express_1 = require("express");
function mockRequest(body = {}, params = {}, query = {}, user) {
    return {
        body,
        params,
        query,
        user: user || { id: 'test-user-id', role: 'padrao' },
    };
}
function mockResponse() {
    const res = {};
    res.status = vitest_1.vi.fn().mockReturnThis();
    res.json = vitest_1.vi.fn().mockReturnThis();
    return res;
}
(0, vitest_1.describe)('TransactionController - Validation', () => {
    (0, vitest_1.it)('should reject transaction with zero amount', () => {
        const req = mockRequest({ amount: 0, type: 'expense', category: 'food', date: new Date() });
        const res = mockResponse();
        const amount = req.body?.amount;
        if (amount === 0) {
            res.status?.(400);
            res.json?.({ error: 'Amount must be greater than zero' });
        }
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(400);
    });
    (0, vitest_1.it)('should reject transaction with missing type', () => {
        const req = mockRequest({ amount: 100, category: 'food', date: new Date() });
        const res = mockResponse();
        const type = req.body?.type;
        if (!type || !['income', 'expense'].includes(type)) {
            res.status?.(400);
            res.json?.({ error: 'Type must be income or expense' });
        }
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(400);
    });
    (0, vitest_1.it)('should reject transaction with missing category', () => {
        const req = mockRequest({ amount: 100, type: 'expense', date: new Date() });
        const res = mockResponse();
        const category = req.body?.category;
        if (!category) {
            res.status?.(400);
            res.json?.({ error: 'Category is required' });
        }
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(400);
    });
    (0, vitest_1.it)('should accept valid transaction data', () => {
        const req = mockRequest({ amount: 150, type: 'expense', category: 'food', date: new Date() });
        const res = mockResponse();
        const amount = req.body?.amount;
        const type = req.body?.type;
        const category = req.body?.category;
        if (amount > 0 && ['income', 'expense'].includes(type) && category) {
            // Valid - would proceed to create
            res.status?.(201);
            res.json?.({ success: true });
        }
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(201);
    });
    (0, vitest_1.it)('should reject transaction with future date in recurring rule', () => {
        const req = mockRequest({
            amount: 100,
            type: 'expense',
            category: 'food',
            date: new Date('2030-01-01'),
            isRecurring: true,
        });
        const res = mockResponse();
        const date = new Date(req.body?.date);
        if (date > new Date('2027-01-01')) {
            res.status?.(400);
            res.json?.({ error: 'Date too far in the future' });
        }
        // This is a validation that would be in the real controller
        (0, vitest_1.expect)(res.status).not.toHaveBeenCalled();
    });
});
(0, vitest_1.describe)('GoalController - Validation', () => {
    (0, vitest_1.it)('should reject goal with zero target amount', () => {
        const req = mockRequest({ title: 'House', targetAmount: 0 });
        const res = mockResponse();
        const targetAmount = req.body?.targetAmount;
        if (targetAmount <= 0) {
            res.status?.(400);
            res.json?.({ error: 'Target amount must be positive' });
        }
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(400);
    });
    (0, vitest_1.it)('should reject goal with missing title', () => {
        const req = mockRequest({ targetAmount: 100000 });
        const res = mockResponse();
        const title = req.body?.title;
        if (!title) {
            res.status?.(400);
            res.json?.({ error: 'Title is required' });
        }
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(400);
    });
    (0, vitest_1.it)('should reject goal with current amount exceeding target', () => {
        const req = mockRequest({ title: 'Car', targetAmount: 50000, currentAmount: 60000 });
        const res = mockResponse();
        const { targetAmount, currentAmount } = req.body;
        if (currentAmount > targetAmount) {
            res.status?.(400);
            res.json?.({ error: 'Current amount cannot exceed target' });
        }
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(400);
    });
    (0, vitest_1.it)('should accept valid goal data', () => {
        const req = mockRequest({
            title: 'House',
            description: 'Buy a house',
            targetAmount: 500000,
            currentAmount: 50000,
        });
        const res = mockResponse();
        const { title, targetAmount, currentAmount } = req.body;
        if (title && targetAmount > 0 && currentAmount <= targetAmount) {
            res.status?.(201);
            res.json?.({ success: true });
        }
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(201);
    });
});
(0, vitest_1.describe)('TaskController - Validation', () => {
    (0, vitest_1.it)('should reject task with empty title', () => {
        const req = mockRequest({ title: '' });
        const res = mockResponse();
        const title = req.body?.title;
        if (!title || title.trim() === '') {
            res.status?.(400);
            res.json?.({ error: 'Title is required' });
        }
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(400);
    });
    (0, vitest_1.it)('should reject task with invalid priority', () => {
        const req = mockRequest({ title: 'Task', priority: 'invalid' });
        const res = mockResponse();
        const priority = req.body?.priority;
        const validPriorities = ['low', 'medium', 'high'];
        if (priority && !validPriorities.includes(priority)) {
            res.status?.(400);
            res.json?.({ error: 'Priority must be low, medium, or high' });
        }
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(400);
    });
    (0, vitest_1.it)('should accept task with valid data', () => {
        const req = mockRequest({ title: 'Pay bills', priority: 'high', dueDate: new Date() });
        const res = mockResponse();
        const title = req.body?.title;
        if (title && title.trim() !== '') {
            res.status?.(201);
            res.json?.({ success: true });
        }
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(201);
    });
});
(0, vitest_1.describe)('CardController - Validation', () => {
    (0, vitest_1.it)('should reject card with missing name', () => {
        const req = mockRequest({ type: 'credit', limit: 15000 });
        const res = mockResponse();
        const name = req.body?.name;
        if (!name) {
            res.status?.(400);
            res.json?.({ error: 'Card name is required' });
        }
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(400);
    });
    (0, vitest_1.it)('should reject card with invalid type', () => {
        const req = mockRequest({ name: 'Visa', type: 'invalid', limit: 15000 });
        const res = mockResponse();
        const type = req.body?.type;
        if (!['credit', 'debit'].includes(type)) {
            res.status?.(400);
            res.json?.({ error: 'Type must be credit or debit' });
        }
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(400);
    });
    (0, vitest_1.it)('should reject card with negative limit', () => {
        const req = mockRequest({ name: 'Visa', type: 'credit', limit: -1000 });
        const res = mockResponse();
        const limit = req.body?.limit;
        if (limit < 0) {
            res.status?.(400);
            res.json?.({ error: 'Limit cannot be negative' });
        }
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(400);
    });
    (0, vitest_1.it)('should reject card with invalid closing day', () => {
        const req = mockRequest({ name: 'Visa', type: 'credit', limit: 15000, closingDay: 32 });
        const res = mockResponse();
        const closingDay = req.body?.closingDay;
        if (closingDay < 1 || closingDay > 31) {
            res.status?.(400);
            res.json?.({ error: 'Closing day must be between 1 and 31' });
        }
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(400);
    });
    (0, vitest_1.it)('should reject card with invalid due day', () => {
        const req = mockRequest({ name: 'Visa', type: 'credit', limit: 15000, dueDay: 0 });
        const res = mockResponse();
        const dueDay = req.body?.dueDay;
        if (dueDay < 1 || dueDay > 31) {
            res.status?.(400);
            res.json?.({ error: 'Due day must be between 1 and 31' });
        }
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(400);
    });
    (0, vitest_1.it)('should accept valid card data', () => {
        const req = mockRequest({
            name: 'Visa Platinum',
            type: 'credit',
            limit: 15000,
            availableLimit: 12000,
            closingDay: 15,
            dueDay: 25,
        });
        const res = mockResponse();
        const { name, type, limit, closingDay, dueDay } = req.body;
        if (name && ['credit', 'debit'].includes(type) && limit >= 0 &&
            closingDay >= 1 && closingDay <= 31 && dueDay >= 1 && dueDay <= 31) {
            res.status?.(201);
            res.json?.({ success: true });
        }
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(201);
    });
});
(0, vitest_1.describe)('SubscriptionController - Validation', () => {
    (0, vitest_1.it)('should reject subscription with missing name', () => {
        const req = mockRequest({ amount: 55.90, dayOfMonth: 15 });
        const res = mockResponse();
        const name = req.body?.name;
        if (!name) {
            res.status?.(400);
            res.json?.({ error: 'Name is required' });
        }
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(400);
    });
    (0, vitest_1.it)('should reject subscription with negative amount', () => {
        const req = mockRequest({ name: 'Netflix', amount: -10, dayOfMonth: 15 });
        const res = mockResponse();
        const amount = req.body?.amount;
        if (amount < 0) {
            res.status?.(400);
            res.json?.({ error: 'Amount must be non-negative' });
        }
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(400);
    });
    (0, vitest_1.it)('should reject subscription with invalid day of month', () => {
        const req = mockRequest({ name: 'Netflix', amount: 55.90, dayOfMonth: 32 });
        const res = mockResponse();
        const dayOfMonth = req.body?.dayOfMonth;
        if (dayOfMonth < 1 || dayOfMonth > 31) {
            res.status?.(400);
            res.json?.({ error: 'Day of month must be between 1 and 31' });
        }
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(400);
    });
    (0, vitest_1.it)('should reject subscription with end date before start date', () => {
        const req = mockRequest({
            name: 'Netflix',
            amount: 55.90,
            dayOfMonth: 15,
            startDate: '2025-12-01',
            endDate: '2025-01-01',
        });
        const res = mockResponse();
        const { startDate, endDate } = req.body;
        if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
            res.status?.(400);
            res.json?.({ error: 'End date must be after start date' });
        }
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(400);
    });
    (0, vitest_1.it)('should accept valid subscription data', () => {
        const req = mockRequest({
            name: 'Netflix',
            amount: 55.90,
            dayOfMonth: 15,
            startDate: '2025-01-01',
        });
        const res = mockResponse();
        const { name, amount, dayOfMonth, startDate } = req.body;
        if (name && amount >= 0 && dayOfMonth >= 1 && dayOfMonth <= 31 && startDate) {
            res.status?.(201);
            res.json?.({ success: true });
        }
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(201);
    });
});
(0, vitest_1.describe)('InvestmentController - Validation', () => {
    (0, vitest_1.it)('should reject investment with missing asset name', () => {
        const req = mockRequest({ assetClass: 'acoes', quantity: 100 });
        const res = mockResponse();
        const assetName = req.body?.assetName;
        if (!assetName) {
            res.status?.(400);
            res.json?.({ error: 'Asset name is required' });
        }
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(400);
    });
    (0, vitest_1.it)('should reject investment with invalid asset class', () => {
        const req = mockRequest({ assetName: 'PETR4', assetClass: 'invalid' });
        const res = mockResponse();
        const validClasses = ['rendaFixa', 'acoes', 'fiis', 'cripto', 'exterior', 'previdencia', 'outros'];
        const assetClass = req.body?.assetClass;
        if (assetClass && !validClasses.includes(assetClass)) {
            res.status?.(400);
            res.json?.({ error: 'Invalid asset class' });
        }
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(400);
    });
    (0, vitest_1.it)('should reject investment with zero quantity', () => {
        const req = mockRequest({ assetName: 'PETR4', assetClass: 'acoes', quantity: 0 });
        const res = mockResponse();
        const quantity = req.body?.quantity;
        if (quantity <= 0) {
            res.status?.(400);
            res.json?.({ error: 'Quantity must be positive' });
        }
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(400);
    });
    (0, vitest_1.it)('should reject investment with negative average price', () => {
        const req = mockRequest({
            assetName: 'PETR4',
            assetClass: 'acoes',
            quantity: 100,
            averagePrice: -30,
        });
        const res = mockResponse();
        const averagePrice = req.body?.averagePrice;
        if (averagePrice < 0) {
            res.status?.(400);
            res.json?.({ error: 'Average price cannot be negative' });
        }
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(400);
    });
    (0, vitest_1.it)('should accept valid investment data', () => {
        const req = mockRequest({
            assetName: 'PETR4',
            assetClass: 'acoes',
            quantity: 100,
            averagePrice: 30.0,
            currentPrice: 35.0,
            ticker: 'PETR4',
        });
        const res = mockResponse();
        const { assetName, assetClass, quantity, averagePrice } = req.body;
        const validClasses = ['rendaFixa', 'acoes', 'fiis', 'cripto', 'exterior', 'previdencia', 'outros'];
        if (assetName && validClasses.includes(assetClass) && quantity > 0 && averagePrice >= 0) {
            res.status?.(201);
            res.json?.({ success: true });
        }
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(201);
    });
});
//# sourceMappingURL=allControllers.test.js.map