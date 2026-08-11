"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('Backend Routes Configuration', () => {
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
            '/shared/unlink',
            '/shared/list',
        ],
        admin: [
            '/admin/users',
            '/admin/users/:id',
        ],
    };
    (0, vitest_1.describe)('Auth routes', () => {
        (0, vitest_1.it)('should have login route', () => {
            (0, vitest_1.expect)(expectedRoutes.auth).toContain('/auth/login');
        });
        (0, vitest_1.it)('should have register route', () => {
            (0, vitest_1.expect)(expectedRoutes.auth).toContain('/auth/register');
        });
        (0, vitest_1.it)('should have forgot password route', () => {
            (0, vitest_1.expect)(expectedRoutes.auth).toContain('/auth/forgot-password');
        });
        (0, vitest_1.it)('should have change password route', () => {
            (0, vitest_1.expect)(expectedRoutes.auth).toContain('/auth/change-password');
        });
        (0, vitest_1.it)('should have google login route', () => {
            (0, vitest_1.expect)(expectedRoutes.auth).toContain('/auth/google');
        });
        (0, vitest_1.it)('should have refresh token route', () => {
            (0, vitest_1.expect)(expectedRoutes.auth).toContain('/auth/refresh');
        });
    });
    (0, vitest_1.describe)('Transaction routes', () => {
        (0, vitest_1.it)('should have list/create route', () => {
            (0, vitest_1.expect)(expectedRoutes.transactions).toContain('/transactions');
        });
        (0, vitest_1.it)('should have get/update/delete route', () => {
            (0, vitest_1.expect)(expectedRoutes.transactions).toContain('/transactions/:id');
        });
    });
    (0, vitest_1.describe)('Goal routes', () => {
        (0, vitest_1.it)('should have list/create route', () => {
            (0, vitest_1.expect)(expectedRoutes.goals).toContain('/goals');
        });
        (0, vitest_1.it)('should have get/update/delete route', () => {
            (0, vitest_1.expect)(expectedRoutes.goals).toContain('/goals/:id');
        });
    });
    (0, vitest_1.describe)('Task routes', () => {
        (0, vitest_1.it)('should have list/create route', () => {
            (0, vitest_1.expect)(expectedRoutes.tasks).toContain('/tasks');
        });
        (0, vitest_1.it)('should have get/update/delete route', () => {
            (0, vitest_1.expect)(expectedRoutes.tasks).toContain('/tasks/:id');
        });
    });
    (0, vitest_1.describe)('Card routes', () => {
        (0, vitest_1.it)('should have list/create route', () => {
            (0, vitest_1.expect)(expectedRoutes.cards).toContain('/cards');
        });
        (0, vitest_1.it)('should have get/update/delete route', () => {
            (0, vitest_1.expect)(expectedRoutes.cards).toContain('/cards/:id');
        });
    });
    (0, vitest_1.describe)('Subscription routes', () => {
        (0, vitest_1.it)('should have list/create route', () => {
            (0, vitest_1.expect)(expectedRoutes.subscriptions).toContain('/subscriptions');
        });
        (0, vitest_1.it)('should have get/update/delete route', () => {
            (0, vitest_1.expect)(expectedRoutes.subscriptions).toContain('/subscriptions/:id');
        });
    });
    (0, vitest_1.describe)('Investment routes', () => {
        (0, vitest_1.it)('should have list/create route', () => {
            (0, vitest_1.expect)(expectedRoutes.investments).toContain('/investments');
        });
        (0, vitest_1.it)('should have get/update/delete route', () => {
            (0, vitest_1.expect)(expectedRoutes.investments).toContain('/investments/:id');
        });
    });
    (0, vitest_1.describe)('Dashboard routes', () => {
        (0, vitest_1.it)('should have dashboard route', () => {
            (0, vitest_1.expect)(expectedRoutes.dashboard).toContain('/dashboard');
        });
    });
    (0, vitest_1.describe)('Sync routes', () => {
        (0, vitest_1.it)('should have push route', () => {
            (0, vitest_1.expect)(expectedRoutes.sync).toContain('/sync/push');
        });
        (0, vitest_1.it)('should have pull route', () => {
            (0, vitest_1.expect)(expectedRoutes.sync).toContain('/sync/pull');
        });
    });
    (0, vitest_1.describe)('Payment routes', () => {
        (0, vitest_1.it)('should have subscribe route', () => {
            (0, vitest_1.expect)(expectedRoutes.payment).toContain('/payment/subscribe');
        });
        (0, vitest_1.it)('should have webhook route', () => {
            (0, vitest_1.expect)(expectedRoutes.payment).toContain('/payment/webhook');
        });
    });
    (0, vitest_1.describe)('Shared account routes', () => {
        (0, vitest_1.it)('should have invite route', () => {
            (0, vitest_1.expect)(expectedRoutes.shared).toContain('/shared/invite');
        });
        (0, vitest_1.it)('should have accept route', () => {
            (0, vitest_1.expect)(expectedRoutes.shared).toContain('/shared/accept');
        });
        (0, vitest_1.it)('should have unlink route', () => {
            (0, vitest_1.expect)(expectedRoutes.shared).toContain('/shared/unlink');
        });
        (0, vitest_1.it)('should have list route', () => {
            (0, vitest_1.expect)(expectedRoutes.shared).toContain('/shared/list');
        });
    });
    (0, vitest_1.describe)('Admin routes', () => {
        (0, vitest_1.it)('should have users list route', () => {
            (0, vitest_1.expect)(expectedRoutes.admin).toContain('/admin/users');
        });
        (0, vitest_1.it)('should have user details route', () => {
            (0, vitest_1.expect)(expectedRoutes.admin).toContain('/admin/users/:id');
        });
    });
});
//# sourceMappingURL=routes.test.js.map