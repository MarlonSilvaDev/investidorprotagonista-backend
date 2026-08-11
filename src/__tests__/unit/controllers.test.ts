import { describe, it, expect, beforeEach, vi } from 'vitest';

// ─── MOCK SUPABASE ───
const mockSupabase = {
  from: vi.fn(),
};

vi.mock('../../database/supabase', () => ({
  supabase: mockSupabase,
  supabaseAdmin: mockSupabase,
}));

// ─── DASHBOARD CONTROLLER ───

import { DashboardController } from '../../infra/controllers/DashboardController';
import { Request, Response } from 'express';

function createMockRequestAndResponse(overrides: any = {}) {
  const mockReq = {
    user: { id: 'user-dashboard-test' },
    ...overrides,
  } as unknown as Request;

  const mockRes = {
    json: vi.fn().mockReturnThis(),
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  } as unknown as Response;

  return { mockReq, mockRes };
}

describe('DashboardController', () => {
  let controller: DashboardController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new DashboardController();
  });

  describe('getConsolidatedData', () => {
    it('should return consolidated data with balance, income, expense', async () => {
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
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
        })
        .mockResolvedValueOnce({ data: mockTransactions });

      // Mock investments query
      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
        })
        .mockResolvedValueOnce({ data: mockInvestments });

      // Mock goals query
      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
        })
        .mockResolvedValueOnce({ data: mockGoals });

      const { mockReq, mockRes } = createMockRequestAndResponse();

      await controller.getConsolidatedData(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: expect.objectContaining({
            income: 5000,
            expense: 2000,
            balance: 3000,
            totalInvested: expect.any(Number),
          }),
          charts: expect.objectContaining({
            expensesByCategory: expect.any(Array),
            assetAllocation: expect.any(Array),
            goalsProgress: expect.any(Array),
          }),
        })
      );
    });

    it('should handle empty transactions', async () => {
      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
        })
        .mockResolvedValueOnce({ data: [] });

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
        })
        .mockResolvedValueOnce({ data: [] });

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
        })
        .mockResolvedValueOnce({ data: [] });

      const { mockReq, mockRes } = createMockRequestAndResponse();

      await controller.getConsolidatedData(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: {
            balance: 0,
            income: 0,
            expense: 0,
            totalInvested: 0,
          },
        })
      );
    });

    it('should calculate expense categories correctly', async () => {
      const transactions = [
        { amount: 100, type: 'expense', category: 'food', date: '2025-01-01' },
        { amount: 200, type: 'expense', category: 'food', date: '2025-01-02' },
        { amount: 50, type: 'expense', category: 'transport', date: '2025-01-03' },
      ];

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
        })
        .mockResolvedValueOnce({ data: transactions });

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
        })
        .mockResolvedValueOnce({ data: [] });

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
        })
        .mockResolvedValueOnce({ data: [] });

      const { mockReq, mockRes } = createMockRequestAndResponse();

      await controller.getConsolidatedData(mockReq, mockRes);

      const charts = (mockRes.json as any).mock.calls[0][0].charts;
      const foodCategory = charts.expensesByCategory.find((c: any) => c.name === 'food');
      const transportCategory = charts.expensesByCategory.find((c: any) => c.name === 'transport');

      expect(foodCategory.value).toBe(300);
      expect(transportCategory.value).toBe(50);
    });

    it('should handle null data from Supabase', async () => {
      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
        })
        .mockResolvedValueOnce({ data: null });

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
        })
        .mockResolvedValueOnce({ data: null });

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
        })
        .mockResolvedValueOnce({ data: null });

      const { mockReq, mockRes } = createMockRequestAndResponse();

      await controller.getConsolidatedData(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: {
            balance: 0,
            income: 0,
            expense: 0,
            totalInvested: 0,
          },
        })
      );
    });

    it('should calculate goals progress percentage', async () => {
      const goals = [
        { title: 'House', target_amount: 100000, current_amount: 25000 },
        { title: 'Car', target_amount: 50000, current_amount: 50000 },
      ];

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
        })
        .mockResolvedValueOnce({ data: [] });

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
        })
        .mockResolvedValueOnce({ data: [] });

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
        })
        .mockResolvedValueOnce({ data: goals });

      const { mockReq, mockRes } = createMockRequestAndResponse();

      await controller.getConsolidatedData(mockReq, mockRes);

      const progress = (mockRes.json as any).mock.calls[0][0].charts.goalsProgress;
      expect(progress[0].percent).toBe(25);
      expect(progress[1].percent).toBe(100);
    });
  });
});

// ─── TRANSACTION CONTROLLER ───

import { TransactionController } from '../../infra/controllers/TransactionController';

