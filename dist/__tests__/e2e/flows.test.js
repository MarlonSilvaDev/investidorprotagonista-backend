"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const express_1 = __importDefault(require("express"));
const supertest_1 = __importDefault(require("supertest"));
const routes_1 = require("../../routes");
const AuthTokenService_1 = require("../../core/utils/AuthTokenService");
// ─── MOCK SUPABASE ───
const { mockSupabase } = vitest_1.vi.hoisted(() => ({
    mockSupabase: {
        auth: {
            getUser: vitest_1.vi.fn(),
            signInWithPassword: vitest_1.vi.fn(),
            admin: {
                createUser: vitest_1.vi.fn(),
                updateUserById: vitest_1.vi.fn(),
                getUserById: vitest_1.vi.fn(),
            },
            signInWithIdToken: vitest_1.vi.fn(),
            refreshSession: vitest_1.vi.fn(),
        },
        from: vitest_1.vi.fn(),
    },
}));
vitest_1.vi.mock('../../config/supabase', () => ({
    supabase: mockSupabase,
    supabaseAdmin: mockSupabase,
}));
vitest_1.vi.mock('../../core/utils/MailService', () => ({
    sendConfirmationEmail: vitest_1.vi.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: vitest_1.vi.fn().mockResolvedValue(undefined),
}));
vitest_1.vi.mock('stripe', () => {
    const StripeMock = vitest_1.vi.fn().mockImplementation(() => ({
        customers: {
            create: vitest_1.vi.fn().mockResolvedValue({ id: 'cus_mock123' }),
        },
        checkout: {
            sessions: {
                create: vitest_1.vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/mock' }),
            },
        },
        webhooks: {
            constructEvent: vitest_1.vi.fn().mockReturnValue({ type: 'checkout.session.completed', data: { object: { metadata: { userId: 'user-1' }, subscription: 'sub_mock', current_period_end: Math.floor(Date.now() / 1000) + 2592000 } } }),
        },
        subscriptions: {
            retrieve: vitest_1.vi.fn().mockResolvedValue({ current_period_end: Math.floor(Date.now() / 1000) + 2592000 }),
        },
    }));
    return { default: StripeMock };
});
const mockUser = {
    id: 'user-e2e-test',
    email: 'e2e@example.com',
};
const mockToken = 'mock-jwt-e2e';
function buildApp() {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use(routes_1.routes);
    app.use((err, _req, res, _next) => { console.error('FLOW_ERROR', err); res.status(500).json({ message: String(err?.message || err) }); });
    return app;
}
(0, vitest_1.describe)('End-to-End Flows', () => {
    let app;
    let userId;
    let authToken;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        process.env.JWT_SECRET = 'test-jwt-secret';
        process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
        process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock';
        app = buildApp();
        userId = mockUser.id;
        authToken = mockToken;
        // Default: authenticated user with valid license
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: { id: userId, email: mockUser.email } },
            error: null,
        });
        const validProfile = {
            id: userId,
            subscription_status: 'active',
            subscription_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            trial_started_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            email: mockUser.email,
            name: 'E2E Test User',
            email_registrado: true,
            provider_type: 'email',
        };
        mockSupabase.from.mockImplementation((table) => {
            const defaultRecord = { id: mockUser.id, user_id: mockUser.id, subscription_status: 'active', subscription_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() };
            const chain = {
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockReturnThis(),
                neq: vitest_1.vi.fn().mockReturnThis(),
                is: vitest_1.vi.fn().mockReturnThis(),
                in: vitest_1.vi.fn().mockReturnThis(),
                not: vitest_1.vi.fn().mockReturnThis(),
                or: vitest_1.vi.fn().mockReturnThis(),
                order: vitest_1.vi.fn().mockReturnThis(),
                gt: vitest_1.vi.fn().mockReturnThis(),
                gte: vitest_1.vi.fn().mockReturnThis(),
                lte: vitest_1.vi.fn().mockReturnThis(),
                match: vitest_1.vi.fn().mockReturnThis(),
                maybeSingle: vitest_1.vi.fn().mockResolvedValue({ data: defaultRecord, error: null }),
                single: vitest_1.vi.fn().mockResolvedValue({ data: defaultRecord, error: null }),
                update: vitest_1.vi.fn().mockReturnThis(),
                insert: vitest_1.vi.fn().mockReturnThis(),
                delete: vitest_1.vi.fn().mockReturnThis(),
                upsert: vitest_1.vi.fn().mockReturnThis(),
                then: (resolve) => resolve({ data: [defaultRecord], error: null }),
            };
            return chain;
        });
    });
    (0, vitest_1.describe)('Complete Auth Flow', () => {
        (0, vitest_1.it)('should register -> confirm email -> login -> access protected resources', async () => {
            // Step 1: Register
            mockSupabase.auth.admin.createUser.mockResolvedValue({
                data: { user: { id: 'new-user', email: 'new@example.com', user_metadata: { name: 'New User' } } },
                error: null,
            });
            const emptyProfileBuilder = () => ({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockReturnThis(),
                or: vitest_1.vi.fn().mockReturnThis(),
                maybeSingle: vitest_1.vi.fn().mockResolvedValue({ data: null, error: null }),
                upsert: vitest_1.vi.fn().mockResolvedValue({ error: null }),
            });
            mockSupabase.from.mockReturnValueOnce(emptyProfileBuilder()).mockReturnValueOnce(emptyProfileBuilder());
            const registerRes = await (0, supertest_1.default)(app)
                .post('/auth/register')
                .send({ name: 'New User', documentNumber: '52998224725', phone: '11999999999', email: 'new@example.com', password: 'SecurePass1@' });
            (0, vitest_1.expect)(registerRes.status).toBe(201);
            const newUserId = registerRes.body.id;
            // Step 2: Confirm email
            const confirmToken = (0, AuthTokenService_1.signAuthMailToken)({
                sub: newUserId,
                email: 'new@example.com',
                type: 'email_confirm',
            });
            const confirmRes = await (0, supertest_1.default)(app)
                .get(`/auth/confirm-email?token=${confirmToken}`);
            (0, vitest_1.expect)(confirmRes.status).toBe(200);
            (0, vitest_1.expect)(confirmRes.text).toMatch(/confirmado/i);
            // Step 3: Login
            mockSupabase.auth.signInWithPassword.mockResolvedValue({
                data: {
                    user: { id: newUserId, email: 'new@example.com' },
                    session: { access_token: 'new-access-token', refresh_token: 'new-refresh-token' },
                },
                error: null,
            });
            // Update profile mock to include the new user with email_registrado: true
            const updatedProfile = {
                id: newUserId,
                email_registrado: true,
                provider_type: 'email',
            };
            mockSupabase.from.mockImplementation(() => ({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockReturnThis(),
                is: vitest_1.vi.fn().mockReturnThis(),
                order: vitest_1.vi.fn().mockResolvedValue({ data: [], error: null }),
                maybeSingle: vitest_1.vi.fn().mockResolvedValue({ data: updatedProfile, error: null }),
                single: vitest_1.vi.fn().mockResolvedValue({ data: updatedProfile, error: null }),
                update: vitest_1.vi.fn().mockReturnThis(),
                match: vitest_1.vi.fn().mockResolvedValue({ error: null }),
                insert: vitest_1.vi.fn().mockReturnThis(),
                delete: vitest_1.vi.fn().mockReturnThis(),
                gt: vitest_1.vi.fn().mockReturnThis(),
                upsert: vitest_1.vi.fn().mockReturnThis(),
            }));
            const loginRes = await (0, supertest_1.default)(app)
                .post('/auth/login')
                .send({ email: 'new@example.com', password: 'SecurePass1@' });
            (0, vitest_1.expect)(loginRes.status).toBe(200);
            (0, vitest_1.expect)(loginRes.body).toHaveProperty('token');
            // Step 4: Access protected resource with new token
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: { id: newUserId } },
                error: null,
            });
            const protectedRes = await (0, supertest_1.default)(app)
                .get('/transactions')
                .set('Authorization', `Bearer ${loginRes.body.token}`);
            (0, vitest_1.expect)([200, 402]).toContain(protectedRes.status); // 200 if licensed, 402 if not
        });
        (0, vitest_1.it)('should handle full password reset flow', async () => {
            // Step 1: Forgot password
            mockSupabase.from.mockImplementation(() => ({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockReturnThis(),
                maybeSingle: vitest_1.vi.fn().mockResolvedValue({
                    data: { id: userId, provider_type: 'email', name: 'Test' },
                    error: null,
                }),
                single: vitest_1.vi.fn().mockResolvedValue({
                    data: { id: userId, email_registrado: true, provider_type: 'email' },
                    error: null,
                }),
                update: vitest_1.vi.fn().mockReturnThis(),
                match: vitest_1.vi.fn().mockResolvedValue({ error: null }),
                insert: vitest_1.vi.fn().mockReturnThis(),
                delete: vitest_1.vi.fn().mockReturnThis(),
                gt: vitest_1.vi.fn().mockReturnThis(),
                upsert: vitest_1.vi.fn().mockReturnThis(),
            }));
            const forgotRes = await (0, supertest_1.default)(app)
                .post('/auth/forgot-password')
                .send({ email: 'e2e@example.com', locale: 'pt-BR' });
            (0, vitest_1.expect)(forgotRes.status).toBe(200);
            // Step 2: Generate reset token
            const resetToken = (0, AuthTokenService_1.signAuthMailToken)({
                sub: userId,
                email: 'e2e@example.com',
                type: 'password_reset',
            }, '1h');
            // Step 3: Access reset form
            const formRes = await (0, supertest_1.default)(app)
                .get(`/auth/reset-password?token=${resetToken}`);
            (0, vitest_1.expect)(formRes.status).toBe(200);
            (0, vitest_1.expect)(formRes.text).toContain('password');
            // Step 4: Reset password
            mockSupabase.auth.admin.updateUserById.mockResolvedValue({ error: null });
            const resetRes = await (0, supertest_1.default)(app)
                .post('/auth/reset-password')
                .send({
                token: resetToken,
                password: 'NewSecurePass1@',
                confirm: 'NewSecurePass1@',
            });
            (0, vitest_1.expect)(resetRes.status).toBe(200);
        });
    });
    (0, vitest_1.describe)('Complete CRUD Flow - Transactions', () => {
        let createdId;
        (0, vitest_1.it)('should create -> list -> delete a transaction', async () => {
            // Create
            const transactionData = {
                id: 'tx-e2e-1',
                user_id: userId,
                title: 'E2E Test Transaction',
                amount: 500,
                type: 'expense',
                category: 'test',
                date: '2025-01-15',
                description: 'E2E test',
            };
            mockSupabase.from.mockImplementation(() => ({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockReturnThis(),
                maybeSingle: vitest_1.vi.fn().mockResolvedValue({ data: { id: mockUser.id, subscription_status: 'active', subscription_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() }, error: null }),
                single: vitest_1.vi.fn().mockResolvedValue({ data: transactionData, error: null }),
                insert: vitest_1.vi.fn().mockReturnThis(),
                delete: vitest_1.vi.fn().mockReturnThis(),
                match: vitest_1.vi.fn().mockResolvedValue({ error: null }),
                order: vitest_1.vi.fn().mockReturnThis(),
                upsert: vitest_1.vi.fn().mockReturnThis(),
                gt: vitest_1.vi.fn().mockReturnThis(),
            }));
            mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: userId, email: mockUser.email } }, error: null });
            const createRes = await (0, supertest_1.default)(app)
                .post('/transactions')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                title: 'E2E Test Transaction',
                amount: 500,
                type: 'expense',
                category: 'test',
                date: '2025-01-15',
                description: 'E2E test',
            });
            (0, vitest_1.expect)(createRes.status).toBe(201);
            createdId = createRes.body.id;
            // List
            mockSupabase.from.mockImplementation(() => ({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockReturnThis(),
                maybeSingle: vitest_1.vi.fn().mockResolvedValue({ data: { id: mockUser.id, subscription_status: 'active', subscription_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() }, error: null }),
                order: vitest_1.vi.fn().mockResolvedValue({ data: [transactionData], error: null }),
                single: vitest_1.vi.fn().mockResolvedValue({ data: transactionData, error: null }),
                insert: vitest_1.vi.fn().mockReturnThis(),
                delete: vitest_1.vi.fn().mockReturnThis(),
                match: vitest_1.vi.fn().mockResolvedValue({ error: null }),
                upsert: vitest_1.vi.fn().mockReturnThis(),
                gt: vitest_1.vi.fn().mockReturnThis(),
            }));
            const listRes = await (0, supertest_1.default)(app)
                .get('/transactions')
                .set('Authorization', `Bearer ${authToken}`);
            (0, vitest_1.expect)(listRes.status).toBe(200);
            (0, vitest_1.expect)(Array.isArray(listRes.body)).toBe(true);
            // Delete
            mockSupabase.from.mockImplementation(() => ({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockReturnThis(),
                maybeSingle: vitest_1.vi.fn().mockResolvedValue({ data: { id: mockUser.id, subscription_status: 'active', subscription_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() }, error: null }),
                single: vitest_1.vi.fn().mockResolvedValue({ data: transactionData, error: null }),
                insert: vitest_1.vi.fn().mockReturnThis(),
                delete: vitest_1.vi.fn().mockReturnThis(),
                match: vitest_1.vi.fn().mockResolvedValue({ error: null }),
                order: vitest_1.vi.fn().mockReturnThis(),
                upsert: vitest_1.vi.fn().mockReturnThis(),
                gt: vitest_1.vi.fn().mockReturnThis(),
            }));
            const deleteRes = await (0, supertest_1.default)(app)
                .delete(`/transactions/${createdId}`)
                .set('Authorization', `Bearer ${authToken}`);
            (0, vitest_1.expect)(deleteRes.status).toBe(204);
        });
    });
    (0, vitest_1.describe)('Complete CRUD Flow - Goals', () => {
        (0, vitest_1.it)('should create -> list -> update a goal', async () => {
            const goalData = {
                id: 'goal-e2e-1',
                user_id: userId,
                title: 'E2E Goal',
                target_amount: 50000,
                current_amount: 0,
                deadline: '2025-12-31',
            };
            mockSupabase.from.mockImplementation(() => ({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockReturnThis(),
                maybeSingle: vitest_1.vi.fn().mockResolvedValue({ data: { id: mockUser.id, subscription_status: 'active', subscription_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() }, error: null }),
                single: vitest_1.vi.fn().mockResolvedValue({ data: goalData, error: null }),
                insert: vitest_1.vi.fn().mockReturnThis(),
                update: vitest_1.vi.fn().mockReturnThis(),
                match: vitest_1.vi.fn().mockResolvedValue({ data: { ...goalData, current_amount: 10000 }, error: null }),
                delete: vitest_1.vi.fn().mockReturnThis(),
                order: vitest_1.vi.fn().mockReturnThis(),
                upsert: vitest_1.vi.fn().mockReturnThis(),
                gt: vitest_1.vi.fn().mockReturnThis(),
            }));
            // Create
            mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: userId, email: mockUser.email } }, error: null });
            const createRes = await (0, supertest_1.default)(app)
                .post('/goals')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                title: 'E2E Goal',
                targetAmount: 50000,
                currentAmount: 0,
                deadline: '2025-12-31',
            });
            (0, vitest_1.expect)(createRes.status).toBe(201);
            // List
            mockSupabase.from.mockImplementation(() => ({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockReturnThis(),
                maybeSingle: vitest_1.vi.fn().mockResolvedValue({ data: { id: mockUser.id, subscription_status: 'active', subscription_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() }, error: null }),
                single: vitest_1.vi.fn().mockResolvedValue({ data: goalData, error: null }),
                insert: vitest_1.vi.fn().mockReturnThis(),
                update: vitest_1.vi.fn().mockReturnThis(),
                match: vitest_1.vi.fn().mockResolvedValue({ data: goalData, error: null }),
                delete: vitest_1.vi.fn().mockReturnThis(),
                order: vitest_1.vi.fn().mockReturnThis(),
                upsert: vitest_1.vi.fn().mockReturnThis(),
                gt: vitest_1.vi.fn().mockReturnThis(),
            }));
            const listRes = await (0, supertest_1.default)(app)
                .get('/goals')
                .set('Authorization', `Bearer ${authToken}`);
            (0, vitest_1.expect)(listRes.status).toBe(200);
            // Update
            const updatedGoal = { ...goalData, current_amount: 10000 };
            mockSupabase.from.mockImplementation(() => ({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockReturnThis(),
                maybeSingle: vitest_1.vi.fn().mockResolvedValue({ data: { id: mockUser.id, subscription_status: 'active', subscription_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() }, error: null }),
                single: vitest_1.vi.fn().mockResolvedValue({ data: goalData, error: null }),
                insert: vitest_1.vi.fn().mockReturnThis(),
                update: vitest_1.vi.fn().mockReturnThis(),
                match: vitest_1.vi.fn().mockResolvedValue({ data: updatedGoal, error: null }),
                delete: vitest_1.vi.fn().mockReturnThis(),
                order: vitest_1.vi.fn().mockReturnThis(),
                upsert: vitest_1.vi.fn().mockReturnThis(),
                gt: vitest_1.vi.fn().mockReturnThis(),
            }));
            const updateRes = await (0, supertest_1.default)(app)
                .put('/goals/goal-e2e-1')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ currentAmount: 10000 });
            (0, vitest_1.expect)(updateRes.status).toBe(200);
        });
    });
    (0, vitest_1.describe)('Sync Flow - Push and Pull', () => {
        (0, vitest_1.it)('should push changes and pull server data', async () => {
            const serverTime = new Date().toISOString();
            // Push
            mockSupabase.from.mockImplementation(() => ({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockReturnThis(),
                maybeSingle: vitest_1.vi.fn().mockResolvedValue({ data: { id: mockUser.id, subscription_status: 'active', subscription_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() }, error: null }),
                single: vitest_1.vi.fn().mockResolvedValue({
                    data: { id: 'tx-sync-1', updated_at: serverTime },
                    error: null,
                }),
                upsert: vitest_1.vi.fn().mockReturnThis(),
                delete: vitest_1.vi.fn().mockReturnThis(),
                match: vitest_1.vi.fn().mockResolvedValue({ error: null }),
                insert: vitest_1.vi.fn().mockReturnThis(),
                order: vitest_1.vi.fn().mockReturnThis(),
                gt: vitest_1.vi.fn().mockReturnThis(),
            }));
            const pushRes = await (0, supertest_1.default)(app)
                .post('/sync/push')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                operations: [
                    {
                        entity: 'transaction',
                        op: 'upsert',
                        client_id: 'tx-sync-1',
                        payload: {
                            title: 'Synced Item',
                            amount: 200,
                            type: 'expense',
                            category: 'sync',
                            date: '2025-01-20',
                        },
                    },
                    {
                        entity: 'goal',
                        op: 'upsert',
                        client_id: 'goal-sync-1',
                        payload: {
                            title: 'Synced Goal',
                            targetAmount: 20000,
                            currentAmount: 5000,
                        },
                    },
                ],
            });
            (0, vitest_1.expect)(pushRes.status).toBe(200);
            (0, vitest_1.expect)(pushRes.body.results.length).toBe(2);
            (0, vitest_1.expect)(pushRes.body.results.every((r) => r.status === 'applied')).toBe(true);
            // Pull
            mockSupabase.from.mockImplementation(() => {
                const resolved = { data: [], error: null };
                const chain = {
                    select: vitest_1.vi.fn().mockReturnThis(),
                    eq: vitest_1.vi.fn().mockReturnThis(),
                    maybeSingle: vitest_1.vi.fn().mockResolvedValue({ data: null, error: null }),
                    gt: vitest_1.vi.fn().mockReturnThis(),
                    then: (resolve) => Promise.resolve(resolved).then(resolve),
                };
                return chain;
            });
            const pullRes = await (0, supertest_1.default)(app)
                .get('/sync/pull?since=2025-01-01T00:00:00Z')
                .set('Authorization', `Bearer ${authToken}`);
            (0, vitest_1.expect)(pullRes.status).toBe(200);
            (0, vitest_1.expect)(pullRes.body).toHaveProperty('server_time');
            (0, vitest_1.expect)(pullRes.body).toHaveProperty('changes');
        });
    });
    (0, vitest_1.describe)('License Expiration Flow', () => {
        (0, vitest_1.it)('should block all protected endpoints when license expires', async () => {
            mockSupabase.from.mockImplementation(() => ({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockReturnThis(),
                maybeSingle: vitest_1.vi.fn().mockResolvedValue({ data: null, error: null }),
                single: vitest_1.vi.fn().mockResolvedValue({
                    data: {
                        subscription_status: 'active',
                        subscription_expires_at: new Date(Date.now() - 1000).toISOString(),
                        trial_started_at: new Date().toISOString(),
                    },
                    error: null,
                }),
                update: vitest_1.vi.fn().mockReturnThis(),
                match: vitest_1.vi.fn().mockResolvedValue({ error: null }),
                insert: vitest_1.vi.fn().mockReturnThis(),
                delete: vitest_1.vi.fn().mockReturnThis(),
                upsert: vitest_1.vi.fn().mockReturnThis(),
                gt: vitest_1.vi.fn().mockReturnThis(),
            }));
            const protectedRoutes = [
                { method: 'get', path: '/transactions' },
                { method: 'get', path: '/investments' },
                { method: 'get', path: '/goals' },
                { method: 'get', path: '/cards' },
                { method: 'get', path: '/subscriptions' },
                { method: 'get', path: '/dashboard/consolidated' },
            ];
            for (const { method, path } of protectedRoutes) {
                const res = await (0, supertest_1.default)(app)
                    .get(path)
                    .set('Authorization', `Bearer ${authToken}`);
                (0, vitest_1.expect)(res.status).toBe(402);
                (0, vitest_1.expect)(res.body.code).toBe('LICENSE_EXPIRED');
            }
        });
    });
    (0, vitest_1.describe)('Payment Flow', () => {
        (0, vitest_1.it)('should create checkout session and handle webhook', async () => {
            // Create checkout
            mockSupabase.from.mockImplementation(() => ({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockReturnThis(),
                maybeSingle: vitest_1.vi.fn().mockResolvedValue({ data: null, error: null }),
                single: vitest_1.vi.fn().mockResolvedValue({
                    data: { email: mockUser.email, stripe_customer_id: null },
                    error: null,
                }),
                update: vitest_1.vi.fn().mockReturnThis(),
                match: vitest_1.vi.fn().mockResolvedValue({ error: null }),
                insert: vitest_1.vi.fn().mockReturnThis(),
                delete: vitest_1.vi.fn().mockReturnThis(),
                upsert: vitest_1.vi.fn().mockReturnThis(),
                gt: vitest_1.vi.fn().mockReturnThis(),
            }));
            const checkoutRes = await (0, supertest_1.default)(app)
                .post('/payment/checkout')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ priceId: 'price_test_123' });
            (0, vitest_1.expect)(checkoutRes.status).toBe(200);
            (0, vitest_1.expect)(checkoutRes.body).toHaveProperty('url');
            // Webhook
            const webhookRes = await (0, supertest_1.default)(app)
                .post('/payment/webhook')
                .set('Content-Type', 'application/json')
                .set('stripe-signature', 'valid-sig')
                .send(JSON.stringify({ type: 'checkout.session.completed' }));
            (0, vitest_1.expect)(webhookRes.status).toBe(200);
        });
    });
});
// Test requests use plain JSON; credential encryption is tested separately.
vitest_1.vi.mock('../../shared/middlewares/decryptAuthCredentials', () => ({ decryptAuthCredentials: (_req, _res, next) => next() }));
// Keep endpoint-specific E2E fixtures compatible with every protected middleware chain.
const originalFromImplementation = mockSupabase.from.mockImplementation.bind(mockSupabase.from);
mockSupabase.from.mockImplementation = ((factory) => originalFromImplementation((...args) => {
    const value = factory(...args) || {};
    return {
        select: vitest_1.vi.fn().mockReturnThis(),
        insert: vitest_1.vi.fn().mockReturnThis(),
        update: vitest_1.vi.fn().mockReturnThis(),
        delete: vitest_1.vi.fn().mockReturnThis(),
        eq: vitest_1.vi.fn().mockReturnThis(),
        is: vitest_1.vi.fn().mockReturnThis(),
        or: vitest_1.vi.fn().mockReturnThis(),
        order: vitest_1.vi.fn().mockReturnThis(),
        single: vitest_1.vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: vitest_1.vi.fn().mockResolvedValue({ data: { id: mockUser.id, subscription_status: 'active', subscription_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() }, error: null }),
        ...value,
    };
}));
//# sourceMappingURL=flows.test.js.map