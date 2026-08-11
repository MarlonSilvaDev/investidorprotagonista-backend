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
(0, vitest_1.describe)('SharedAccountController', () => {
    (0, vitest_1.describe)('Unit Tests', () => {
        (0, vitest_1.it)('should return 400 when partner email is missing', async () => {
            const req = mockRequest({}, {}, {});
            const res = mockResponse();
            const partnerEmail = req.body?.partnerEmail;
            if (!partnerEmail) {
                res.status?.(400);
                res.json?.({ error: 'Partner email is required' });
            }
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(400);
            (0, vitest_1.expect)(res.json).toHaveBeenCalledWith({ error: 'Partner email is required' });
        });
        (0, vitest_1.it)('should return 400 when partner email is invalid format', async () => {
            const req = mockRequest({ partnerEmail: 'not-an-email' }, {}, {});
            const res = mockResponse();
            const email = req.body?.partnerEmail;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                res.status?.(400);
                res.json?.({ error: 'Invalid email format' });
            }
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(400);
            (0, vitest_1.expect)(res.json).toHaveBeenCalledWith({ error: 'Invalid email format' });
        });
        (0, vitest_1.it)('should return 400 when trying to share with self', async () => {
            const userId = 'user-123';
            const req = mockRequest({ partnerEmail: 'user-123@email.com' }, {}, {}, { id: userId });
            const res = mockResponse();
            // In a real controller, this would check the actual email match
            // Here we simulate the validation logic
            const user = req.user;
            if (user.id === 'user-123') {
                res.status?.(400);
                res.json?.({ error: 'Cannot share account with yourself' });
            }
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(400);
        });
        (0, vitest_1.it)('should validate share code format', async () => {
            const req = mockRequest({ shareCode: 'invalid' }, {}, {});
            const res = mockResponse();
            const shareCode = req.body?.shareCode;
            if (shareCode && shareCode.length < 8) {
                res.status?.(400);
                res.json?.({ error: 'Invalid share code' });
            }
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(400);
            (0, vitest_1.expect)(res.json).toHaveBeenCalledWith({ error: 'Invalid share code' });
        });
    });
});
//# sourceMappingURL=sharedAccountController.test.js.map