describe('TransactionController', () => {
  let controller: TransactionController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new TransactionController();
  });

  describe('list', () => {
    it('should return transactions for authenticated user', async () => {
      const mockData = [
        { id: '1', user_id: 'user-1', title: 'Salary', amount: 5000, type: 'income' },
        { id: '2', user_id: 'user-1', title: 'Groceries', amount: 200, type: 'expense' },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      const { mockReq, mockRes } = createMockRequestAndResponse();

      await controller.list(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockData);
    });

    it('should return 400 on Supabase error', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      });

      const { mockReq, mockRes } = createMockRequestAndResponse();

      await controller.list(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'DB error' });
    });
  });

  describe('create', () => {
    it('should create a transaction and return 201', async () => {
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
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: transactionData, error: null }),
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

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(transactionData);
    });

    it('should return 400 on insert error', async () => {
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
      });

      const { mockReq, mockRes } = createMockRequestAndResponse({
        body: { title: '', amount: 0, type: 'invalid' },
      });

      await controller.create(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Insert failed' });
    });
  });

  describe('delete', () => {
    it('should delete a transaction and return 204', async () => {
      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        match: vi.fn().mockResolvedValue({ error: null }),
      });

      const { mockReq, mockRes } = createMockRequestAndResponse({
        params: { id: 'tx-1' },
      });

      await controller.delete(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(204);
    });

    it('should return 400 on delete error', async () => {
      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        match: vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
      });

      const { mockReq, mockRes } = createMockRequestAndResponse({
        params: { id: 'tx-1' },
      });

      await controller.delete(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Delete failed' });
    });
  });
});

// ─── GOAL CONTROLLER ───

import { GoalController } from '../../infra/controllers/GoalController';

describe('GoalController', () => {
  let controller: GoalController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new GoalController();
  });

  describe('list', () => {
    it('should return goals for authenticated user', async () => {
      const mockGoals = [
        { id: '1', user_id: 'user-1', title: 'House', target_amount: 100000 },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      }).mockResolvedValue({ data: mockGoals, error: null });

      const { mockReq, mockRes } = createMockRequestAndResponse();

      await controller.list(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockGoals);
    });

    it('should return 400 on error', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      }).mockResolvedValue({ data: null, error: { message: 'DB error' } });

      const { mockReq, mockRes } = createMockRequestAndResponse();

      await controller.list(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('create', () => {
    it('should create a goal and return 201', async () => {
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
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: goalData, error: null }),
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

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(goalData);
    });
  });

  describe('update', () => {
    it('should update a goal and return updated data', async () => {
      const updatedGoal = {
        id: 'goal-1',
        user_id: 'user-1',
        title: 'Emergency Fund Updated',
        current_amount: 5000,
      };

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        match: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedGoal, error: null }),
      });

      const { mockReq, mockRes } = createMockRequestAndResponse({
        params: { id: 'goal-1' },
        body: { title: 'Emergency Fund Updated', currentAmount: 5000 },
      });

      await controller.update(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(updatedGoal);
    });

    it('should return 400 on update error', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        match: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Update failed' } }),
      });

      const { mockReq, mockRes } = createMockRequestAndResponse({
        params: { id: 'goal-1' },
        body: {},
      });

      await controller.update(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });
});

// ─── INVESTMENT CONTROLLER ───

import { InvestmentController } from '../../infra/controllers/InvestmentController';

describe('InvestmentController', () => {
  let controller: InvestmentController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new InvestmentController();
  });

  describe('list', () => {
    it('should return investments with portfolio calculations', async () => {
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
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      }).mockResolvedValue({ data: mockInvestments, error: null });

      const { mockReq, mockRes } = createMockRequestAndResponse();

      await controller.list(mockReq, mockRes);

      const response = (mockRes.json as any).mock.calls[0][0];
      expect(response.portfolioValue).toBe(5300);
      expect(response.totalInvested).toBe(5000);
      expect(response.portfolioProfit).toBe(300);
      expect(response.topGainers.length).toBeGreaterThan(0);
      expect(response.topLosers.length).toBeGreaterThan(0);
    });

    it('should return empty values when no investments', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      }).mockResolvedValue({ data: [], error: null });

      const { mockReq, mockRes } = createMockRequestAndResponse();

      await controller.list(mockReq, mockRes);

      const response = (mockRes.json as any).mock.calls[0][0];
      expect(response.portfolioValue).toBe(0);
      expect(response.totalInvested).toBe(0);
    });
  });

  describe('sync', () => {
    it('should return sync placeholder message', async () => {
      const { mockReq, mockRes } = createMockRequestAndResponse();

      await controller.sync(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.any(String) })
      );
    });
  });
});

// ─── CARD CONTROLLER ───

import { CardController } from '../../infra/controllers/CardController';

describe('CardController', () => {
  let controller: CardController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new CardController();
  });

  describe('list', () => {
    it('should return cards for authenticated user', async () => {
      const mockCards = [
        { id: '1', user_id: 'user-1', name: 'Visa Platinum', type: 'credit' },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      }).mockResolvedValue({ data: mockCards, error: null });

      const { mockReq, mockRes } = createMockRequestAndResponse();

      await controller.list(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockCards);
    });
  });

  describe('create', () => {
    it('should create a card and return 201', async () => {
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
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: cardData, error: null }),
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

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(cardData);
    });
  });
});

