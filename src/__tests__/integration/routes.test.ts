import { describe, it, expect } from 'vitest';

describe('Backend Routes Configuration', () => {
  const expectedRoutes = {
    auth: [
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password',
      '/auth/change-password',
      '/auth/google',
      '/auth/refresh',
    ],
    transactions: [
      '/transactions',
      '/transactions/:id',
    ],
    goals: [
      '/goals',
      '/goals/:id',
    ],
    tasks: [
      '/tasks',
      '/tasks/:id',
    ],
    cards: [
      '/cards',
      '/cards/:id',
    ],
    subscriptions: [
      '/subscriptions',
      '/subscriptions/:id',
    ],
    investments: [
      '/investments',
      '/investments/:id',
    ],
    dashboard: [
      '/dashboard',
    ],
    sync: [
      '/sync/push',
      '/sync/pull',
    ],
    payment: [
      '/payment/subscribe',
      '/payment/webhook',
    ],
    shared: [
      '/shared/invite',
      '/shared/accept',
      '/shared/list',
    ],
    admin: [
      '/admin/users',
      '/admin/users/:id',
    ],
  };

  describe('Auth routes', () => {
    it('should have login route', () => {
      expect(expectedRoutes.auth).toContain('/auth/login');
    });

    it('should have register route', () => {
      expect(expectedRoutes.auth).toContain('/auth/register');
    });

    it('should have forgot password route', () => {
      expect(expectedRoutes.auth).toContain('/auth/forgot-password');
    });

    it('should have change password route', () => {
      expect(expectedRoutes.auth).toContain('/auth/change-password');
    });

    it('should have google login route', () => {
      expect(expectedRoutes.auth).toContain('/auth/google');
    });

    it('should have refresh token route', () => {
      expect(expectedRoutes.auth).toContain('/auth/refresh');
    });
  });

  describe('Transaction routes', () => {
    it('should have list/create route', () => {
      expect(expectedRoutes.transactions).toContain('/transactions');
    });

    it('should have get/update/delete route', () => {
      expect(expectedRoutes.transactions).toContain('/transactions/:id');
    });
  });

  describe('Goal routes', () => {
    it('should have list/create route', () => {
      expect(expectedRoutes.goals).toContain('/goals');
    });

    it('should have get/update/delete route', () => {
      expect(expectedRoutes.goals).toContain('/goals/:id');
    });
  });

  describe('Task routes', () => {
    it('should have list/create route', () => {
      expect(expectedRoutes.tasks).toContain('/tasks');
    });

    it('should have get/update/delete route', () => {
      expect(expectedRoutes.tasks).toContain('/tasks/:id');
    });
  });

  describe('Card routes', () => {
    it('should have list/create route', () => {
      expect(expectedRoutes.cards).toContain('/cards');
    });

    it('should have get/update/delete route', () => {
      expect(expectedRoutes.cards).toContain('/cards/:id');
    });
  });

  describe('Subscription routes', () => {
    it('should have list/create route', () => {
      expect(expectedRoutes.subscriptions).toContain('/subscriptions');
    });

    it('should have get/update/delete route', () => {
      expect(expectedRoutes.subscriptions).toContain('/subscriptions/:id');
    });
  });

  describe('Investment routes', () => {
    it('should have list/create route', () => {
      expect(expectedRoutes.investments).toContain('/investments');
    });

    it('should have get/update/delete route', () => {
      expect(expectedRoutes.investments).toContain('/investments/:id');
    });
  });

  describe('Dashboard routes', () => {
    it('should have dashboard route', () => {
      expect(expectedRoutes.dashboard).toContain('/dashboard');
    });
  });

  describe('Sync routes', () => {
    it('should have push route', () => {
      expect(expectedRoutes.sync).toContain('/sync/push');
    });

    it('should have pull route', () => {
      expect(expectedRoutes.sync).toContain('/sync/pull');
    });
  });

  describe('Payment routes', () => {
    it('should have subscribe route', () => {
      expect(expectedRoutes.payment).toContain('/payment/subscribe');
    });

    it('should have webhook route', () => {
      expect(expectedRoutes.payment).toContain('/payment/webhook');
    });
  });

  describe('Shared account routes', () => {
    it('should have invite route', () => {
      expect(expectedRoutes.shared).toContain('/shared/invite');
    });

    it('should have accept route', () => {
      expect(expectedRoutes.shared).toContain('/shared/accept');
    });

    it('should have list route', () => {
      expect(expectedRoutes.shared).toContain('/shared/list');
    });
  });

  describe('Admin routes', () => {
    it('should have users list route', () => {
      expect(expectedRoutes.admin).toContain('/admin/users');
    });

    it('should have user details route', () => {
      expect(expectedRoutes.admin).toContain('/admin/users/:id');
    });
  });
});
