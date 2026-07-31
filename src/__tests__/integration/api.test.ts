import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

// ─── MOCK SUPABASE ───
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
    signInWithPassword: vi.fn(),
    admin: {
      createUser: vi.fn(),
      updateUserById: vi.fn(),
      getUserById: vi.fn(),
    },
    signInWithIdToken: vi.fn(),
    refreshSession: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock('../../database/supabase', () => ({
  supabase: mockSupabase,
  supabaseAdmin: mockSupabase,
}));

// ─── MOCK SERVICES ───
vi.mock('../../core/utils/MailService', () => ({
  sendConfirmationEmail: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('stripe', () => {
  const StripeMock = vi.fn().mockImplementation(() => ({
    customers: {
      create: vi.fn().mockResolvedValue({ id: 'cus_mock123' }),
    },
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/mock' }),
      },
    },
    webhooks: {
      constructEvent: vi.fn().mockReturnValue({ type: 'checkout.session.completed', data: { object: { metadata: { userId: 'user-1' }, subscription: 'sub_mock', current_period_end: Math.floor(Date.now() / 1000) + 2592000 } } }),
    },
    subscriptions: {
      retrieve: vi.fn().mockResolvedValue({ current_period_end: Math.floor(Date.now() / 1000) + 2592000 }),
    },
  }));
  return { default: StripeMock };
});

// ─── BUILD EXPRESS APP ───
function buildApp() {
  const app = express();

  app.use(express.json());

  // Import routes - we'll use the same structure as the real app
  const { routes } = require('../../infra/http/routes');
  app.use(routes);

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

function setupProfile(status = 'active', expiresAt?: string) {
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
  };

  mockSupabase.from.mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: profile, error: null }),
    update: vi.fn().mockReturnThis(),
    match: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
  });

  return profile;
}

