"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const routes_1 = require("../../routes");
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
// ─── MOCK SERVICES ───
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
// ─── BUILD EXPRESS APP ───
function buildApp() {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use(routes_1.routes);
    return app;
}
const mockUser = {
    id: 'user-integration-test',
    email: 'test@example.com',
};
const mockToken = 'mock-jwt-token-12345';
function setupAuthenticatedUser() {
    mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUser.id, email: mockUser.email } },
        error: null,
    });
}
function setupProfile(status = 'active', expiresAt, tableData = null) {
    const profile = {
        id: mockUser.id,
        subscription_status: status,
        subscription_expires_at: expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        trial_started_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        email: mockUser.email,
        name: 'Test User',
        email_registrado: true,
        provider_type: 'email',
        stripe_customer_id: null,
        user_type: 'usuario',
        plan: 'usuario',
        country: 'BR',
        role: 'padrao',
    };
    const createChain = (data) => ({
        select: vitest_1.vi.fn().mockReturnThis(),
        eq: vitest_1.vi.fn().mockReturnThis(),
        or: vitest_1.vi.fn().mockReturnThis(),
        order: vitest_1.vi.fn().mockReturnThis(),
        gt: vitest_1.vi.fn().mockReturnThis(),
        match: vitest_1.vi.fn().mockReturnThis(),
        single: vitest_1.vi.fn().mockResolvedValue({ data, error: null }),
        maybeSingle: vitest_1.vi.fn().mockResolvedValue({ data, error: null }),
        update: vitest_1.vi.fn().mockReturnThis(),
        upsert: vitest_1.vi.fn().mockResolvedValue({ data, error: null }),
        insert: vitest_1.vi.fn().mockReturnThis(),
        delete: vitest_1.vi.fn().mockReturnThis(),
        then: (resolve) => resolve({ data, error: null }),
    });
    mockSupabase.from.mockImplementation((table) => {
        if (table === 'profiles') {
            return createChain(profile);
        }
        return createChain(tableData);
    });
    return profile;
}
(0, vitest_1.describe)('Integration Tests - API Endpoints', () => {
    let app;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: mockUser.id, email: mockUser.email } }, error: null });
        process.env.JWT_SECRET = 'test-jwt-secret';
        process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
        process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock';
        app = buildApp();
    });
    // ─── AUTH ENDPOINTS ───
    (0, vitest_1.describe)('POST /auth/register', () => {
        (0, vitest_1.it)('should register a new user successfully', async () => {
            const newUserData = {
                user: {
                    id: 'new-user-id',
                    email: 'newuser@example.com',
                    user_metadata: { name: 'New User' },
                },
            };
            mockSupabase.auth.admin.createUser.mockResolvedValue({
                data: newUserData,
                error: null,
            });
            mockSupabase.from.mockReturnValue({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockReturnThis(),
                maybeSingle: vitest_1.vi.fn().mockResolvedValue({ data: null, error: null }),
                update: vitest_1.vi.fn().mockReturnThis(),
                upsert: vitest_1.vi.fn().mockResolvedValue({ error: null }),
            });
            const response = await (0, supertest_1.default)(app)
                .post('/auth/register')
                .send({
                name: 'New User',
                documentNumber: '52998224725',
                phone: '11999999999',
                email: 'newuser@example.com',
                password: 'SecurePass1@',
                locale: 'pt-BR',
            });
            (0, vitest_1.expect)(response.status).toBe(201);
            (0, vitest_1.expect)(response.body).toHaveProperty('id');
            (0, vitest_1.expect)(response.body).toHaveProperty('email');
            (0, vitest_1.expect)(response.body.requires_email_confirmation).toBe(true);
        });
        (0, vitest_1.it)('should return 400 for invalid email', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/auth/register')
                .send({
                name: 'Test',
                email: 'invalid-email',
                password: 'SecurePass1@',
            });
            (0, vitest_1.expect)(response.status).toBe(400);
            (0, vitest_1.expect)(response.body.message).toContain('E-mail inválido');
        });
        (0, vitest_1.it)('should return 400 for missing name', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/auth/register')
                .send({
                email: 'test@example.com',
                password: 'SecurePass1@',
            });
            (0, vitest_1.expect)(response.status).toBe(400);
            (0, vitest_1.expect)(response.body.message).toContain('Nome é obrigatório');
        });
        (0, vitest_1.it)('should return 400 for weak password', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/auth/register')
                .send({
                name: 'Test',
                email: 'test@example.com',
                password: 'weak',
            });
            (0, vitest_1.expect)(response.status).toBe(400);
        });
        (0, vitest_1.it)('should return 400 if Supabase user creation fails', async () => {
            mockSupabase.auth.admin.createUser.mockResolvedValue({
                data: null,
                error: { message: 'User already exists' },
            });
            const response = await (0, supertest_1.default)(app)
                .post('/auth/register')
                .send({
                name: 'Test',
                email: 'existing@example.com',
                password: 'SecurePass1@',
            });
            (0, vitest_1.expect)(response.status).toBe(400);
        });
    });
    (0, vitest_1.describe)('POST /auth/login', () => {
        (0, vitest_1.it)('should login successfully with valid credentials', async () => {
            mockSupabase.auth.signInWithPassword.mockResolvedValue({
                data: {
                    user: { id: 'user-1', email: 'test@example.com' },
                    session: { access_token: 'access-token-123', refresh_token: 'refresh-token-123' },
                },
                error: null,
            });
            mockSupabase.from.mockReturnValue({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockReturnThis(),
                maybeSingle: vitest_1.vi.fn().mockResolvedValue({
                    data: {
                        id: 'user-1',
                        email: 'test@example.com',
                        email_registrado: true,
                        provider_type: 'email',
                    },
                    error: null,
                }),
            });
            const response = await (0, supertest_1.default)(app)
                .post('/auth/login')
                .send({
                email: 'test@example.com',
                password: 'SecurePass1@',
            });
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body).toHaveProperty('token');
            (0, vitest_1.expect)(response.body).toHaveProperty('user');
        });
        (0, vitest_1.it)('should return 403 if email not confirmed', async () => {
            mockSupabase.auth.signInWithPassword.mockResolvedValue({
                data: {
                    user: { id: 'user-1', email: 'test@example.com' },
                    session: { access_token: 'token', refresh_token: 'refresh' },
                },
                error: null,
            });
            mockSupabase.from.mockReturnValue({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockReturnThis(),
                maybeSingle: vitest_1.vi.fn().mockResolvedValue({
                    data: { email_registrado: false },
                    error: null,
                }),
            });
            const response = await (0, supertest_1.default)(app)
                .post('/auth/login')
                .send({
                email: 'test@example.com',
                password: 'SecurePass1@',
            });
            (0, vitest_1.expect)(response.status).toBe(403);
            (0, vitest_1.expect)(response.body.message).toContain('Confirme seu e-mail');
        });
        (0, vitest_1.it)('should return 400 for invalid credentials', async () => {
            mockSupabase.auth.signInWithPassword.mockResolvedValue({
                data: null,
                error: { message: 'Invalid login credentials' },
            });
            const response = await (0, supertest_1.default)(app)
                .post('/auth/login')
                .send({
                email: 'test@example.com',
                password: 'WrongPass1@',
            });
            (0, vitest_1.expect)(response.status).toBe(400);
        });
        (0, vitest_1.it)('should return 400 for missing password', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/auth/login')
                .send({
                email: 'test@example.com',
            });
            (0, vitest_1.expect)(response.status).toBe(400);
            (0, vitest_1.expect)(response.body.message).toContain('Senha é obrigatória');
        });
    });
    (0, vitest_1.describe)('POST /auth/forgot-password', () => {
        (0, vitest_1.it)('should return generic message when email not found', async () => {
            mockSupabase.from.mockReturnValue({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockReturnThis(),
                maybeSingle: vitest_1.vi.fn().mockResolvedValue({ data: null, error: null }),
            });
            const response = await (0, supertest_1.default)(app)
                .post('/auth/forgot-password')
                .send({ email: 'unknown@example.com', locale: 'pt-BR' });
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body.message).toContain('Se o e-mail estiver cadastrado');
        });
        (0, vitest_1.it)('should detect Google account and return appropriate message', async () => {
            mockSupabase.from.mockReturnValue({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockReturnThis(),
                maybeSingle: vitest_1.vi.fn().mockResolvedValue({
                    data: { id: 'user-1', provider_type: 'google', name: 'Test' },
                    error: null,
                }),
            });
            const response = await (0, supertest_1.default)(app)
                .post('/auth/forgot-password')
                .send({ email: 'google@example.com', locale: 'pt-BR' });
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body.provider_type).toBe('google');
        });
    });
    (0, vitest_1.describe)('POST /auth/google', () => {
        (0, vitest_1.it)('should login with Google ID token', async () => {
            mockSupabase.auth.signInWithIdToken.mockResolvedValue({
                data: {
                    user: { id: 'google-user-1', email: 'google@example.com' },
                    session: { access_token: 'google-token', refresh_token: 'google-refresh' },
                },
                error: null,
            });
            mockSupabase.from.mockReturnValue({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockReturnThis(),
                maybeSingle: vitest_1.vi.fn().mockResolvedValue({
                    data: { id: 'google-user-1', provider_type: 'google', email_registrado: true },
                    error: null,
                }),
                update: vitest_1.vi.fn().mockReturnThis(),
            });
            const response = await (0, supertest_1.default)(app)
                .post('/auth/google')
                .send({ id_token: 'google-id-token', access_token: 'google-access-token' });
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body).toHaveProperty('token');
            (0, vitest_1.expect)(response.body.provider_type).toBe('google');
        });
        (0, vitest_1.it)('should return 400 when id_token is missing', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/auth/google')
                .send({ access_token: 'token' });
            (0, vitest_1.expect)(response.status).toBe(400);
            (0, vitest_1.expect)(response.body.message).toContain('id_token is required');
        });
    });
    (0, vitest_1.describe)('POST /auth/refresh', () => {
        (0, vitest_1.it)('should refresh session successfully', async () => {
            mockSupabase.auth.refreshSession.mockResolvedValue({
                data: {
                    session: { access_token: 'new-access-token', refresh_token: 'new-refresh-token' },
                    user: { id: 'user-1', email: 'test@example.com' },
                },
                error: null,
            });
            mockSupabase.from.mockReturnValue({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockReturnThis(),
                maybeSingle: vitest_1.vi.fn().mockResolvedValue({
                    data: { id: 'user-1', email_registrado: true, provider_type: 'email' },
                    error: null,
                }),
            });
            const response = await (0, supertest_1.default)(app)
                .post('/auth/refresh')
                .send({ refresh_token: 'valid-refresh-token' });
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body).toHaveProperty('access_token');
            (0, vitest_1.expect)(response.body).toHaveProperty('refresh_token');
        });
        (0, vitest_1.it)('should return 400 when refresh_token is missing', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/auth/refresh')
                .send({});
            (0, vitest_1.expect)(response.status).toBe(400);
        });
        (0, vitest_1.it)('should return 401 when refresh token is invalid', async () => {
            mockSupabase.auth.refreshSession.mockResolvedValue({
                data: null,
                error: { message: 'Invalid refresh token' },
            });
            const response = await (0, supertest_1.default)(app)
                .post('/auth/refresh')
                .send({ refresh_token: 'invalid-token' });
            (0, vitest_1.expect)(response.status).toBe(401);
        });
    });
    // ─── PROTECTED ENDPOINTS ───
    (0, vitest_1.describe)('Protected Routes - Auth Required', () => {
        (0, vitest_1.it)('should return 401 for protected route without token', async () => {
            const response = await (0, supertest_1.default)(app).get('/transactions');
            (0, vitest_1.expect)(response.status).toBe(401);
        });
        (0, vitest_1.it)('should return 401 for protected route with invalid token', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: null,
                error: { message: 'Invalid token' },
            });
            const response = await (0, supertest_1.default)(app)
                .get('/transactions')
                .set('Authorization', 'Bearer invalid-token');
            (0, vitest_1.expect)(response.status).toBe(401);
        });
    });
    // ─── TRANSACTION ENDPOINTS ───
    (0, vitest_1.describe)('Transaction Endpoints', () => {
        (0, vitest_1.beforeEach)(() => {
            setupAuthenticatedUser();
            setupProfile();
        });
        (0, vitest_1.it)('GET /transactions should return user transactions', async () => {
            const mockTransactions = [
                { id: '1', user_id: mockUser.id, title: 'Salary', amount: 5000, type: 'income' },
            ];
            mockSupabase.from.mockReturnValue({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockReturnThis(),
                order: vitest_1.vi.fn().mockResolvedValue({ data: mockTransactions, error: null }),
            });
            const response = await (0, supertest_1.default)(app)
                .get('/transactions')
                .set('Authorization', `Bearer ${mockToken}`);
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body).toEqual(mockTransactions);
        });
        (0, vitest_1.it)('POST /transactions should create a transaction', async () => {
            const transactionData = {
                id: 'tx-1',
                user_id: mockUser.id,
                title: 'Groceries',
                amount: 150,
                type: 'expense',
                category: 'food',
            };
            mockSupabase.from.mockReturnValue({
                insert: vitest_1.vi.fn().mockReturnThis(),
                select: vitest_1.vi.fn().mockReturnThis(),
                single: vitest_1.vi.fn().mockResolvedValue({ data: transactionData, error: null }),
            });
            const response = await (0, supertest_1.default)(app)
                .post('/transactions')
                .set('Authorization', `Bearer ${mockToken}`)
                .send({
                title: 'Groceries',
                amount: 150,
                type: 'expense',
                category: 'food',
                date: '2025-01-15',
            });
            (0, vitest_1.expect)(response.status).toBe(201);
            (0, vitest_1.expect)(response.body.title).toBe('Groceries');
        });
        (0, vitest_1.it)('DELETE /transactions/:id should delete a transaction', async () => {
            mockSupabase.from.mockReturnValue({
                delete: vitest_1.vi.fn().mockReturnThis(),
                match: vitest_1.vi.fn().mockResolvedValue({ error: null }),
            });
            const response = await (0, supertest_1.default)(app)
                .delete('/transactions/tx-1')
                .set('Authorization', `Bearer ${mockToken}`);
            (0, vitest_1.expect)(response.status).toBe(204);
        });
    });
    // ─── INVESTMENT ENDPOINTS ───
    (0, vitest_1.describe)('Investment Endpoints', () => {
        (0, vitest_1.beforeEach)(() => {
            setupAuthenticatedUser();
            setupProfile();
        });
        (0, vitest_1.it)('GET /investments should return portfolio data', async () => {
            const mockInvestments = [
                {
                    id: '1',
                    user_id: mockUser.id,
                    asset_name: 'PETR4',
                    asset_class: 'stocks',
                    current_total: 3500,
                    total_invested: 3000,
                    daily_change_percent: 2.5,
                },
            ];
            mockSupabase.from.mockReturnValue({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockReturnThis(),
            }).mockResolvedValue({ data: mockInvestments, error: null });
            const response = await (0, supertest_1.default)(app)
                .get('/investments')
                .set('Authorization', `Bearer ${mockToken}`);
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body).toHaveProperty('portfolioValue');
        });
    });
    // ─── GOAL ENDPOINTS ───
    (0, vitest_1.describe)('Goal Endpoints', () => {
        (0, vitest_1.beforeEach)(() => {
            setupAuthenticatedUser();
            setupProfile();
        });
        (0, vitest_1.it)('GET /goals should return user goals', async () => {
            const mockGoals = [
                { id: '1', user_id: mockUser.id, title: 'House', target_amount: 100000 },
            ];
            mockSupabase.from.mockReturnValue({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockReturnThis(),
            }).mockResolvedValue({ data: mockGoals, error: null });
            const response = await (0, supertest_1.default)(app)
                .get('/goals')
                .set('Authorization', `Bearer ${mockToken}`);
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body).toEqual(mockGoals);
        });
        (0, vitest_1.it)('POST /goals should create a goal', async () => {
            const goalData = {
                id: 'goal-1',
                user_id: mockUser.id,
                title: 'Emergency Fund',
                target_amount: 30000,
                current_amount: 0,
            };
            mockSupabase.from.mockReturnValue({
                insert: vitest_1.vi.fn().mockReturnThis(),
                select: vitest_1.vi.fn().mockReturnThis(),
                single: vitest_1.vi.fn().mockResolvedValue({ data: goalData, error: null }),
            });
            const response = await (0, supertest_1.default)(app)
                .post('/goals')
                .set('Authorization', `Bearer ${mockToken}`)
                .send({
                title: 'Emergency Fund',
                targetAmount: 30000,
                currentAmount: 0,
            });
            (0, vitest_1.expect)(response.status).toBe(201);
        });
    });
    // ─── DASHBOARD ENDPOINT ───
    (0, vitest_1.describe)('Dashboard Endpoint', () => {
        (0, vitest_1.beforeEach)(() => {
            setupAuthenticatedUser();
            setupProfile();
        });
        (0, vitest_1.it)('GET /dashboard/consolidated should return dashboard data', async () => {
            mockSupabase.from.mockReturnValue({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockReturnThis(),
            }).mockResolvedValue({ data: [], error: null });
            const response = await (0, supertest_1.default)(app)
                .get('/dashboard/consolidated')
                .set('Authorization', `Bearer ${mockToken}`);
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body).toHaveProperty('summary');
            (0, vitest_1.expect)(response.body).toHaveProperty('charts');
            (0, vitest_1.expect)(response.body.summary).toHaveProperty('balance');
            (0, vitest_1.expect)(response.body.summary).toHaveProperty('income');
            (0, vitest_1.expect)(response.body.summary).toHaveProperty('expense');
        });
    });
    // ─── SYNC ENDPOINTS ───
    (0, vitest_1.describe)('Sync Endpoints', () => {
        (0, vitest_1.beforeEach)(() => {
            setupAuthenticatedUser();
            setupProfile();
        });
        (0, vitest_1.it)('POST /sync/push should process operations', async () => {
            mockSupabase.from.mockReturnValue({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockReturnThis(),
                single: vitest_1.vi.fn().mockResolvedValue({ data: { id: 'tx-1', updated_at: new Date().toISOString() }, error: null }),
                upsert: vitest_1.vi.fn().mockReturnThis(),
                delete: vitest_1.vi.fn().mockReturnThis(),
                match: vitest_1.vi.fn().mockResolvedValue({ error: null }),
            });
            const response = await (0, supertest_1.default)(app)
                .post('/sync/push')
                .set('Authorization', `Bearer ${mockToken}`)
                .send({
                operations: [
                    {
                        entity: 'transaction',
                        op: 'upsert',
                        client_id: 'client-tx-1',
                        payload: {
                            title: 'Synced Transaction',
                            amount: 100,
                            type: 'expense',
                            category: 'food',
                            date: '2025-01-15',
                        },
                    },
                ],
            });
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body).toHaveProperty('results');
            (0, vitest_1.expect)(response.body.results[0].status).toBe('applied');
        });
        (0, vitest_1.it)('GET /sync/pull should return changes', async () => {
            mockSupabase.from.mockReturnValue({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockReturnThis(),
                gt: vitest_1.vi.fn().mockReturnThis(),
            }).mockResolvedValue({ data: [], error: null });
            const response = await (0, supertest_1.default)(app)
                .get('/sync/pull?since=2025-01-01T00:00:00Z')
                .set('Authorization', `Bearer ${mockToken}`);
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body).toHaveProperty('server_time');
            (0, vitest_1.expect)(response.body).toHaveProperty('changes');
        });
        (0, vitest_1.it)('POST /sync/push should reject non-array operations', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/sync/push')
                .set('Authorization', `Bearer ${mockToken}`)
                .send({ operations: 'invalid' });
            (0, vitest_1.expect)(response.status).toBe(400);
        });
        (0, vitest_1.it)('POST /sync/push should handle delete operations', async () => {
            mockSupabase.from.mockReturnValue({
                delete: vitest_1.vi.fn().mockReturnThis(),
                match: vitest_1.vi.fn().mockResolvedValue({ error: null }),
                select: vitest_1.vi.fn().mockReturnThis(),
                single: vitest_1.vi.fn().mockResolvedValue({ data: null, error: null }),
                upsert: vitest_1.vi.fn().mockReturnThis(),
            });
            const response = await (0, supertest_1.default)(app)
                .post('/sync/push')
                .set('Authorization', `Bearer ${mockToken}`)
                .send({
                operations: [
                    {
                        entity: 'transaction',
                        op: 'delete',
                        client_id: 'tx-to-delete',
                    },
                ],
            });
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body.results[0].status).toBe('applied');
        });
    });
    // ─── CARD ENDPOINTS ───
    (0, vitest_1.describe)('Card Endpoints', () => {
        (0, vitest_1.beforeEach)(() => {
            setupAuthenticatedUser();
            setupProfile();
        });
        (0, vitest_1.it)('GET /cards should return user cards', async () => {
            const mockCards = [
                { id: '1', user_id: mockUser.id, name: 'Visa Platinum', type: 'credit' },
            ];
            mockSupabase.from.mockReturnValue({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockReturnThis(),
            }).mockResolvedValue({ data: mockCards, error: null });
            const response = await (0, supertest_1.default)(app)
                .get('/cards')
                .set('Authorization', `Bearer ${mockToken}`);
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body).toEqual(mockCards);
        });
    });
    // ─── SUBSCRIPTION ENDPOINTS ───
    (0, vitest_1.describe)('Subscription Endpoints', () => {
        (0, vitest_1.beforeEach)(() => {
            setupAuthenticatedUser();
            setupProfile();
        });
        (0, vitest_1.it)('GET /subscriptions should return subscriptions with totals', async () => {
            const mockSubs = [
                { id: '1', user_id: mockUser.id, name: 'Netflix', amount: 55.90, is_active: true, type: 'expense' },
            ];
            mockSupabase.from.mockReturnValue({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockReturnThis(),
            }).mockResolvedValue({ data: mockSubs, error: null });
            const response = await (0, supertest_1.default)(app)
                .get('/subscriptions')
                .set('Authorization', `Bearer ${mockToken}`);
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body).toHaveProperty('subscriptions');
            (0, vitest_1.expect)(response.body).toHaveProperty('totalMonthlyExpenses');
        });
    });
    // ─── ANALYTICS ENDPOINT ───
    (0, vitest_1.describe)('Analytics Endpoint', () => {
        (0, vitest_1.it)('POST /analytics/track should accept events', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/analytics/track')
                .send({
                name: 'page_view',
                parameters: { page: '/dashboard' },
                platform: 'web',
            });
            (0, vitest_1.expect)(response.status).toBe(202);
            (0, vitest_1.expect)(response.body).toEqual({ accepted: true });
        });
    });
    // ─── LICENSE CHECKING ───
    (0, vitest_1.describe)('License Checking', () => {
        (0, vitest_1.it)('should block access when license expired', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: { id: mockUser.id } },
                error: null,
            });
            mockSupabase.from.mockReturnValue({
                select: vitest_1.vi.fn().mockReturnThis(),
                eq: vitest_1.vi.fn().mockReturnThis(),
                single: vitest_1.vi.fn().mockResolvedValue({
                    data: {
                        subscription_status: 'active',
                        subscription_expires_at: new Date(Date.now() - 1000).toISOString(),
                        trial_started_at: new Date().toISOString(),
                    },
                    error: null,
                }),
                update: vitest_1.vi.fn().mockReturnThis(),
            });
            const response = await (0, supertest_1.default)(app)
                .get('/transactions')
                .set('Authorization', `Bearer ${mockToken}`);
            (0, vitest_1.expect)(response.status).toBe(402);
            (0, vitest_1.expect)(response.body.code).toBe('LICENSE_EXPIRED');
        });
    });
});
// Test requests use plain JSON; credential encryption is tested separately.
vitest_1.vi.mock('../../shared/middlewares/decryptAuthCredentials', () => ({ decryptAuthCredentials: (_req, _res, next) => next() }));
//# sourceMappingURL=api.test.js.map