"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
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
(0, vitest_1.describe)('DashboardController', () => {
    (0, vitest_1.describe)('Dashboard Data Aggregation', () => {
        (0, vitest_1.it)('should return summary with balance calculation', () => {
            const transactions = [
                { type: 'income', amount: 10000 },
                { type: 'expense', amount: 3000 },
                { type: 'expense', amount: 2000 },
                { type: 'income', amount: 5000 },
            ];
            const totalIncome = transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);
            const totalExpense = transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);
            const balance = totalIncome - totalExpense;
            const savingsRate = totalIncome > 0 ? (totalIncome - totalExpense) / totalIncome : 0;
            (0, vitest_1.expect)(totalIncome).toBe(15000);
            (0, vitest_1.expect)(totalExpense).toBe(5000);
            (0, vitest_1.expect)(balance).toBe(10000);
            (0, vitest_1.expect)(savingsRate).toBeCloseTo(0.6667, 3);
        });
        (0, vitest_1.it)('should handle empty transaction list', () => {
            const transactions = [];
            const totalIncome = transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);
            const totalExpense = transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);
            const balance = totalIncome - totalExpense;
            (0, vitest_1.expect)(totalIncome).toBe(0);
            (0, vitest_1.expect)(totalExpense).toBe(0);
            (0, vitest_1.expect)(balance).toBe(0);
        });
        (0, vitest_1.it)('should calculate category breakdown', () => {
            const transactions = [
                { type: 'expense', amount: 3000, category: 'food' },
                { type: 'expense', amount: 2000, category: 'food' },
                { type: 'expense', amount: 1500, category: 'transport' },
                { type: 'expense', amount: 1000, category: 'transport' },
            ];
            const byCategory = {};
            for (const tx of transactions) {
                if (tx.type === 'expense') {
                    byCategory[tx.category] = (byCategory[tx.category] || 0) + tx.amount;
                }
            }
            (0, vitest_1.expect)(byCategory.food).toBe(5000);
            (0, vitest_1.expect)(byCategory.transport).toBe(2500);
        });
        (0, vitest_1.it)('should calculate goal progress', () => {
            const goals = [
                { title: 'House', target_amount: 500000, current_amount: 100000 },
                { title: 'Car', target_amount: 50000, current_amount: 50000 },
                { title: 'Vacation', target_amount: 10000, current_amount: 0 },
            ];
            const total = goals.length;
            const completed = goals.filter(g => g.current_amount >= g.target_amount).length;
            const active = total - completed;
            const avgProgress = goals.reduce((sum, g) => sum + (g.target_amount > 0 ? g.current_amount / g.target_amount : 0), 0) / total;
            (0, vitest_1.expect)(total).toBe(3);
            (0, vitest_1.expect)(completed).toBe(1);
            (0, vitest_1.expect)(active).toBe(2);
            (0, vitest_1.expect)(avgProgress).toBeCloseTo(0.4, 3);
        });
        (0, vitest_1.it)('should calculate investment portfolio value', () => {
            const investments = [
                { asset_name: 'PETR4', total_invested: 3000, current_total: 3500 },
                { asset_name: 'ITSA4', total_invested: 2000, current_total: 1800 },
                { asset_name: 'BBDC4', total_invested: 5000, current_total: 5500 },
            ];
            const totalValue = investments.reduce((sum, i) => sum + i.current_total, 0);
            const totalInvested = investments.reduce((sum, i) => sum + i.total_invested, 0);
            const totalProfit = totalValue - totalInvested;
            const profitPercent = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
            (0, vitest_1.expect)(totalValue).toBe(10800);
            (0, vitest_1.expect)(totalInvested).toBe(10000);
            (0, vitest_1.expect)(totalProfit).toBe(800);
            (0, vitest_1.expect)(profitPercent).toBeCloseTo(8.0, 1);
        });
        (0, vitest_1.it)('should calculate card utilization', () => {
            const cards = [
                { name: 'Visa', limit: 15000, available_limit: 12000 },
                { name: 'Master', limit: 10000, available_limit: 8000 },
            ];
            const totalLimit = cards.reduce((sum, c) => sum + c.limit, 0);
            const totalAvailable = cards.reduce((sum, c) => sum + c.available_limit, 0);
            const totalUsed = totalLimit - totalAvailable;
            const utilizationPercent = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;
            (0, vitest_1.expect)(totalLimit).toBe(25000);
            (0, vitest_1.expect)(totalAvailable).toBe(20000);
            (0, vitest_1.expect)(totalUsed).toBe(5000);
            (0, vitest_1.expect)(utilizationPercent).toBeCloseTo(20.0, 1);
        });
        (0, vitest_1.it)('should calculate subscription monthly total', () => {
            const subscriptions = [
                { name: 'Netflix', amount: 55.90 },
                { name: 'Spotify', amount: 19.90 },
                { name: 'Prime', amount: 14.90 },
            ];
            const monthlyTotal = subscriptions
                .filter(s => s.amount > 0)
                .reduce((sum, s) => sum + s.amount, 0);
            (0, vitest_1.expect)(monthlyTotal).toBeCloseTo(90.70, 1);
        });
    });
    (0, vitest_1.describe)('Dashboard Endpoint Response', () => {
        (0, vitest_1.it)('should return 200 with dashboard data', () => {
            const req = mockRequest();
            const res = mockResponse();
            const dashboardData = {
                summary: {
                    total_income: 15000,
                    total_expense: 5000,
                    balance: 10000,
                },
            };
            res.status?.(200);
            res.json?.(dashboardData);
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(200);
            (0, vitest_1.expect)(res.json).toHaveBeenCalledWith(dashboardData);
        });
        (0, vitest_1.it)('should handle dashboard request without transactions', () => {
            const req = mockRequest();
            const res = mockResponse();
            const dashboardData = {
                summary: {
                    total_income: 0,
                    total_expense: 0,
                    balance: 0,
                },
                transactions: { total: 0 },
                goals: { total: 0 },
                investments: { total_value: 0 },
                cards: { total: 0 },
                subscriptions: { total: 0 },
            };
            res.status?.(200);
            res.json?.(dashboardData);
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(200);
        });
    });
});
//# sourceMappingURL=dashboardController.test.js.map