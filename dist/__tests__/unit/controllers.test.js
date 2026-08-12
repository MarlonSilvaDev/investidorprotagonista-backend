"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
// ─── MOCK SUPABASE ───
const { mockSupabase } = vitest_1.vi.hoisted(() => {
    const createBuilder = () => {
        const builder = {
            select: vitest_1.vi.fn().mockImplementation(() => builder),
            insert: vitest_1.vi.fn().mockImplementation(() => builder),
            update: vitest_1.vi.fn().mockImplementation(() => builder),
            delete: vitest_1.vi.fn().mockImplementation(() => builder),
            eq: vitest_1.vi.fn().mockImplementation(() => builder),
            neq: vitest_1.vi.fn().mockImplementation(() => builder),
            is: vitest_1.vi.fn().mockImplementation(() => builder),
            in: vitest_1.vi.fn().mockImplementation(() => builder),
            not: vitest_1.vi.fn().mockImplementation(() => builder),
            or: vitest_1.vi.fn().mockImplementation(() => builder),
            gte: vitest_1.vi.fn().mockImplementation(() => builder),
            lte: vitest_1.vi.fn().mockImplementation(() => builder),
            match: vitest_1.vi.fn().mockImplementation(() => builder),
            order: vitest_1.vi.fn().mockImplementation(() => builder),
            single: vitest_1.vi.fn().mockResolvedValue({ data: null, error: null }),
            maybeSingle: vitest_1.vi.fn().mockResolvedValue({ data: null, error: null }),
        };
        return builder;
    };
    return {
        mockSupabase: {
            from: vitest_1.vi.fn().mockImplementation(createBuilder),
            createBuilder,
        },
    };
});
vitest_1.vi.mock('../../config/supabase', () => ({
    supabase: mockSupabase,
    supabaseAdmin: mockSupabase,
}));
// ─── DASHBOARD CONTROLLER ───
const DashboardController_1 = require("../../modules/dashboard/DashboardController");
function createMockRequestAndResponse(overrides = {}) {
    const mockReq = {
        user: { id: 'user-dashboard-test' },
        ...overrides,
    };
    const mockRes = {
        json: vitest_1.vi.fn().mockReturnThis(),
        status: vitest_1.vi.fn().mockReturnThis(),
        send: vitest_1.vi.fn().mockReturnThis(),
    };
    return { mockReq, mockRes };
}
(0, vitest_1.describe)('DashboardController', () => {
    let controller;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        mockSupabase.from.mockReset();
        mockSupabase.from.mockImplementation(mockSupabase.createBuilder);
        controller = new DashboardController_1.DashboardController();
    });
    (0, vitest_1.describe)('getConsolidatedData', () => {
        (0, vitest_1.it)('should return consolidated data with balance, income, expense', async () => {
            const mockTransactions = [
                { amount: 5000, type: 'income', category: 'salary', date: '2025-01-01' },
                { amount: 1500, type: 'expense', category: 'food', date: '2025-01-05' },
                { amount: 500, type: 'expense', category: 'transport', date: '2025-01-10' },
            ];
            const mockInvestments = [
                { asset_class: 'stocks', current_total: 10000, total_invested: 8000 },
                { asset_class: 'bonds', current_total: 5000, total_invested: 4500 },
            ];
            const mockGoals = [
                { title: 'Emergency Fund', target_amount: 10000, current_amount: 5000 },
            ];
            // Mock transactions query
            mockSupabase.from
                .mockReturnValueOnce({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockResolvedValueOnce({ data: mockTransactions }),
            });
            // Mock investments query
            mockSupabase.from
                .mockReturnValueOnce({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockResolvedValueOnce({ data: mockInvestments }),
            });
            // Mock goals query
            mockSupabase.from
                .mockReturnValueOnce({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockResolvedValueOnce({ data: mockGoals }),
            });
            const { mockReq, mockRes } = createMockRequestAndResponse();
            await controller.getConsolidatedData(mockReq, mockRes);
            (0, vitest_1.expect)(mockRes.json).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                summary: vitest_1.expect.objectContaining({
                    income: 5000,
                    expense: 2000,
                    balance: 3000,
                    totalInvested: vitest_1.expect.any(Number),
                }),
                charts: vitest_1.expect.objectContaining({
                    expensesByCategory: vitest_1.expect.any(Array),
                    assetAllocation: vitest_1.expect.any(Array),
                    goalsProgress: vitest_1.expect.any(Array),
                }),
            }));
        });
        (0, vitest_1.it)('should handle empty transactions', async () => {
            mockSupabase.from
                .mockReturnValueOnce({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockResolvedValueOnce({ data: [] }),
            });
            mockSupabase.from
                .mockReturnValueOnce({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockResolvedValueOnce({ data: [] }),
            });
            mockSupabase.from
                .mockReturnValueOnce({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockResolvedValueOnce({ data: [] }),
            });
            const { mockReq, mockRes } = createMockRequestAndResponse();
            await controller.getConsolidatedData(mockReq, mockRes);
            (0, vitest_1.expect)(mockRes.json).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                summary: {
                    balance: 0,
                    income: 0,
                    expense: 0,
                    totalInvested: 0,
                },
            }));
        });
        (0, vitest_1.it)('should calculate expense categories correctly', async () => {
            const transactions = [
                { amount: 100, type: 'expense', category: 'food', date: '2025-01-01' },
                { amount: 200, type: 'expense', category: 'food', date: '2025-01-02' },
                { amount: 50, type: 'expense', category: 'transport', date: '2025-01-03' },
            ];
            mockSupabase.from
                .mockReturnValueOnce({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockResolvedValueOnce({ data: transactions }),
            });
            mockSupabase.from
                .mockReturnValueOnce({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockResolvedValueOnce({ data: [] }),
            });
            mockSupabase.from
                .mockReturnValueOnce({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockResolvedValueOnce({ data: [] }),
            });
            const { mockReq, mockRes } = createMockRequestAndResponse();
            await controller.getConsolidatedData(mockReq, mockRes);
            const charts = mockRes.json.mock.calls[0][0].charts;
            const foodCategory = charts.expensesByCategory.find((c) => c.name === 'food');
            const transportCategory = charts.expensesByCategory.find((c) => c.name === 'transport');
            (0, vitest_1.expect)(foodCategory.value).toBe(300);
            (0, vitest_1.expect)(transportCategory.value).toBe(50);
        });
        (0, vitest_1.it)('should handle null data from Supabase', async () => {
            mockSupabase.from
                .mockReturnValueOnce({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockResolvedValueOnce({ data: null }),
            });
            mockSupabase.from
                .mockReturnValueOnce({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockResolvedValueOnce({ data: null }),
            });
            mockSupabase.from
                .mockReturnValueOnce({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockResolvedValueOnce({ data: null }),
            });
            const { mockReq, mockRes } = createMockRequestAndResponse();
            await controller.getConsolidatedData(mockReq, mockRes);
            (0, vitest_1.expect)(mockRes.json).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                summary: {
                    balance: 0,
                    income: 0,
                    expense: 0,
                    totalInvested: 0,
                },
            }));
        });
        (0, vitest_1.it)('should calculate goals progress percentage', async () => {
            const goals = [
                { title: 'House', target_amount: 100000, current_amount: 25000 },
                { title: 'Car', target_amount: 50000, current_amount: 50000 },
            ];
            mockSupabase.from
                .mockReturnValueOnce({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockResolvedValueOnce({ data: [] }),
            });
            mockSupabase.from
                .mockReturnValueOnce({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockResolvedValueOnce({ data: [] }),
            });
            mockSupabase.from
                .mockReturnValueOnce({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockResolvedValueOnce({ data: goals }),
            });
            const { mockReq, mockRes } = createMockRequestAndResponse();
            await controller.getConsolidatedData(mockReq, mockRes);
            const progress = mockRes.json.mock.calls[0][0].charts.goalsProgress;
            (0, vitest_1.expect)(progress[0].percent).toBe(25);
            (0, vitest_1.expect)(progress[1].percent).toBe(100);
        });
    });
});
// ─── TRANSACTION CONTROLLER ───
const TransactionController_1 = require("../../modules/transaction/TransactionController");
(0, vitest_1.describe)('TransactionController', () => {
    let controller;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        mockSupabase.from.mockReset();
        mockSupabase.from.mockImplementation(mockSupabase.createBuilder);
        controller = new TransactionController_1.TransactionController();
    });
    (0, vitest_1.describe)('list', () => {
        (0, vitest_1.it)('should return transactions for authenticated user', async () => {
            const mockData = [
                { id: '1', user_id: 'user-1', title: 'Salary', amount: 5000, type: 'income' },
                { id: '2', user_id: 'user-1', title: 'Groceries', amount: 200, type: 'expense' },
            ];
            mockSupabase.from.mockReturnValue({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockReturnThis(),
                is: vitest_1.vi.fn().mockReturnThis(),
                order: vitest_1.vi.fn().mockResolvedValue({ data: mockData, error: null }),
            });
            const { mockReq, mockRes } = createMockRequestAndResponse();
            await controller.list(mockReq, mockRes);
            (0, vitest_1.expect)(mockRes.json).toHaveBeenCalledWith(mockData);
        });
        (0, vitest_1.it)('should return 400 on Supabase error', async () => {
            mockSupabase.from.mockReturnValue({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockReturnThis(),
                is: vitest_1.vi.fn().mockReturnThis(),
                order: vitest_1.vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
            });
            const { mockReq, mockRes } = createMockRequestAndResponse();
            await controller.list(mockReq, mockRes);
            (0, vitest_1.expect)(mockRes.status).toHaveBeenCalledWith(400);
            (0, vitest_1.expect)(mockRes.json).toHaveBeenCalledWith({ message: 'DB error' });
        });
    });
    (0, vitest_1.describe)('create', () => {
        (0, vitest_1.it)('should create a transaction and return 201', async () => {
            const transactionData = {
                id: 'tx-1',
                user_id: 'user-1',
                title: 'Groceries',
                amount: 150,
                type: 'expense',
                category: 'food',
                date: '2025-01-15',
                description: 'Monthly groceries',
            };
            mockSupabase.from.mockReturnValue({
                insert: vitest_1.vi.fn().mockReturnThis(),
                select: vitest_1.vi.fn().mockReturnThis(),
                single: vitest_1.vi.fn().mockResolvedValue({ data: transactionData, error: null }),
            });
            const { mockReq, mockRes } = createMockRequestAndResponse({
                body: {
                    title: 'Groceries',
                    amount: 150,
                    type: 'expense',
                    category: 'food',
                    date: '2025-01-15',
                    description: 'Monthly groceries',
                },
            });
            await controller.create(mockReq, mockRes);
            (0, vitest_1.expect)(mockRes.status).toHaveBeenCalledWith(201);
            (0, vitest_1.expect)(mockRes.json).toHaveBeenCalledWith(transactionData);
        });
        (0, vitest_1.it)('should return 400 on insert error', async () => {
            mockSupabase.from.mockReturnValue({
                insert: vitest_1.vi.fn().mockReturnThis(),
                select: vitest_1.vi.fn().mockReturnThis(),
                single: vitest_1.vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
            });
            const { mockReq, mockRes } = createMockRequestAndResponse({
                body: { title: '', amount: 0, type: 'invalid' },
            });
            await controller.create(mockReq, mockRes);
            (0, vitest_1.expect)(mockRes.status).toHaveBeenCalledWith(400);
            (0, vitest_1.expect)(mockRes.json).toHaveBeenCalledWith({ message: 'Insert failed' });
        });
    });
    (0, vitest_1.describe)('delete', () => {
        (0, vitest_1.it)('should delete a transaction and return 204', async () => {
            mockSupabase.from.mockReturnValue({
                delete: vitest_1.vi.fn().mockReturnThis(),
                match: vitest_1.vi.fn().mockResolvedValue({ error: null }),
            });
            const { mockReq, mockRes } = createMockRequestAndResponse({
                params: { id: 'tx-1' },
            });
            await controller.delete(mockReq, mockRes);
            (0, vitest_1.expect)(mockRes.status).toHaveBeenCalledWith(204);
        });
        (0, vitest_1.it)('should return 400 on delete error', async () => {
            mockSupabase.from.mockReturnValue({
                delete: vitest_1.vi.fn().mockReturnThis(),
                match: vitest_1.vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
            });
            const { mockReq, mockRes } = createMockRequestAndResponse({
                params: { id: 'tx-1' },
            });
            await controller.delete(mockReq, mockRes);
            (0, vitest_1.expect)(mockRes.status).toHaveBeenCalledWith(400);
            (0, vitest_1.expect)(mockRes.json).toHaveBeenCalledWith({ message: 'Delete failed' });
        });
    });
});
// ─── GOAL CONTROLLER ───
const GoalController_1 = require("../../modules/goal/GoalController");
(0, vitest_1.describe)('GoalController', () => {
    let controller;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        mockSupabase.from.mockReset();
        mockSupabase.from.mockImplementation(mockSupabase.createBuilder);
        controller = new GoalController_1.GoalController();
    });
    (0, vitest_1.describe)('list', () => {
        (0, vitest_1.it)('should return goals for authenticated user', async () => {
            const mockGoals = [
                { id: '1', user_id: 'user-1', title: 'House', target_amount: 100000 },
            ];
            mockSupabase.from.mockReturnValue({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockReturnThis(),
                is: vitest_1.vi.fn().mockReturnThis(),
                order: vitest_1.vi.fn().mockResolvedValue({ data: mockGoals, error: null }),
            });
            const { mockReq, mockRes } = createMockRequestAndResponse();
            await controller.list(mockReq, mockRes);
            (0, vitest_1.expect)(mockRes.json).toHaveBeenCalledWith(mockGoals);
        });
        (0, vitest_1.it)('should return 400 on error', async () => {
            mockSupabase.from.mockReturnValue({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockReturnThis(),
                is: vitest_1.vi.fn().mockReturnThis(),
                order: vitest_1.vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
            });
            const { mockReq, mockRes } = createMockRequestAndResponse();
            await controller.list(mockReq, mockRes);
            (0, vitest_1.expect)(mockRes.status).toHaveBeenCalledWith(400);
        });
    });
    (0, vitest_1.describe)('create', () => {
        (0, vitest_1.it)('should create a goal and return 201', async () => {
            const goalData = {
                id: 'goal-1',
                user_id: 'user-1',
                title: 'Emergency Fund',
                description: 'Save 6 months expenses',
                target_amount: 30000,
                current_amount: 0,
                deadline: '2025-12-31',
            };
            mockSupabase.from.mockReturnValue({
                insert: vitest_1.vi.fn().mockReturnThis(),
                select: vitest_1.vi.fn().mockReturnThis(),
                single: vitest_1.vi.fn().mockResolvedValue({ data: goalData, error: null }),
            });
            const { mockReq, mockRes } = createMockRequestAndResponse({
                body: {
                    title: 'Emergency Fund',
                    description: 'Save 6 months expenses',
                    targetAmount: 30000,
                    currentAmount: 0,
                    deadline: '2025-12-31',
                },
            });
            await controller.create(mockReq, mockRes);
            (0, vitest_1.expect)(mockRes.status).toHaveBeenCalledWith(201);
            (0, vitest_1.expect)(mockRes.json).toHaveBeenCalledWith(goalData);
        });
    });
    (0, vitest_1.describe)('update', () => {
        (0, vitest_1.it)('should update a goal and return updated data', async () => {
            const updatedGoal = {
                id: 'goal-1',
                user_id: 'user-1',
                title: 'Emergency Fund Updated',
                current_amount: 5000,
            };
            mockSupabase.from.mockReturnValue({
                update: vitest_1.vi.fn().mockReturnThis(),
                match: vitest_1.vi.fn().mockReturnThis(),
                select: vitest_1.vi.fn().mockReturnThis(),
                single: vitest_1.vi.fn().mockResolvedValue({ data: updatedGoal, error: null }),
            });
            const { mockReq, mockRes } = createMockRequestAndResponse({
                params: { id: 'goal-1' },
                body: { title: 'Emergency Fund Updated', currentAmount: 5000 },
            });
            await controller.update(mockReq, mockRes);
            (0, vitest_1.expect)(mockRes.json).toHaveBeenCalledWith(updatedGoal);
        });
        (0, vitest_1.it)('should return 400 on update error', async () => {
            mockSupabase.from.mockReturnValue({
                update: vitest_1.vi.fn().mockReturnThis(),
                match: vitest_1.vi.fn().mockReturnThis(),
                select: vitest_1.vi.fn().mockReturnThis(),
                single: vitest_1.vi.fn().mockResolvedValue({ data: null, error: { message: 'Update failed' } }),
            });
            const { mockReq, mockRes } = createMockRequestAndResponse({
                params: { id: 'goal-1' },
                body: {},
            });
            await controller.update(mockReq, mockRes);
            (0, vitest_1.expect)(mockRes.status).toHaveBeenCalledWith(400);
        });
    });
});
// ─── INVESTMENT CONTROLLER ───
const InvestmentController_1 = require("../../modules/investment/InvestmentController");
(0, vitest_1.describe)('InvestmentController', () => {
    let controller;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        mockSupabase.from.mockReset();
        mockSupabase.from.mockImplementation(mockSupabase.createBuilder);
        controller = new InvestmentController_1.InvestmentController();
    });
    (0, vitest_1.describe)('list', () => {
        (0, vitest_1.it)('should return investments with portfolio calculations', async () => {
            const mockInvestments = [
                {
                    id: '1',
                    user_id: 'user-1',
                    asset_name: 'PETR4',
                    asset_class: 'stocks',
                    quantity: 100,
                    average_price: 30,
                    current_price: 35,
                    total_invested: 3000,
                    current_total: 3500,
                    daily_change_percent: 2.5,
                },
                {
                    id: '2',
                    user_id: 'user-1',
                    asset_name: 'ITSA4',
                    asset_class: 'stocks',
                    quantity: 200,
                    average_price: 10,
                    current_price: 9,
                    total_invested: 2000,
                    current_total: 1800,
                    daily_change_percent: -1.5,
                },
            ];
            mockSupabase.from.mockReturnValue({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockResolvedValue({ data: mockInvestments, error: null }),
            });
            const { mockReq, mockRes } = createMockRequestAndResponse();
            await controller.list(mockReq, mockRes);
            const response = mockRes.json.mock.calls[0][0];
            (0, vitest_1.expect)(response.portfolioValue).toBe(5300);
            (0, vitest_1.expect)(response.totalInvested).toBe(5000);
            (0, vitest_1.expect)(response.portfolioProfit).toBe(300);
            (0, vitest_1.expect)(response.topGainers.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(response.topLosers.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should return empty values when no investments', async () => {
            mockSupabase.from.mockReturnValue({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockReturnThis(),
            }).mockResolvedValue({ data: [], error: null });
            const { mockReq, mockRes } = createMockRequestAndResponse();
            await controller.list(mockReq, mockRes);
            const response = mockRes.json.mock.calls[0][0];
            (0, vitest_1.expect)(response.portfolioValue).toBe(0);
            (0, vitest_1.expect)(response.totalInvested).toBe(0);
        });
    });
    (0, vitest_1.describe)('sync', () => {
        (0, vitest_1.it)('should return sync placeholder message', async () => {
            const { mockReq, mockRes } = createMockRequestAndResponse();
            await controller.sync(mockReq, mockRes);
            (0, vitest_1.expect)(mockRes.json).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ message: vitest_1.expect.any(String) }));
        });
    });
});
// ─── CARD CONTROLLER ───
const CardController_1 = require("../../modules/card/CardController");
(0, vitest_1.describe)('CardController', () => {
    let controller;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        mockSupabase.from.mockReset();
        mockSupabase.from.mockImplementation(mockSupabase.createBuilder);
        controller = new CardController_1.CardController();
    });
    (0, vitest_1.describe)('list', () => {
        (0, vitest_1.it)('should return cards for authenticated user', async () => {
            const mockCards = [
                { id: '1', user_id: 'user-1', name: 'Visa Platinum', type: 'credit' },
            ];
            mockSupabase.from.mockReturnValue({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockResolvedValue({ data: mockCards, error: null }),
            });
            const { mockReq, mockRes } = createMockRequestAndResponse();
            await controller.list(mockReq, mockRes);
            (0, vitest_1.expect)(mockRes.json).toHaveBeenCalledWith(mockCards);
        });
    });
    (0, vitest_1.describe)('create', () => {
        (0, vitest_1.it)('should create a card and return 201', async () => {
            const cardData = {
                id: 'card-1',
                user_id: 'user-1',
                name: 'Mastercard Gold',
                type: 'credit',
                limit: 15000,
                closing_day: 15,
                due_day: 25,
            };
            mockSupabase.from.mockReturnValue({
                insert: vitest_1.vi.fn().mockReturnThis(),
                select: vitest_1.vi.fn().mockReturnThis(),
                single: vitest_1.vi.fn().mockResolvedValue({ data: cardData, error: null }),
            });
            const { mockReq, mockRes } = createMockRequestAndResponse({
                body: {
                    name: 'Mastercard Gold',
                    type: 'credit',
                    limit: 15000,
                    closingDay: 15,
                    dueDay: 25,
                },
            });
            await controller.create(mockReq, mockRes);
            (0, vitest_1.expect)(mockRes.status).toHaveBeenCalledWith(201);
            (0, vitest_1.expect)(mockRes.json).toHaveBeenCalledWith(cardData);
        });
    });
});
// ─── SUBSCRIPTION CONTROLLER ───
const SubscriptionController_1 = require("../../modules/subscription/SubscriptionController");
(0, vitest_1.describe)('SubscriptionController', () => {
    let controller;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        mockSupabase.from.mockReset();
        mockSupabase.from.mockImplementation(mockSupabase.createBuilder);
        controller = new SubscriptionController_1.SubscriptionController();
    });
    (0, vitest_1.describe)('list', () => {
        (0, vitest_1.it)('should return subscriptions with monthly totals', async () => {
            const mockSubscriptions = [
                { id: '1', user_id: 'user-1', name: 'Netflix', amount: 55.90, is_active: true, type: 'expense' },
                { id: '2', user_id: 'user-1', name: 'Spotify', amount: 19.90, is_active: true, type: 'expense' },
            ];
            mockSupabase.from.mockReturnValue({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockResolvedValue({ data: mockSubscriptions, error: null }),
            });
            const { mockReq, mockRes } = createMockRequestAndResponse();
            await controller.list(mockReq, mockRes);
            const response = mockRes.json.mock.calls[0][0];
            (0, vitest_1.expect)(response.subscriptions).toEqual(mockSubscriptions);
            (0, vitest_1.expect)(response.totalMonthlyExpenses).toBe(75.80);
        });
    });
    (0, vitest_1.describe)('create', () => {
        (0, vitest_1.it)('should create a subscription and return 201', async () => {
            const subData = {
                id: 'sub-1',
                user_id: 'user-1',
                name: 'Netflix',
                type: 'expense',
                amount: 55.90,
                day_of_month: 15,
            };
            mockSupabase.from.mockReturnValue({
                insert: vitest_1.vi.fn().mockReturnThis(),
                select: vitest_1.vi.fn().mockReturnThis(),
                single: vitest_1.vi.fn().mockResolvedValue({ data: subData, error: null }),
            });
            const { mockReq, mockRes } = createMockRequestAndResponse({
                body: { name: 'Netflix', amount: 55.90, type: 'expense', dayOfMonth: 15 },
            });
            await controller.create(mockReq, mockRes);
            (0, vitest_1.expect)(mockRes.status).toHaveBeenCalledWith(201);
            (0, vitest_1.expect)(mockRes.json).toHaveBeenCalledWith(subData);
        });
    });
});
// ─── TASK CONTROLLER ───
const TaskController_1 = require("../../modules/task/TaskController");
(0, vitest_1.describe)('TaskController', () => {
    let controller;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        mockSupabase.from.mockReset();
        mockSupabase.from.mockImplementation(mockSupabase.createBuilder);
        controller = new TaskController_1.TaskController();
    });
    (0, vitest_1.describe)('list', () => {
        (0, vitest_1.it)('should return tasks ordered by created_at desc', async () => {
            const mockTasks = [
                { id: '1', user_id: 'user-1', title: 'Pay bills', is_completed: false },
            ];
            mockSupabase.from.mockReturnValue({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockReturnThis(),
                is: vitest_1.vi.fn().mockReturnThis(),
                order: vitest_1.vi.fn().mockResolvedValue({ data: mockTasks, error: null }),
            });
            const { mockReq, mockRes } = createMockRequestAndResponse();
            await controller.list(mockReq, mockRes);
            (0, vitest_1.expect)(mockRes.json).toHaveBeenCalledWith(mockTasks);
        });
    });
    (0, vitest_1.describe)('create', () => {
        (0, vitest_1.it)('should create a task with default priority', async () => {
            const taskData = {
                id: 'task-1',
                user_id: 'user-1',
                title: 'Review budget',
                description: 'Monthly review',
                priority: 'medium',
                is_completed: false,
            };
            mockSupabase.from.mockReturnValue({
                insert: vitest_1.vi.fn().mockReturnThis(),
                select: vitest_1.vi.fn().mockReturnThis(),
                single: vitest_1.vi.fn().mockResolvedValue({ data: taskData, error: null }),
            });
            const { mockReq, mockRes } = createMockRequestAndResponse({
                body: { title: 'Review budget', description: 'Monthly review' },
            });
            await controller.create(mockReq, mockRes);
            (0, vitest_1.expect)(mockRes.status).toHaveBeenCalledWith(201);
        });
    });
    (0, vitest_1.describe)('toggle', () => {
        (0, vitest_1.it)('should toggle task completion status', async () => {
            const currentTask = {
                id: 'task-1',
                user_id: 'user-1',
                title: 'Pay bills',
                is_completed: false,
            };
            const updatedTask = { ...currentTask, is_completed: true };
            mockSupabase.from
                .mockReturnValueOnce({
                select: vitest_1.vi.fn().mockReturnThis(),
                match: vitest_1.vi.fn().mockReturnThis(),
                is: vitest_1.vi.fn().mockReturnThis(),
                single: vitest_1.vi.fn().mockResolvedValue({ data: currentTask, error: null }),
            })
                .mockReturnValueOnce({
                update: vitest_1.vi.fn().mockReturnThis(),
                match: vitest_1.vi.fn().mockReturnThis(),
                select: vitest_1.vi.fn().mockReturnThis(),
                single: vitest_1.vi.fn().mockResolvedValue({ data: updatedTask, error: null }),
            });
            const { mockReq, mockRes } = createMockRequestAndResponse({
                params: { id: 'task-1' },
            });
            await controller.toggle(mockReq, mockRes);
            (0, vitest_1.expect)(mockRes.json).toHaveBeenCalledWith(updatedTask);
        });
        (0, vitest_1.it)('should return 404 when task not found', async () => {
            mockSupabase.from
                .mockReturnValueOnce({
                select: vitest_1.vi.fn().mockReturnThis(),
                match: vitest_1.vi.fn().mockReturnThis(),
                is: vitest_1.vi.fn().mockReturnThis(),
                single: vitest_1.vi.fn().mockResolvedValue({ data: null, error: null }),
            });
            const { mockReq, mockRes } = createMockRequestAndResponse({
                params: { id: 'nonexistent' },
            });
            await controller.toggle(mockReq, mockRes);
            (0, vitest_1.expect)(mockRes.status).toHaveBeenCalledWith(404);
        });
    });
});
// ─── ANALYTICS CONTROLLER ───
const AnalyticsController_1 = require("../../modules/analytics/AnalyticsController");
(0, vitest_1.describe)('AnalyticsController', () => {
    let controller;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        mockSupabase.from.mockReset();
        mockSupabase.from.mockImplementation(mockSupabase.createBuilder);
        controller = new AnalyticsController_1.AnalyticsController();
    });
    (0, vitest_1.describe)('track', () => {
        (0, vitest_1.it)('should accept event with name and return 202', async () => {
            const { mockReq, mockRes } = createMockRequestAndResponse({
                body: {
                    name: 'page_view',
                    parameters: { page: '/dashboard' },
                    platform: 'web',
                    timestamp: new Date().toISOString(),
                },
            });
            await controller.track(mockReq, mockRes);
            (0, vitest_1.expect)(mockRes.status).toHaveBeenCalledWith(202);
            (0, vitest_1.expect)(mockRes.json).toHaveBeenCalledWith({ accepted: true });
        });
        (0, vitest_1.it)('should return 400 when name is missing', async () => {
            const { mockReq, mockRes } = createMockRequestAndResponse({
                body: { parameters: {} },
            });
            await controller.track(mockReq, mockRes);
            (0, vitest_1.expect)(mockRes.status).toHaveBeenCalledWith(400);
        });
        (0, vitest_1.it)('should return 400 when name is not a string', async () => {
            const { mockReq, mockRes } = createMockRequestAndResponse({
                body: { name: 123 },
            });
            await controller.track(mockReq, mockRes);
            (0, vitest_1.expect)(mockRes.status).toHaveBeenCalledWith(400);
        });
    });
});
// ─── PAYMENT CONTROLLER ───
const PaymentController_1 = require("../../modules/payment/PaymentController");
(0, vitest_1.describe)('PaymentController', () => {
    let controller;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        mockSupabase.from.mockReset();
        mockSupabase.from.mockImplementation(mockSupabase.createBuilder);
        controller = new PaymentController_1.PaymentController();
    });
    (0, vitest_1.describe)('verifyPurchase', () => {
        (0, vitest_1.it)('should verify purchase and update license', async () => {
            mockSupabase.from.mockReturnValue({
                update: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockReturnThis(),
                single: vitest_1.vi.fn().mockResolvedValue({ data: {}, error: null }),
            });
            const { mockReq, mockRes } = createMockRequestAndResponse({
                body: {
                    productId: 'premium_monthly',
                    purchaseToken: 'token-abc',
                    platform: 'android',
                },
            });
            await controller.verifyPurchase(mockReq, mockRes);
            (0, vitest_1.expect)(mockRes.json).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ message: 'Purchase verified and license updated' }));
        });
    });
});
// Ensure each endpoint-specific fixture still exposes the complete chainable client surface.
const rawFromMockReturnValue = mockSupabase.from.mockReturnValue.bind(mockSupabase.from);
mockSupabase.from.mockReturnValue = ((value) => rawFromMockReturnValue({
    select: vitest_1.vi.fn().mockReturnThis(),
    insert: vitest_1.vi.fn().mockReturnThis(),
    update: vitest_1.vi.fn().mockReturnThis(),
    delete: vitest_1.vi.fn().mockReturnThis(),
    eq: vitest_1.vi.fn().mockReturnThis(),
    is: vitest_1.vi.fn().mockReturnThis(),
    match: vitest_1.vi.fn().mockReturnThis(),
    order: vitest_1.vi.fn().mockReturnThis(),
    single: vitest_1.vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vitest_1.vi.fn().mockResolvedValue({ data: null, error: null }),
    ...value,
}));
//# sourceMappingURL=controllers.test.js.map