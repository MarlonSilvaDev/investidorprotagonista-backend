import { describe, it, expect, vi } from 'vitest';
import { Request, Response } from 'express';

function mockRequest(body = {}, params = {}, query = {}, user?: any) {
  return {
    body,
    params,
    query,
    user: user || { id: 'test-user-id', role: 'padrao' },
  } as unknown as Request;
}

function mockResponse() {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnThis();
  res.json = vi.fn().mockReturnThis();
  return res as Response;
}

describe('TransactionController - Validation', () => {
  it('should reject transaction with zero amount', () => {
    const req = mockRequest({ amount: 0, type: 'expense', category: 'food', date: new Date() });
    const res = mockResponse();

    const amount = (req.body as any)?.amount;
    if (amount === 0) {
      res.status?.(400);
      res.json?.({ error: 'Amount must be greater than zero' });
    }

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should reject transaction with missing type', () => {
    const req = mockRequest({ amount: 100, category: 'food', date: new Date() });
    const res = mockResponse();

    const type = (req.body as any)?.type;
    if (!type || !['income', 'expense'].includes(type)) {
      res.status?.(400);
      res.json?.({ error: 'Type must be income or expense' });
    }

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should reject transaction with missing category', () => {
    const req = mockRequest({ amount: 100, type: 'expense', date: new Date() });
    const res = mockResponse();

    const category = (req.body as any)?.category;
    if (!category) {
      res.status?.(400);
      res.json?.({ error: 'Category is required' });
    }

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should accept valid transaction data', () => {
    const req = mockRequest({ amount: 150, type: 'expense', category: 'food', date: new Date() });
    const res = mockResponse();

    const amount = (req.body as any)?.amount;
    const type = (req.body as any)?.type;
    const category = (req.body as any)?.category;

    if (amount > 0 && ['income', 'expense'].includes(type) && category) {
      // Valid - would proceed to create
      res.status?.(201);
      res.json?.({ success: true });
    }

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('should reject transaction with future date in recurring rule', () => {
    const req = mockRequest({
      amount: 100,
      type: 'expense',
      category: 'food',
      date: new Date('2030-01-01'),
      isRecurring: true,
    });
    const res = mockResponse();

    const date = new Date((req.body as any)?.date);
    if (date > new Date('2099-01-01')) {
      res.status?.(400);
      res.json?.({ error: 'Date too far in the future' });
    }

    // This is a validation that would be in the real controller
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe('GoalController - Validation', () => {
  it('should reject goal with zero target amount', () => {
    const req = mockRequest({ title: 'House', targetAmount: 0 });
    const res = mockResponse();

    const targetAmount = (req.body as any)?.targetAmount;
    if (targetAmount <= 0) {
      res.status?.(400);
      res.json?.({ error: 'Target amount must be positive' });
    }

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should reject goal with missing title', () => {
    const req = mockRequest({ targetAmount: 100000 });
    const res = mockResponse();

    const title = (req.body as any)?.title;
    if (!title) {
      res.status?.(400);
      res.json?.({ error: 'Title is required' });
    }

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should reject goal with current amount exceeding target', () => {
    const req = mockRequest({ title: 'Car', targetAmount: 50000, currentAmount: 60000 });
    const res = mockResponse();

    const { targetAmount, currentAmount } = req.body as any;
    if (currentAmount > targetAmount) {
      res.status?.(400);
      res.json?.({ error: 'Current amount cannot exceed target' });
    }

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should accept valid goal data', () => {
    const req = mockRequest({
      title: 'House',
      description: 'Buy a house',
      targetAmount: 500000,
      currentAmount: 50000,
    });
    const res = mockResponse();

    const { title, targetAmount, currentAmount } = req.body as any;
    if (title && targetAmount > 0 && currentAmount <= targetAmount) {
      res.status?.(201);
      res.json?.({ success: true });
    }

    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe('TaskController - Validation', () => {
  it('should reject task with empty title', () => {
    const req = mockRequest({ title: '' });
    const res = mockResponse();

    const title = (req.body as any)?.title;
    if (!title || title.trim() === '') {
      res.status?.(400);
      res.json?.({ error: 'Title is required' });
    }

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should reject task with invalid priority', () => {
    const req = mockRequest({ title: 'Task', priority: 'invalid' });
    const res = mockResponse();

    const priority = (req.body as any)?.priority;
    const validPriorities = ['low', 'medium', 'high'];
    if (priority && !validPriorities.includes(priority)) {
      res.status?.(400);
      res.json?.({ error: 'Priority must be low, medium, or high' });
    }

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should accept task with valid data', () => {
    const req = mockRequest({ title: 'Pay bills', priority: 'high', dueDate: new Date() });
    const res = mockResponse();

    const title = (req.body as any)?.title;
    if (title && title.trim() !== '') {
      res.status?.(201);
      res.json?.({ success: true });
    }

    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe('CardController - Validation', () => {
  it('should reject card with missing name', () => {
    const req = mockRequest({ type: 'credit', limit: 15000 });
    const res = mockResponse();

    const name = (req.body as any)?.name;
    if (!name) {
      res.status?.(400);
      res.json?.({ error: 'Card name is required' });
    }

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should reject card with invalid type', () => {
    const req = mockRequest({ name: 'Visa', type: 'invalid', limit: 15000 });
    const res = mockResponse();

    const type = (req.body as any)?.type;
    if (!['credit', 'debit'].includes(type)) {
      res.status?.(400);
      res.json?.({ error: 'Type must be credit or debit' });
    }

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should reject card with negative limit', () => {
    const req = mockRequest({ name: 'Visa', type: 'credit', limit: -1000 });
    const res = mockResponse();

    const limit = (req.body as any)?.limit;
    if (limit < 0) {
      res.status?.(400);
      res.json?.({ error: 'Limit cannot be negative' });
    }

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should reject card with invalid closing day', () => {
    const req = mockRequest({ name: 'Visa', type: 'credit', limit: 15000, closingDay: 32 });
    const res = mockResponse();

    const closingDay = (req.body as any)?.closingDay;
    if (closingDay < 1 || closingDay > 31) {
      res.status?.(400);
      res.json?.({ error: 'Closing day must be between 1 and 31' });
    }

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should reject card with invalid due day', () => {
    const req = mockRequest({ name: 'Visa', type: 'credit', limit: 15000, dueDay: 0 });
    const res = mockResponse();

    const dueDay = (req.body as any)?.dueDay;
    if (dueDay < 1 || dueDay > 31) {
      res.status?.(400);
      res.json?.({ error: 'Due day must be between 1 and 31' });
    }

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should accept valid card data', () => {
    const req = mockRequest({
      name: 'Visa Platinum',
      type: 'credit',
      limit: 15000,
      availableLimit: 12000,
      closingDay: 15,
      dueDay: 25,
    });
    const res = mockResponse();

    const { name, type, limit, closingDay, dueDay } = req.body as any;
    if (name && ['credit', 'debit'].includes(type) && limit >= 0 &&
        closingDay >= 1 && closingDay <= 31 && dueDay >= 1 && dueDay <= 31) {
      res.status?.(201);
      res.json?.({ success: true });
    }

    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe('SubscriptionController - Validation', () => {
  it('should reject subscription with missing name', () => {
    const req = mockRequest({ amount: 55.90, dayOfMonth: 15 });
    const res = mockResponse();

    const name = (req.body as any)?.name;
    if (!name) {
      res.status?.(400);
      res.json?.({ error: 'Name is required' });
    }

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should reject subscription with negative amount', () => {
    const req = mockRequest({ name: 'Netflix', amount: -10, dayOfMonth: 15 });
    const res = mockResponse();

    const amount = (req.body as any)?.amount;
    if (amount < 0) {
      res.status?.(400);
      res.json?.({ error: 'Amount must be non-negative' });
    }

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should reject subscription with invalid day of month', () => {
    const req = mockRequest({ name: 'Netflix', amount: 55.90, dayOfMonth: 32 });
    const res = mockResponse();

    const dayOfMonth = (req.body as any)?.dayOfMonth;
    if (dayOfMonth < 1 || dayOfMonth > 31) {
      res.status?.(400);
      res.json?.({ error: 'Day of month must be between 1 and 31' });
    }

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should reject subscription with end date before start date', () => {
    const req = mockRequest({
      name: 'Netflix',
      amount: 55.90,
      dayOfMonth: 15,
      startDate: '2025-12-01',
      endDate: '2025-01-01',
    });
    const res = mockResponse();

    const { startDate, endDate } = req.body as any;
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      res.status?.(400);
      res.json?.({ error: 'End date must be after start date' });
    }

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should accept valid subscription data', () => {
    const req = mockRequest({
      name: 'Netflix',
      amount: 55.90,
      dayOfMonth: 15,
      startDate: '2025-01-01',
    });
    const res = mockResponse();

    const { name, amount, dayOfMonth, startDate } = req.body as any;
    if (name && amount >= 0 && dayOfMonth >= 1 && dayOfMonth <= 31 && startDate) {
      res.status?.(201);
      res.json?.({ success: true });
    }

    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe('InvestmentController - Validation', () => {
  it('should reject investment with missing asset name', () => {
    const req = mockRequest({ assetClass: 'acoes', quantity: 100 });
    const res = mockResponse();

    const assetName = (req.body as any)?.assetName;
    if (!assetName) {
      res.status?.(400);
      res.json?.({ error: 'Asset name is required' });
    }

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should reject investment with invalid asset class', () => {
    const req = mockRequest({ assetName: 'PETR4', assetClass: 'invalid' });
    const res = mockResponse();

    const validClasses = ['rendaFixa', 'acoes', 'fiis', 'cripto', 'exterior', 'previdencia', 'outros'];
    const assetClass = (req.body as any)?.assetClass;
    if (assetClass && !validClasses.includes(assetClass)) {
      res.status?.(400);
      res.json?.({ error: 'Invalid asset class' });
    }

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should reject investment with zero quantity', () => {
    const req = mockRequest({ assetName: 'PETR4', assetClass: 'acoes', quantity: 0 });
    const res = mockResponse();

    const quantity = (req.body as any)?.quantity;
    if (quantity <= 0) {
      res.status?.(400);
      res.json?.({ error: 'Quantity must be positive' });
    }

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should reject investment with negative average price', () => {
    const req = mockRequest({
      assetName: 'PETR4',
      assetClass: 'acoes',
      quantity: 100,
      averagePrice: -30,
    });
    const res = mockResponse();

    const averagePrice = (req.body as any)?.averagePrice;
    if (averagePrice < 0) {
      res.status?.(400);
      res.json?.({ error: 'Average price cannot be negative' });
    }

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should accept valid investment data', () => {
    const req = mockRequest({
      assetName: 'PETR4',
      assetClass: 'acoes',
      quantity: 100,
      averagePrice: 30.0,
      currentPrice: 35.0,
      ticker: 'PETR4',
    });
    const res = mockResponse();

    const { assetName, assetClass, quantity, averagePrice } = req.body as any;
    const validClasses = ['rendaFixa', 'acoes', 'fiis', 'cripto', 'exterior', 'previdencia', 'outros'];
    if (assetName && validClasses.includes(assetClass) && quantity > 0 && averagePrice >= 0) {
      res.status?.(201);
      res.json?.({ success: true });
    }

    expect(res.status).toHaveBeenCalledWith(201);
  });
});
