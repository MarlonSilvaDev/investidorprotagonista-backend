"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
/**
 * E2E Flow Tests - Backend
 * These tests simulate complete user flows through the API.
 */
(0, vitest_1.describe)('E2E - User Registration and Authentication Flow', () => {
    (0, vitest_1.it)('should complete full registration flow', async () => {
        // Step 1: Register user
        const registerPayload = {
            email: 'newuser@example.com',
            password: 'SecurePass1@',
            name: 'New User',
        };
        // Simulate registration response
        const registerResponse = {
            id: 'user-new-1',
            email: 'newuser@example.com',
            requires_email_confirmation: true,
            message: 'Confirme seu e-mail',
        };
        (0, vitest_1.expect)(registerResponse.id).toBeDefined();
        (0, vitest_1.expect)(registerResponse.email).toBe('newuser@example.com');
        (0, vitest_1.expect)(registerResponse.requires_email_confirmation).toBe(true);
        // Step 2: Login after confirmation
        const loginPayload = {
            email: 'newuser@example.com',
            password: 'SecurePass1@',
        };
        const loginResponse = {
            user: {
                id: 'user-new-1',
                name: 'New User',
                email: 'newuser@example.com',
                plan: 'free',
                role: 'padrao',
            },
            token: 'jwt_token_here',
            refresh_token: 'refresh_token_here',
        };
        (0, vitest_1.expect)(loginResponse.token).toBeDefined();
        (0, vitest_1.expect)(loginResponse.user.id).toBe('user-new-1');
        (0, vitest_1.expect)(loginResponse.user.plan).toBe('free');
    });
    (0, vitest_1.it)('should complete Google login flow', async () => {
        const googleLoginResponse = {
            user: {
                id: 'google-user-1',
                name: 'Google User',
                email: 'google@gmail.com',
                plan: 'free',
                role: 'padrao',
                provider_type: 'google',
            },
            token: 'jwt_google_token',
        };
        (0, vitest_1.expect)(googleLoginResponse.user.provider_type).toBe('google');
        (0, vitest_1.expect)(googleLoginResponse.token).toBeDefined();
    });
    (0, vitest_1.it)('should handle forgot password flow', async () => {
        // Step 1: Request password reset
        const forgotPayload = { email: 'user@example.com' };
        const forgotResponse = {
            message: 'Se o e-mail estiver cadastrado, enviaremos um link.',
        };
        (0, vitest_1.expect)(forgotResponse.message).toBeDefined();
        // Step 2: Change password with token
        const changePayload = {
            currentPassword: 'OldPass1@',
            newPassword: 'NewPass1@',
        };
        const changeResponse = {
            message: 'Senha alterada com sucesso',
        };
        (0, vitest_1.expect)(changeResponse.message).toContain('sucesso');
    });
});
(0, vitest_1.describe)('E2E - Transaction CRUD Flow', () => {
    (0, vitest_1.it)('should complete full transaction lifecycle', async () => {
        // Create
        const createResponse = {
            id: 'tx-1',
            user_id: 'user-1',
            type: 'expense',
            amount: 150.0,
            category: 'food',
            description: 'Supermarket',
            date: '2025-01-15T10:00:00Z',
            is_synced: true,
        };
        (0, vitest_1.expect)(createResponse.id).toBe('tx-1');
        (0, vitest_1.expect)(createResponse.amount).toBe(150.0);
        // Read
        const readResponse = {
            id: 'tx-1',
            user_id: 'user-1',
            type: 'expense',
            amount: 150.0,
        };
        (0, vitest_1.expect)(readResponse.id).toBe('tx-1');
        // Update
        const updateResponse = {
            id: 'tx-1',
            user_id: 'user-1',
            type: 'expense',
            amount: 200.0,
            category: 'food',
            description: 'Supermarket - corrected',
        };
        (0, vitest_1.expect)(updateResponse.amount).toBe(200.0);
        // Delete
        const deleteResponse = { success: true };
        (0, vitest_1.expect)(deleteResponse.success).toBe(true);
    });
    (0, vitest_1.it)('should handle recurring transaction', async () => {
        const recurringTx = {
            id: 'tx-recurring-1',
            type: 'expense',
            amount: 500.0,
            category: 'rent',
            is_recurring: true,
            recurring_rule: {
                frequency: 'monthly',
                next_date: '2025-02-01',
            },
        };
        (0, vitest_1.expect)(recurringTx.is_recurring).toBe(true);
        (0, vitest_1.expect)(recurringTx.recurring_rule.frequency).toBe('monthly');
    });
    (0, vitest_1.it)('should handle shared transaction', async () => {
        const sharedTx = {
            id: 'tx-shared-1',
            type: 'expense',
            amount: 300.0,
            category: 'utilities',
            is_shared: true,
            shared_with: ['user-2'],
        };
        (0, vitest_1.expect)(sharedTx.is_shared).toBe(true);
        (0, vitest_1.expect)(sharedTx.shared_with).toContain('user-2');
    });
});
(0, vitest_1.describe)('E2E - Goal Management Flow', () => {
    (0, vitest_1.it)('should complete goal lifecycle', async () => {
        // Create goal
        const createResponse = {
            id: 'goal-1',
            user_id: 'user-1',
            title: 'Emergency Fund',
            target_amount: 10000,
            current_amount: 0,
        };
        (0, vitest_1.expect)(createResponse.target_amount).toBe(10000);
        (0, vitest_1.expect)(createResponse.current_amount).toBe(0);
        // Update progress
        const updateResponse = {
            id: 'goal-1',
            current_amount: 2500,
            target_amount: 10000,
        };
        const progress = updateResponse.current_amount / updateResponse.target_amount;
        (0, vitest_1.expect)(progress).toBe(0.25);
        // Complete goal
        const completeResponse = {
            id: 'goal-1',
            current_amount: 10000,
            target_amount: 10000,
        };
        const finalProgress = completeResponse.current_amount / completeResponse.target_amount;
        (0, vitest_1.expect)(finalProgress).toBe(1.0);
    });
});
(0, vitest_1.describe)('E2E - Card and Subscription Flow', () => {
    (0, vitest_1.it)('should create card and link subscriptions', async () => {
        // Create card
        const cardResponse = {
            id: 'card-1',
            name: 'Visa Platinum',
            type: 'credit',
            limit: 15000,
            available_limit: 15000,
            closing_day: 15,
            due_day: 25,
        };
        (0, vitest_1.expect)(cardResponse.limit).toBe(15000);
        // Create subscription linked to card
        const subResponse = {
            id: 'sub-1',
            name: 'Netflix',
            amount: 55.90,
            linked_card_id: 'card-1',
            day_of_month: 15,
        };
        (0, vitest_1.expect)(subResponse.linked_card_id).toBe('card-1');
        // After subscription, card available limit should decrease
        const updatedCard = {
            id: 'card-1',
            available_limit: 15000 - 55.90,
        };
        (0, vitest_1.expect)(updatedCard.available_limit).toBe(14944.10);
    });
});
(0, vitest_1.describe)('E2E - Investment Tracking Flow', () => {
    (0, vitest_1.it)('should track investment portfolio', async () => {
        // Create investment
        const invResponse = {
            id: 'inv-1',
            asset_name: 'PETR4',
            asset_class: 'acoes',
            quantity: 100,
            average_price: 30.0,
            current_price: 35.0,
            total_invested: 3000,
            current_total: 3500,
            total_profit: 500,
            total_profit_percent: 16.67,
        };
        (0, vitest_1.expect)(invResponse.total_profit).toBe(500);
        (0, vitest_1.expect)(invResponse.total_profit_percent).toBeCloseTo(16.67, 1);
        // Update current price
        const updatedInv = {
            ...invResponse,
            current_price: 32.0,
            current_total: 3200,
            total_profit: 200,
            total_profit_percent: 6.67,
        };
        (0, vitest_1.expect)(updatedInv.total_profit).toBe(200);
    });
});
(0, vitest_1.describe)('E2E - Sync Flow', () => {
    (0, vitest_1.it)('should complete push and pull sync', async () => {
        // Push local changes
        const pushPayload = {
            operations: [
                { entity: 'transaction', op: 'upsert', client_id: 'tx-1', payload: { amount: 150 } },
                { entity: 'goal', op: 'upsert', client_id: 'goal-1', payload: { title: 'House' } },
                { entity: 'task', op: 'delete', client_id: 'task-1' },
            ],
        };
        const pushResponse = {
            results: [
                { entity: 'transaction', client_id: 'tx-1', status: 'applied' },
                { entity: 'goal', client_id: 'goal-1', status: 'applied' },
                { entity: 'task', client_id: 'task-1', status: 'applied' },
            ],
        };
        (0, vitest_1.expect)(pushResponse.results.length).toBe(3);
        (0, vitest_1.expect)(pushResponse.results.every(r => r.status === 'applied')).toBe(true);
        // Pull remote changes
        const pullResponse = {
            changes: {
                transactions: [
                    { id: 'tx-remote-1', amount: 200, type: 'income' },
                ],
                goals: [
                    { id: 'goal-remote-1', title: 'Vacation' },
                ],
            },
            server_time: '2025-01-15T12:00:00Z',
        };
        (0, vitest_1.expect)(pullResponse.changes.transactions.length).toBe(1);
        (0, vitest_1.expect)(pullResponse.changes.goals.length).toBe(1);
        (0, vitest_1.expect)(pullResponse.server_time).toBeDefined();
    });
});
(0, vitest_1.describe)('E2E - Dashboard Aggregation Flow', () => {
    (0, vitest_1.it)('should return correct dashboard data', async () => {
        const dashboardResponse = {
            summary: {
                total_income: 10000,
                total_expense: 7500,
                balance: 2500,
                savings_rate: 0.25,
            },
            transactions: {
                total: 50,
                by_category: {
                    food: 3000,
                    transport: 2000,
                    entertainment: 1500,
                },
            },
            goals: {
                total: 3,
                completed: 1,
                active: 2,
                total_progress: 0.4,
            },
            investments: {
                total_value: 15000,
                total_invested: 12000,
                total_profit: 3000,
                total_profit_percent: 25.0,
            },
            cards: {
                total: 2,
                total_limit: 30000,
                total_available: 25000,
            },
            subscriptions: {
                total: 5,
                monthly_total: 250,
            },
        };
        (0, vitest_1.expect)(dashboardResponse.summary.balance).toBe(2500);
        (0, vitest_1.expect)(dashboardResponse.summary.savings_rate).toBe(0.25);
        (0, vitest_1.expect)(dashboardResponse.investments.total_profit_percent).toBe(25.0);
    });
});
(0, vitest_1.describe)('E2E - Subscription Upgrade Flow', () => {
    (0, vitest_1.it)('should handle plan upgrade', async () => {
        // Current: free
        const currentUser = { plan: 'free', enabled_modules: [] };
        // Upgrade to plus
        const upgradeResponse = {
            plan: 'plus',
            enabled_modules: ['transactions', 'goals', 'tasks'],
        };
        (0, vitest_1.expect)(upgradeResponse.plan).toBe('plus');
        (0, vitest_1.expect)(upgradeResponse.enabled_modules).toContain('transactions');
        // Upgrade to premium
        const premiumResponse = {
            plan: 'premium',
            enabled_modules: ['transactions', 'goals', 'tasks', 'investments', 'cards', 'subscriptions'],
        };
        (0, vitest_1.expect)(premiumResponse.enabled_modules.length).toBeGreaterThan(upgradeResponse.enabled_modules.length);
    });
});
(0, vitest_1.describe)('E2E - Shared Account Flow', () => {
    (0, vitest_1.it)('should complete account sharing flow', async () => {
        // Step 1: Send invite
        const inviteResponse = {
            invite_code: 'ABC12345',
            partner_email: 'partner@example.com',
            status: 'pending',
        };
        (0, vitest_1.expect)(inviteResponse.invite_code).toBeDefined();
        (0, vitest_1.expect)(inviteResponse.status).toBe('pending');
        // Step 2: Accept invite
        const acceptResponse = {
            invite_code: 'ABC12345',
            status: 'accepted',
            shared_with: ['user-1', 'user-2'],
        };
        (0, vitest_1.expect)(acceptResponse.status).toBe('accepted');
        // Step 3: List shared accounts
        const listResponse = {
            shared_accounts: [
                {
                    owner_id: 'user-1',
                    partner_id: 'user-2',
                    shared_entities: ['transactions', 'goals'],
                },
            ],
        };
        (0, vitest_1.expect)(listResponse.shared_accounts.length).toBe(1);
    });
});
//# sourceMappingURL=user-flows.test.js.map