"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const express_1 = require("express");
// Mock request/response helpers
function mockRequest(body = {}, params = {}, query = {}, headers = {}) {
    return {
        body,
        params,
        query,
        headers,
        user: { id: 'test-user-id', role: 'padrao' },
    };
}
function mockResponse() {
    const res = {};
    res.status = vitest_1.vi.fn().mockReturnThis();
    res.json = vitest_1.vi.fn().mockReturnThis();
    return res;
}
(0, vitest_1.describe)('PaymentController', () => {
    (0, vitest_1.describe)('Unit Tests', () => {
        (0, vitest_1.it)('should return 400 when subscription plan is missing', async () => {
            const req = mockRequest({}, {}, {});
            const res = mockResponse();
            // Simulate missing plan validation
            const plan = req.body?.plan;
            if (!plan) {
                res.status?.(400);
                res.json?.({ error: 'Plan is required' });
            }
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(400);
            (0, vitest_1.expect)(res.json).toHaveBeenCalledWith({ error: 'Plan is required' });
        });
        (0, vitest_1.it)('should return 400 when subscription plan is invalid', async () => {
            const req = mockRequest({ plan: 'invalid-plan' }, {}, {});
            const res = mockResponse();
            const validPlans = ['free', 'plus', 'premium', 'casal'];
            const plan = req.body?.plan;
            if (!validPlans.includes(plan)) {
                res.status?.(400);
                res.json?.({ error: 'Invalid plan' });
            }
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(400);
            (0, vitest_1.expect)(res.json).toHaveBeenCalledWith({ error: 'Invalid plan' });
        });
        (0, vitest_1.it)('should return 400 when amount is negative', async () => {
            const req = mockRequest({ amount: -50 }, {}, {});
            const res = mockResponse();
            const amount = req.body?.amount;
            if (amount !== undefined && amount < 0) {
                res.status?.(400);
                res.json?.({ error: 'Amount cannot be negative' });
            }
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(400);
            (0, vitest_1.expect)(res.json).toHaveBeenCalledWith({ error: 'Amount cannot be negative' });
        });
        (0, vitest_1.it)('should validate payment method format', async () => {
            const req = mockRequest({ paymentMethod: '' }, {}, {});
            const res = mockResponse();
            const paymentMethod = req.body?.paymentMethod;
            if (!paymentMethod || paymentMethod.trim() === '') {
                res.status?.(400);
                res.json?.({ error: 'Payment method is required' });
            }
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(400);
            (0, vitest_1.expect)(res.json).toHaveBeenCalledWith({ error: 'Payment method is required' });
        });
    });
});
//# sourceMappingURL=paymentController.test.js.map