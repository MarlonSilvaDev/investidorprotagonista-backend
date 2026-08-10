"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
// ─── MOCK SUPABASE MODULE ───
const mockSupabase = {
    auth: {
        getUser: vitest_1.vi.fn(),
    },
    from: vitest_1.vi.fn(),
};
vitest_1.vi.mock('../../database/supabase', () => ({
    supabase: mockSupabase,
}));
// ─── ensureAuthenticated ───
const ensureAuthenticated_1 = require("../../infra/http/middlewares/ensureAuthenticated");
const express_1 = require("express");
function createMockRequestAndResponse(overrides = {}) {
    const mockReq = {
        headers: {},
        user: undefined,
        ...overrides,
    };
    const mockRes = {
        status: vitest_1.vi.fn().mockReturnThis(),
        json: vitest_1.vi.fn().mockReturnThis(),
    };
    const mockNext = vitest_1.vi.fn();
    return { mockReq, mockRes, mockNext };
}
(0, vitest_1.describe)('ensureAuthenticated Middleware', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.it)('should return 401 when no Authorization header', async () => {
        const { mockReq, mockRes, mockNext } = createMockRequestAndResponse({
            headers: {},
        });
        await (0, ensureAuthenticated_1.ensureAuthenticated)(mockReq, mockRes, mockNext);
        (0, vitest_1.expect)(mockRes.status).toHaveBeenCalledWith(401);
        (0, vitest_1.expect)(mockRes.json).toHaveBeenCalledWith({ message: 'Token missing' });
        (0, vitest_1.expect)(mockNext).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should return 401 when Authorization header is "Bearer" only', async () => {
        const { mockReq, mockRes, mockNext } = createMockRequestAndResponse({
            headers: { authorization: 'Bearer ' },
        });
        await (0, ensureAuthenticated_1.ensureAuthenticated)(mockReq, mockRes, mockNext);
        (0, vitest_1.expect)(mockRes.status).toHaveBeenCalledWith(401);
        (0, vitest_1.expect)(mockRes.json).toHaveBeenCalledWith({ message: 'Token missing' });
        (0, vitest_1.expect)(mockNext).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should return 401 when Supabase getUser returns error', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
            data: null,
            error: { message: 'Invalid token' },
        });
        const { mockReq, mockRes, mockNext } = createMockRequestAndResponse({
            headers: { authorization: 'Bearer valid-token' },
        });
        await (0, ensureAuthenticated_1.ensureAuthenticated)(mockReq, mockRes, mockNext);
        (0, vitest_1.expect)(mockRes.status).toHaveBeenCalledWith(401);
        (0, vitest_1.expect)(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid token' });
        (0, vitest_1.expect)(mockNext).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should return 401 when Supabase getUser returns no user', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: null },
            error: null,
        });
        const { mockReq, mockRes, mockNext } = createMockRequestAndResponse({
            headers: { authorization: 'Bearer valid-token' },
        });
        await (0, ensureAuthenticated_1.ensureAuthenticated)(mockReq, mockRes, mockNext);
        (0, vitest_1.expect)(mockRes.status).toHaveBeenCalledWith(401);
        (0, vitest_1.expect)(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid token' });
        (0, vitest_1.expect)(mockNext).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should call next() with user id when token is valid', async () => {
        const userId = 'user-123-abc';
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: { id: userId } },
            error: null,
        });
        const { mockReq, mockRes, mockNext } = createMockRequestAndResponse({
            headers: { authorization: 'Bearer valid-jwt-token' },
        });
        await (0, ensureAuthenticated_1.ensureAuthenticated)(mockReq, mockRes, mockNext);
        (0, vitest_1.expect)(mockNext).toHaveBeenCalled();
        (0, vitest_1.expect)(mockReq.user?.id).toBe(userId);
    });
    (0, vitest_1.it)('should handle exception in getUser', async () => {
        mockSupabase.auth.getUser.mockRejectedValue(new Error('Network error'));
        const { mockReq, mockRes, mockNext } = createMockRequestAndResponse({
            headers: { authorization: 'Bearer token' },
        });
        await (0, ensureAuthenticated_1.ensureAuthenticated)(mockReq, mockRes, mockNext);
        (0, vitest_1.expect)(mockRes.status).toHaveBeenCalledWith(401);
        (0, vitest_1.expect)(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid token' });
        (0, vitest_1.expect)(mockNext).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should extract token from "Bearer token" format', async () => {
        const userId = 'user-456';
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: { id: userId } },
            error: null,
        });
        const { mockReq, mockRes, mockNext } = createMockRequestAndResponse({
            headers: { authorization: 'Bearer my-token-here' },
        });
        await (0, ensureAuthenticated_1.ensureAuthenticated)(mockReq, mockRes, mockNext);
        (0, vitest_1.expect)(mockSupabase.auth.getUser).toHaveBeenCalledWith('my-token-here');
        (0, vitest_1.expect)(mockNext).toHaveBeenCalled();
    });
});
// ─── checkLicensing ───
const checkLicensing_1 = require("../../infra/http/middlewares/checkLicensing");
(0, vitest_1.describe)('checkLicensing Middleware', () => {
    const mockProfile = {
        subscription_status: 'active',
        subscription_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        trial_started_at: new Date().toISOString(),
    };
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.it)('should return 403 when profile not found', async () => {
        mockSupabase.from.mockReturnValue({
            select: vitest_1.vi.fn().mockReturnThis(),
            eq: vitest_1.vi.fn().mockReturnThis(),
            single: vitest_1.vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
        });
        const { mockReq, mockRes, mockNext } = createMockRequestAndResponse({
            headers: {},
            user: { id: 'user-123' },
        });
        await (0, checkLicensing_1.checkLicensing)(mockReq, mockRes, mockNext);
        (0, vitest_1.expect)(mockRes.status).toHaveBeenCalledWith(403);
        (0, vitest_1.expect)(mockRes.json).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ message: vitest_1.expect.stringContaining('profile not found') }));
    });
    (0, vitest_1.it)('should return 402 when license expired', async () => {
        const expiredProfile = {
            subscription_status: 'active',
            subscription_expires_at: new Date(Date.now() - 1000).toISOString(),
            trial_started_at: new Date().toISOString(),
        };
        mockSupabase.from.mockReturnValue({
            select: vitest_1.vi.fn().mockReturnThis(),
            eq: vitest_1.vi.fn().mockReturnThis(),
            single: vitest_1.vi.fn().mockResolvedValue({ data: expiredProfile, error: null }),
        });
        mockSupabase.from.mockReturnValue({
            select: vitest_1.vi.fn().mockReturnThis(),
            eq: vitest_1.vi.fn().mockReturnThis(),
            single: vitest_1.vi.fn().mockResolvedValue({ data: expiredProfile, error: null }),
        });
        // Mock the update call for expired status
        const mockUpdate = vitest_1.vi.fn().mockReturnThis();
        const mockEq = vitest_1.vi.fn().mockResolvedValue({ error: null });
        mockSupabase.from.mockReturnValue({
            select: vitest_1.vi.fn().mockReturnThis(),
            eq: vitest_1.vi.fn().mockReturnThis(),
            single: vitest_1.vi.fn().mockResolvedValue({ data: expiredProfile, error: null }),
            update: mockUpdate,
        });
        const { mockReq, mockRes, mockNext } = createMockRequestAndResponse({
            headers: {},
            user: { id: 'user-123' },
        });
        await (0, checkLicensing_1.checkLicensing)(mockReq, mockRes, mockNext);
        (0, vitest_1.expect)(mockRes.status).toHaveBeenCalledWith(402);
        (0, vitest_1.expect)(mockRes.json).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ code: 'LICENSE_EXPIRED' }));
    });
    (0, vitest_1.it)('should return 402 when subscription is canceled', async () => {
        const canceledProfile = {
            subscription_status: 'canceled',
            subscription_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            trial_started_at: new Date().toISOString(),
        };
        mockSupabase.from.mockReturnValue({
            select: vitest_1.vi.fn().mockReturnThis(),
            eq: vitest_1.vi.fn().mockReturnThis(),
            single: vitest_1.vi.fn().mockResolvedValue({ data: canceledProfile, error: null }),
        });
        const { mockReq, mockRes, mockNext } = createMockRequestAndResponse({
            headers: {},
            user: { id: 'user-123' },
        });
        await (0, checkLicensing_1.checkLicensing)(mockReq, mockRes, mockNext);
        (0, vitest_1.expect)(mockRes.status).toHaveBeenCalledWith(402);
        (0, vitest_1.expect)(mockRes.json).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ code: 'SUBSCRIPTION_CANCELED' }));
    });
    (0, vitest_1.it)('should call next() when license is valid', async () => {
        const validProfile = {
            subscription_status: 'active',
            subscription_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            trial_started_at: new Date().toISOString(),
        };
        mockSupabase.from.mockReturnValue({
            select: vitest_1.vi.fn().mockReturnThis(),
            eq: vitest_1.vi.fn().mockReturnThis(),
            single: vitest_1.vi.fn().mockResolvedValue({ data: validProfile, error: null }),
        });
        const { mockReq, mockRes, mockNext } = createMockRequestAndResponse({
            headers: {},
            user: { id: 'user-123' },
        });
        await (0, checkLicensing_1.checkLicensing)(mockReq, mockRes, mockNext);
        (0, vitest_1.expect)(mockNext).toHaveBeenCalled();
        (0, vitest_1.expect)(mockRes.status).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=middlewares.test.js.map