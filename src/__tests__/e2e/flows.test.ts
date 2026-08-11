import { describe, it, expect, beforeEach, vi } from 'vitest';

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

vi.mock('../../core/utils/MailService', () => ({
  sendConfirmationEmail: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

import express from 'express';
import request from 'supertest';
import { AuthenticateController } from '../../infra/controllers/AuthenticateController';

const mockUser = {
  id: 'user-e2e-test',
  email: 'e2e@example.com',
};

const mockToken = 'mock-jwt-e2e';

function buildApp() {
  const app = express();
  app.use(express.json());
  const { routes } = require('../../infra/http/routes');
  app.use(routes);
  return app;
}

describe('End-to-End Flows', () => {
  let app: express.Express;
  let userId: string;
  let authToken: string;

  beforeEach(() => {
    vi.clearAllMocks();
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

    mockSupabase.from.mockImplementation((table: string) => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: validProfile, error: null }),
        single: vi.fn().mockResolvedValue({ data: validProfile, error: null }),
        update: vi.fn().mockReturnThis(),
        match: vi.fn().mockResolvedValue({ error: null }),
        insert: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
      };
      return chain;
    });
  });

  describe('Complete Auth Flow', () => {
    it('should register -> confirm email -> login -> access protected resources', async () => {
      // Step 1: Register
      mockSupabase.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: 'new-user', email: 'new@example.com', user_metadata: { name: 'New User' } } },
        error: null,
      });

      const registerRes = await request(app)
        .post('/auth/register')
        .send({ name: 'New User', email: 'new@example.com', password: 'SecurePass1@' });

      expect(registerRes.status).toBe(201);
      const newUserId = registerRes.body.id;

      // Step 2: Confirm email
      const { signAuthMailToken } = require('../../core/utils/AuthTokenService');
      const confirmToken = signAuthMailToken({
        sub: newUserId,
        email: 'new@example.com',
        type: 'email_confirm',
      });

      const confirmRes = await request(app)
        .get(`/auth/confirm-email?token=${confirmToken}`);

      expect(confirmRes.status).toBe(200);
      expect(confirmRes.text).toContain('Confirmado');

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
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: updatedProfile, error: null }),
        single: vi.fn().mockResolvedValue({ data: updatedProfile, error: null }),
        update: vi.fn().mockReturnThis(),
        match: vi.fn().mockResolvedValue({ error: null }),
        insert: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
      }));

      const loginRes = await request(app)
        .post('/auth/login')
        .send({ email: 'new@example.com', password: 'SecurePass1@' });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body).toHaveProperty('token');

      // Step 4: Access protected resource with new token
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: newUserId } },
        error: null,
      });

      const protectedRes = await request(app)
        .get('/transactions')
        .set('Authorization', `Bearer ${loginRes.body.token}`);

      expect([200, 402]).toContain(protectedRes.status); // 200 if licensed, 402 if not
    });

    it('should handle full password reset flow', async () => {
      const { signAuthMailToken } = require('../../core/utils/AuthTokenService');

      // Step 1: Forgot password
      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: userId, provider_type: 'email', name: 'Test' },
          error: null,
        }),
        single: vi.fn().mockResolvedValue({
          data: { id: userId, email_registrado: true, provider_type: 'email' },
          error: null,
        }),
        update: vi.fn().mockReturnThis(),
        match: vi.fn().mockResolvedValue({ error: null }),
        insert: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
      }));

      const forgotRes = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'e2e@example.com', locale: 'pt-BR' });

      expect(forgotRes.status).toBe(200);

      // Step 2: Generate reset token
      const resetToken = signAuthMailToken({
        sub: userId,
        email: 'e2e@example.com',
        type: 'password_reset',
      }, '1h');

      // Step 3: Access reset form
      const formRes = await request(app)
        .get(`/auth/reset-password?token=${resetToken}`);

      expect(formRes.status).toBe(200);
      expect(formRes.text).toContain('password');

      // Step 4: Reset password
      mockSupabase.auth.admin.updateUserById.mockResolvedValue({ error: null });

      const resetRes = await request(app)
        .post('/auth/reset-password')
        .send({
          token: resetToken,
          password: 'NewSecurePass1@',
          confirm: 'NewSecurePass1@',
        });

      expect(resetRes.status).toBe(200);
    });
  });

  describe('Complete CRUD Flow - Transactions', () => {
    let createdId: string;

    it('should create -> list -> delete a transaction', async () => {
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
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: transactionData, error: null }),
        insert: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        match: vi.fn().mockResolvedValue({ error: null }),
        order: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
      }));

      const createRes = await request(app)
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

      expect(createRes.status).toBe(201);
      createdId = createRes.body.id;

      // List
      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [transactionData], error: null }),
        single: vi.fn().mockResolvedValue({ data: transactionData, error: null }),
        insert: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        match: vi.fn().mockResolvedValue({ error: null }),
        upsert: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
      }));

      const listRes = await request(app)
        .get('/transactions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(listRes.status).toBe(200);
      expect(Array.isArray(listRes.body)).toBe(true);

      // Delete
      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: transactionData, error: null }),
        insert: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        match: vi.fn().mockResolvedValue({ error: null }),
        order: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
      }));

      const deleteRes = await request(app)
        .delete(`/transactions/${createdId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteRes.status).toBe(204);
    });
  });

  describe('Complete CRUD Flow - Goals', () => {
    it('should create -> list -> update a goal', async () => {
      const goalData = {
        id: 'goal-e2e-1',
        user_id: userId,
        title: 'E2E Goal',
        target_amount: 50000,
        current_amount: 0,
        deadline: '2025-12-31',
      };

      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: goalData, error: null }),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        match: vi.fn().mockResolvedValue({ data: { ...goalData, current_amount: 10000 }, error: null }),
        delete: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
      }));

      // Create
      const createRes = await request(app)
        .post('/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'E2E Goal',
          targetAmount: 50000,
          currentAmount: 0,
          deadline: '2025-12-31',
        });

      expect(createRes.status).toBe(201);

      // List
      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: goalData, error: null }),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        match: vi.fn().mockResolvedValue({ data: goalData, error: null }),
        delete: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
      }));

      const listRes = await request(app)
        .get('/goals')
        .set('Authorization', `Bearer ${authToken}`);

      expect(listRes.status).toBe(200);

      // Update
      const updatedGoal = { ...goalData, current_amount: 10000 };
      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedGoal, error: null }),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        match: vi.fn().mockResolvedValue({ data: updatedGoal, error: null }),
        delete: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
      }));

      const updateRes = await request(app)
        .put('/goals/goal-e2e-1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ currentAmount: 10000 });

      expect(updateRes.status).toBe(200);
    });
  });

  describe('Sync Flow - Push and Pull', () => {
    it('should push changes and pull server data', async () => {
      const serverTime = new Date().toISOString();

      // Push
      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'tx-sync-1', updated_at: serverTime },
          error: null,
        }),
        upsert: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        match: vi.fn().mockResolvedValue({ error: null }),
        insert: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
      }));

      const pushRes = await request(app)
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

      expect(pushRes.status).toBe(200);
      expect(pushRes.body.results.length).toBe(2);
      expect(pushRes.body.results.every((r: any) => r.status === 'applied')).toBe(true);

      // Pull
      mockSupabase.from.mockImplementation(() => {
        const resolved = { data: [], error: null };
        const chain: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gt: vi.fn().mockReturnThis(),
          then: (resolve: any) => Promise.resolve(resolved).then(resolve),
        };
        return chain;
      });

      const pullRes = await request(app)
        .get('/sync/pull?since=2025-01-01T00:00:00Z')
        .set('Authorization', `Bearer ${authToken}`);

      expect(pullRes.status).toBe(200);
      expect(pullRes.body).toHaveProperty('server_time');
      expect(pullRes.body).toHaveProperty('changes');
    });
  });

  describe('License Expiration Flow', () => {
    it('should block all protected endpoints when license expires', async () => {
      mockSupabase.from.mockImplementation(() => ({
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
        match: vi.fn().mockResolvedValue({ error: null }),
        insert: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
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
        const res = await request(app)
          .get(path)
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(402);
        expect(res.body.code).toBe('LICENSE_EXPIRED');
      }
    });
  });

  describe('Payment Flow', () => {
    it('should create checkout session and handle webhook', async () => {
      // Create checkout
      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { email: mockUser.email, stripe_customer_id: null },
          error: null,
        }),
        update: vi.fn().mockReturnThis(),
        match: vi.fn().mockResolvedValue({ error: null }),
        insert: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
      }));

      const checkoutRes = await request(app)
        .post('/payment/checkout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ priceId: 'price_test_123' });

      expect(checkoutRes.status).toBe(200);
      expect(checkoutRes.body).toHaveProperty('url');

      // Webhook
      const webhookRes = await request(app)
        .post('/payment/webhook')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 'valid-sig')
        .send(JSON.stringify({ type: 'checkout.session.completed' }));

      expect(webhookRes.status).toBe(200);
    });
  });
});
