"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const PaymentController_1 = require("../../modules/payment/PaymentController");
function createMockReqRes(overrides = {}) {
    const req = {
        user: overrides.user || { id: 'user-1', userType: 'usuario' },
        body: overrides.body || {},
        headers: overrides.headers || {},
    };
    const res = {
        status: vitest_1.vi.fn().mockReturnThis(),
        json: vitest_1.vi.fn().mockReturnThis(),
        send: vitest_1.vi.fn().mockReturnThis(),
        cookie: vitest_1.vi.fn().mockReturnThis(),
    };
    return { req, res };
}
const mockUpdate = vitest_1.vi.fn().mockReturnThis();
const mockEq = vitest_1.vi.fn().mockReturnThis();
const mockSelect = vitest_1.vi.fn().mockReturnThis();
const mockSingle = vitest_1.vi.fn();
vitest_1.vi.mock('../../config/supabase', () => ({
    supabase: {
        from: vitest_1.vi.fn(() => ({
            select: mockSelect,
            update: mockUpdate,
            eq: mockEq,
            single: mockSingle,
        })),
    },
}));
(0, vitest_1.describe)('PaymentController Plan Upgrades', () => {
    let paymentController;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        paymentController = new PaymentController_1.PaymentController();
    });
    (0, vitest_1.it)('should update plan, origin and status in Supabase on updatePlan', async () => {
        mockSingle.mockResolvedValue({
            data: {
                id: 'user-1',
                plan: 'pro_usuario',
                subscription_origin: 'stripe',
                subscription_status: 'active',
            },
            error: null,
        });
        const { req, res } = createMockReqRes({
            user: { id: 'user-1', userType: 'usuario' },
            body: { plan: 'pro_usuario', origin: 'stripe' },
        });
        await paymentController.updatePlan(req, res);
        (0, vitest_1.expect)(mockUpdate).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            plan: 'pro_usuario',
            subscription_origin: 'stripe',
            subscription_status: 'active',
        }));
        (0, vitest_1.expect)(res.json).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            message: vitest_1.expect.stringMatching(/sucesso/i),
        }));
    });
    (0, vitest_1.it)('should set origin to app_store or google_play on verifyPurchase', async () => {
        mockSingle.mockResolvedValue({
            data: {
                id: 'user-1',
                plan: 'pro_usuario',
                subscription_origin: 'app_store',
                subscription_status: 'active',
            },
            error: null,
        });
        const { req, res } = createMockReqRes({
            user: { id: 'user-1', userType: 'usuario' },
            body: { plan: 'pro_usuario', platform: 'ios' },
        });
        await paymentController.verifyPurchase(req, res);
        (0, vitest_1.expect)(mockUpdate).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            plan: 'pro_usuario',
            subscription_origin: 'app_store',
            subscription_status: 'active',
        }));
    });
    (0, vitest_1.it)('should enforce pro_empresa for empresa userType on upgrade', async () => {
        mockSingle.mockResolvedValue({
            data: {
                id: 'user-2',
                plan: 'pro_empresa',
                subscription_origin: 'stripe',
                subscription_status: 'active',
            },
            error: null,
        });
        const { req, res } = createMockReqRes({
            user: { id: 'user-2', userType: 'empresa' },
            body: { plan: 'free' },
        });
        await paymentController.updatePlan(req, res);
        (0, vitest_1.expect)(mockUpdate).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            plan: 'pro_empresa',
        }));
    });
});
//# sourceMappingURL=payment.test.js.map