// ─── SUBSCRIPTION CONTROLLER ───

import { SubscriptionController } from '../../infra/controllers/SubscriptionController';

describe('SubscriptionController', () => {
  let controller: SubscriptionController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new SubscriptionController();
  });

  describe('list', () => {
    it('should return subscriptions with monthly totals', async () => {
      const mockSubscriptions = [
        { id: '1', user_id: 'user-1', name: 'Netflix', amount: 55.90, is_active: true, type: 'expense' },
        { id: '2', user_id: 'user-1', name: 'Spotify', amount: 19.90, is_active: true, type: 'expense' },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      }).mockResolvedValue({ data: mockSubscriptions, error: null });

      const { mockReq, mockRes } = createMockRequestAndResponse();

      await controller.list(mockReq, mockRes);

      const response = (mockRes.json as any).mock.calls[0][0];
      expect(response.subscriptions).toEqual(mockSubscriptions);
      expect(response.totalMonthlyExpenses).toBe(75.80);
    });
  });

  describe('create', () => {
    it('should create a subscription and return 201', async () => {
      const subData = {
        id: 'sub-1',
        user_id: 'user-1',
        name: 'Netflix',
        type: 'expense',
        amount: 55.90,
        day_of_month: 15,
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: subData, error: null }),
      });

      const { mockReq, mockRes } = createMockRequestAndResponse({
        body: { name: 'Netflix', amount: 55.90, type: 'expense', dayOfMonth: 15 },
      });

      await controller.create(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(subData);
    });
  });
});

// ─── TASK CONTROLLER ───

import { TaskController } from '../../infra/controllers/TaskController';

describe('TaskController', () => {
  let controller: TaskController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new TaskController();
  });

  describe('list', () => {
    it('should return tasks ordered by created_at desc', async () => {
      const mockTasks = [
        { id: '1', user_id: 'user-1', title: 'Pay bills', is_completed: false },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockTasks, error: null }),
      });

      const { mockReq, mockRes } = createMockRequestAndResponse();

      await controller.list(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(mockTasks);
    });
  });

  describe('create', () => {
    it('should create a task with default priority', async () => {
      const taskData = {
        id: 'task-1',
        user_id: 'user-1',
        title: 'Review budget',
        description: 'Monthly review',
        priority: 'medium',
        is_completed: false,
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: taskData, error: null }),
      });

      const { mockReq, mockRes } = createMockRequestAndResponse({
        body: { title: 'Review budget', description: 'Monthly review' },
      });

      await controller.create(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe('toggle', () => {
    it('should toggle task completion status', async () => {
      const currentTask = {
        id: 'task-1',
        user_id: 'user-1',
        title: 'Pay bills',
        is_completed: false,
      };

      const updatedTask = { ...currentTask, is_completed: true };

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: currentTask, error: null }),
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnThis(),
          match: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: updatedTask, error: null }),
        });

      const { mockReq, mockRes } = createMockRequestAndResponse({
        params: { id: 'task-1' },
      });

      await controller.toggle(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(updatedTask);
    });

    it('should return 404 when task not found', async () => {
      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        });

      const { mockReq, mockRes } = createMockRequestAndResponse({
        params: { id: 'nonexistent' },
      });

      await controller.toggle(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });
});

// ─── ANALYTICS CONTROLLER ───

import { AnalyticsController } from '../../infra/controllers/AnalyticsController';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new AnalyticsController();
  });

  describe('track', () => {
    it('should accept event with name and return 202', async () => {
      const { mockReq, mockRes } = createMockRequestAndResponse({
        body: {
          name: 'page_view',
          parameters: { page: '/dashboard' },
          platform: 'web',
          timestamp: new Date().toISOString(),
        },
      });

      await controller.track(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(202);
      expect(mockRes.json).toHaveBeenCalledWith({ accepted: true });
    });

    it('should return 400 when name is missing', async () => {
      const { mockReq, mockRes } = createMockRequestAndResponse({
        body: { parameters: {} },
      });

      await controller.track(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 when name is not a string', async () => {
      const { mockReq, mockRes } = createMockRequestAndResponse({
        body: { name: 123 },
      });

      await controller.track(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });
});

// ─── PAYMENT CONTROLLER ───

import { PaymentController } from '../../infra/controllers/PaymentController';

describe('PaymentController', () => {
  let controller: PaymentController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new PaymentController();
  });

  describe('verifyPurchase', () => {
    it('should verify purchase and update license', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      const { mockReq, mockRes } = createMockRequestAndResponse({
        body: {
          productId: 'premium_monthly',
          purchaseToken: 'token-abc',
          platform: 'android',
        },
      });

      await controller.verifyPurchase(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Purchase verified and license updated' })
      );
    });
  });
});
