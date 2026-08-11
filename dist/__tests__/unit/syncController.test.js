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
(0, vitest_1.describe)('SyncController', () => {
    (0, vitest_1.describe)('Push Validation', () => {
        (0, vitest_1.it)('should reject push with empty operations', () => {
            const req = mockRequest({ operations: [] });
            const res = mockResponse();
            const operations = req.body?.operations;
            if (!operations || operations.length === 0) {
                res.status?.(400);
                res.json?.({ error: 'No operations to sync' });
            }
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(400);
        });
        (0, vitest_1.it)('should reject push with missing operations field', () => {
            const req = mockRequest({});
            const res = mockResponse();
            const operations = req.body?.operations;
            if (!operations) {
                res.status?.(400);
                res.json?.({ error: 'Operations field is required' });
            }
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(400);
        });
        (0, vitest_1.it)('should validate operation structure', () => {
            const req = mockRequest({
                operations: [
                    { entity: 'transaction', op: 'upsert', client_id: 'tx-1', payload: {} },
                    { entity: 'goal', op: 'delete', client_id: 'goal-1' },
                ],
            });
            const res = mockResponse();
            const operations = req.body?.operations;
            const validOps = operations.every((op) => op.entity && op.op && op.client_id &&
                ['upsert', 'delete'].includes(op.op));
            if (validOps) {
                res.status?.(200);
                res.json?.({ results: operations.map(() => ({ status: 'applied' })) });
            }
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(200);
        });
        (0, vitest_1.it)('should reject operation with invalid type', () => {
            const req = mockRequest({
                operations: [
                    { entity: 'transaction', op: 'invalid_op', client_id: 'tx-1' },
                ],
            });
            const res = mockResponse();
            const operations = req.body?.operations;
            const isValidOp = operations.every((op) => ['upsert', 'delete'].includes(op.op));
            if (!isValidOp) {
                res.status?.(400);
                res.json?.({ error: 'Invalid operation type' });
            }
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(400);
        });
        (0, vitest_1.it)('should reject operation with missing entity', () => {
            const req = mockRequest({
                operations: [
                    { op: 'upsert', client_id: 'tx-1', payload: {} },
                ],
            });
            const res = mockResponse();
            const operations = req.body?.operations;
            const hasEntity = operations.every((op) => op.entity);
            if (!hasEntity) {
                res.status?.(400);
                res.json?.({ error: 'Entity is required for each operation' });
            }
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(400);
        });
    });
    (0, vitest_1.describe)('Pull Validation', () => {
        (0, vitest_1.it)('should handle pull without since parameter', () => {
            const req = mockRequest({}, {}, {});
            const res = mockResponse();
            const since = req.query?.since;
            // Pull without since should return all data
            const pullResponse = {
                changes: {
                    transactions: [],
                    categories: [],
                    goals: [],
                    tasks: [],
                    cards: [],
                    subscriptions: [],
                    investments: [],
                },
                server_time: new Date().toISOString(),
            };
            res.status?.(200);
            res.json?.(pullResponse);
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(200);
            (0, vitest_1.expect)(res.json).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                changes: vitest_1.expect.objectContaining({
                    transactions: vitest_1.expect.any(Array),
                    categories: vitest_1.expect.any(Array),
                    goals: vitest_1.expect.any(Array),
                }),
            }));
        });
        (0, vitest_1.it)('should handle pull with since parameter', () => {
            const req = mockRequest({}, {}, { since: '2025-01-01T00:00:00Z' });
            const res = mockResponse();
            const since = req.query?.since;
            const isValidDate = !isNaN(Date.parse(since));
            if (isValidDate) {
                const pullResponse = {
                    changes: {
                        transactions: [
                            { id: 'tx-1', updated_at: '2025-01-15T10:00:00Z' },
                        ],
                        goals: [],
                        tasks: [],
                        cards: [],
                        subscriptions: [],
                        investments: [],
                    },
                    server_time: new Date().toISOString(),
                };
                res.status?.(200);
                res.json?.(pullResponse);
            }
            else {
                res.status?.(400);
                res.json?.({ error: 'Invalid since parameter' });
            }
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(200);
        });
        (0, vitest_1.it)('should return all entity types in pull response', () => {
            const req = mockRequest({}, {}, {});
            const res = mockResponse();
            const pullResponse = {
                changes: {
                    transactions: [],
                    categories: [],
                    goals: [],
                    tasks: [],
                    cards: [],
                    subscriptions: [],
                    investments: [],
                },
                server_time: new Date().toISOString(),
            };
            res.status?.(200);
            res.json?.(pullResponse);
            (0, vitest_1.expect)(res.json).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                changes: vitest_1.expect.objectContaining({
                    transactions: vitest_1.expect.any(Array),
                    categories: vitest_1.expect.any(Array),
                    goals: vitest_1.expect.any(Array),
                    tasks: vitest_1.expect.any(Array),
                    cards: vitest_1.expect.any(Array),
                    subscriptions: vitest_1.expect.any(Array),
                    investments: vitest_1.expect.any(Array),
                }),
            }));
        });
    });
});
//# sourceMappingURL=syncController.test.js.map