describe('Integration Tests - API Endpoints', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock';
    app = buildApp();
  });

  // ─── AUTH ENDPOINTS ───

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
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
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'New User',
          email: 'newuser@example.com',
          password: 'SecurePass1@',
          locale: 'pt-BR',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body.requires_email_confirmation).toBe(true);
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'Test',
          email: 'invalid-email',
          password: 'SecurePass1@',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('E-mail inválido');
    });

    it('should return 400 for missing name', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'SecurePass1@',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Nome é obrigatório');
    });

    it('should return 400 for weak password', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'Test',
          email: 'test@example.com',
          password: 'weak',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 if Supabase user creation fails', async () => {
      mockSupabase.auth.admin.createUser.mockResolvedValue({
        data: null,
        error: { message: 'User already exists' },
      });

      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'Test',
          email: 'existing@example.com',
          password: 'SecurePass1@',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'user-1', email: 'test@example.com' },
          session: { access_token: 'access-token-123', refresh_token: 'refresh-token-123' },
        },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'user-1',
            email: 'test@example.com',
            email_registrado: true,
            provider_type: 'email',
          },
          error: null,
        }),
      });

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'SecurePass1@',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });

    it('should return 403 if email not confirmed', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'user-1', email: 'test@example.com' },
          session: { access_token: 'token', refresh_token: 'refresh' },
        },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { email_registrado: false },
          error: null,
        }),
      });

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'SecurePass1@',
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Confirme seu e-mail');
    });

    it('should return 400 for invalid credentials', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid login credentials' },
      });

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPass1@',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Senha é obrigatória');
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('should return generic message when email not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'unknown@example.com', locale: 'pt-BR' });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Se o e-mail estiver cadastrado');
    });

    it('should detect Google account and return appropriate message', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'user-1', provider_type: 'google', name: 'Test' },
          error: null,
        }),
      });

      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'google@example.com', locale: 'pt-BR' });

      expect(response.status).toBe(200);
      expect(response.body.provider_type).toBe('google');
    });
  });

  describe('POST /auth/google', () => {
    it('should login with Google ID token', async () => {
      mockSupabase.auth.signInWithIdToken.mockResolvedValue({
        data: {
          user: { id: 'google-user-1', email: 'google@example.com' },
          session: { access_token: 'google-token', refresh_token: 'google-refresh' },
        },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'google-user-1', provider_type: 'google', email_registrado: true },
          error: null,
        }),
        update: vi.fn().mockReturnThis(),
      });

      const response = await request(app)
        .post('/auth/google')
        .send({ id_token: 'google-id-token', access_token: 'google-access-token' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.provider_type).toBe('google');
    });

    it('should return 400 when id_token is missing', async () => {
      const response = await request(app)
        .post('/auth/google')
        .send({ access_token: 'token' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('id_token is required');
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh session successfully', async () => {
      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: {
          session: { access_token: 'new-access-token', refresh_token: 'new-refresh-token' },
          user: { id: 'user-1', email: 'test@example.com' },
        },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'user-1', email_registrado: true, provider_type: 'email' },
          error: null,
        }),
      });

      const response = await request(app)
        .post('/auth/refresh')
        .send({ refresh_token: 'valid-refresh-token' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
    });

    it('should return 400 when refresh_token is missing', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
    });

    it('should return 401 when refresh token is invalid', async () => {
      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: null,
        error: { message: 'Invalid refresh token' },
      });

      const response = await request(app)
        .post('/auth/refresh')
        .send({ refresh_token: 'invalid-token' });

      expect(response.status).toBe(401);
    });
  });

  // ─── PROTECTED ENDPOINTS ───

  describe('Protected Routes - Auth Required', () => {
    it('should return 401 for protected route without token', async () => {
      const response = await request(app).get('/transactions');
      expect(response.status).toBe(401);
    });

    it('should return 401 for protected route with invalid token', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: null,
        error: { message: 'Invalid token' },
      });

      const response = await request(app)
        .get('/transactions')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });

  // ─── TRANSACTION ENDPOINTS ───

  describe('Transaction Endpoints', () => {
    beforeEach(() => {
      setupAuthenticatedUser();
      setupProfile();
    });

    it('GET /transactions should return user transactions', async () => {
      const mockTransactions = [
        { id: '1', user_id: mockUser.id, title: 'Salary', amount: 5000, type: 'income' },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockTransactions, error: null }),
      });

      const response = await request(app)
        .get('/transactions')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTransactions);
    });

    it('POST /transactions should create a transaction', async () => {
      const transactionData = {
        id: 'tx-1',
        user_id: mockUser.id,
        title: 'Groceries',
        amount: 150,
        type: 'expense',
        category: 'food',
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: transactionData, error: null }),
      });

      const response = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          title: 'Groceries',
          amount: 150,
          type: 'expense',
          category: 'food',
          date: '2025-01-15',
        });

      expect(response.status).toBe(201);
      expect(response.body.title).toBe('Groceries');
    });

    it('DELETE /transactions/:id should delete a transaction', async () => {
      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        match: vi.fn().mockResolvedValue({ error: null }),
      });

      const response = await request(app)
        .delete('/transactions/tx-1')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(204);
    });
  });

  // ─── INVESTMENT ENDPOINTS ───

  describe('Investment Endpoints', () => {
    beforeEach(() => {
      setupAuthenticatedUser();
      setupProfile();
    });

    it('GET /investments should return portfolio data', async () => {
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
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      }).mockResolvedValue({ data: mockInvestments, error: null });

      const response = await request(app)
        .get('/investments')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('portfolioValue');
    });
  });

  // ─── GOAL ENDPOINTS ───

  describe('Goal Endpoints', () => {
    beforeEach(() => {
      setupAuthenticatedUser();
      setupProfile();
    });

    it('GET /goals should return user goals', async () => {
      const mockGoals = [
        { id: '1', user_id: mockUser.id, title: 'House', target_amount: 100000 },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      }).mockResolvedValue({ data: mockGoals, error: null });

      const response = await request(app)
        .get('/goals')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockGoals);
    });

    it('POST /goals should create a goal', async () => {
      const goalData = {
        id: 'goal-1',
        user_id: mockUser.id,
        title: 'Emergency Fund',
        target_amount: 30000,
        current_amount: 0,
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: goalData, error: null }),
      });

      const response = await request(app)
        .post('/goals')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          title: 'Emergency Fund',
          targetAmount: 30000,
          currentAmount: 0,
        });

      expect(response.status).toBe(201);
    });
  });

  // ─── DASHBOARD ENDPOINT ───

  describe('Dashboard Endpoint', () => {
    beforeEach(() => {
      setupAuthenticatedUser();
      setupProfile();
    });

    it('GET /dashboard/consolidated should return dashboard data', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      }).mockResolvedValue({ data: [], error: null });

      const response = await request(app)
        .get('/dashboard/consolidated')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('charts');
      expect(response.body.summary).toHaveProperty('balance');
      expect(response.body.summary).toHaveProperty('income');
      expect(response.body.summary).toHaveProperty('expense');
    });
  });

  // ─── SYNC ENDPOINTS ───

  describe('Sync Endpoints', () => {
    beforeEach(() => {
      setupAuthenticatedUser();
      setupProfile();
    });

    it('POST /sync/push should process operations', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'tx-1', updated_at: new Date().toISOString() }, error: null }),
        upsert: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        match: vi.fn().mockResolvedValue({ error: null }),
      });

      const response = await request(app)
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

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('results');
      expect(response.body.results[0].status).toBe('applied');
    });

    it('GET /sync/pull should return changes', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
      }).mockResolvedValue({ data: [], error: null });

      const response = await request(app)
        .get('/sync/pull?since=2025-01-01T00:00:00Z')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('server_time');
      expect(response.body).toHaveProperty('changes');
    });

    it('POST /sync/push should reject non-array operations', async () => {
      const response = await request(app)
        .post('/sync/push')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ operations: 'invalid' });

      expect(response.status).toBe(400);
    });

    it('POST /sync/push should handle delete operations', async () => {
      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        match: vi.fn().mockResolvedValue({ error: null }),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        upsert: vi.fn().mockReturnThis(),
      });

      const response = await request(app)
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

      expect(response.status).toBe(200);
      expect(response.body.results[0].status).toBe('applied');
    });
  });

  // ─── CARD ENDPOINTS ───

  describe('Card Endpoints', () => {
    beforeEach(() => {
      setupAuthenticatedUser();
      setupProfile();
    });

    it('GET /cards should return user cards', async () => {
      const mockCards = [
        { id: '1', user_id: mockUser.id, name: 'Visa Platinum', type: 'credit' },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      }).mockResolvedValue({ data: mockCards, error: null });

      const response = await request(app)
        .get('/cards')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCards);
    });
  });

  // ─── SUBSCRIPTION ENDPOINTS ───

  describe('Subscription Endpoints', () => {
    beforeEach(() => {
      setupAuthenticatedUser();
      setupProfile();
    });

    it('GET /subscriptions should return subscriptions with totals', async () => {
      const mockSubs = [
        { id: '1', user_id: mockUser.id, name: 'Netflix', amount: 55.90, is_active: true, type: 'expense' },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      }).mockResolvedValue({ data: mockSubs, error: null });

      const response = await request(app)
        .get('/subscriptions')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('subscriptions');
      expect(response.body).toHaveProperty('totalMonthlyExpenses');
    });
  });

  // ─── ANALYTICS ENDPOINT ───

  describe('Analytics Endpoint', () => {
    it('POST /analytics/track should accept events', async () => {
      const response = await request(app)
        .post('/analytics/track')
        .send({
          name: 'page_view',
          parameters: { page: '/dashboard' },
          platform: 'web',
        });

      expect(response.status).toBe(202);
      expect(response.body).toEqual({ accepted: true });
    });
  });

  // ─── LICENSE CHECKING ───

  describe('License Checking', () => {
    it('should block access when license expired', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUser.id } },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            subscription_status: 'active',
            subscription_expires_at: new Date(Date.now() - 1000).toISOString(),
            trial_started_at: new Date().toISOString(),
          },
          error: null,
        }),
        update: vi.fn().mockReturnThis(),
      });

      const response = await request(app)
        .get('/transactions')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(402);
      expect(response.body.code).toBe('LICENSE_EXPIRED');
    });
  });
});
