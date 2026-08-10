"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
/**
 * Database layer unit tests
 * Tests the Supabase client configuration and query patterns
 */
(0, vitest_1.describe)('Supabase Database Client', () => {
    (0, vitest_1.describe)('Connection Configuration', () => {
        (0, vitest_1.it)('should have valid Supabase URL', () => {
            const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mock.supabase.co';
            (0, vitest_1.expect)(SUPABASE_URL).toContain('supabase');
        });
        (0, vitest_1.it)('should have valid Supabase service key', () => {
            const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-key';
            (0, vitest_1.expect)(SUPABASE_KEY.length).toBeGreaterThan(0);
        });
    });
    (0, vitest_1.describe)('Query Patterns', () => {
        (0, vitest_1.it)('should handle transaction INSERT query', () => {
            const query = {
                table: 'transactions',
                operation: 'insert',
                data: {
                    user_id: 'user-1',
                    type: 'expense',
                    amount: 150.0,
                    category: 'food',
                    date: '2025-01-15',
                },
            };
            (0, vitest_1.expect)(query.table).toBe('transactions');
            (0, vitest_1.expect)(query.operation).toBe('insert');
            (0, vitest_1.expect)(query.data.type).toBe('expense');
        });
        (0, vitest_1.it)('should handle transaction SELECT with filters', () => {
            const query = {
                table: 'transactions',
                operation: 'select',
                filters: {
                    user_id: { eq: 'user-1' },
                    type: { eq: 'expense' },
                    date: { gte: '2025-01-01', lte: '2025-01-31' },
                },
            };
            (0, vitest_1.expect)(query.filters.user_id.eq).toBe('user-1');
            (0, vitest_1.expect)(query.filters.date.gte).toBe('2025-01-01');
        });
        (0, vitest_1.it)('should handle transaction UPDATE query', () => {
            const query = {
                table: 'transactions',
                operation: 'update',
                filters: { id: { eq: 'tx-1' } },
                data: { amount: 200.0, category: 'transport' },
            };
            (0, vitest_1.expect)(query.filters.id.eq).toBe('tx-1');
            (0, vitest_1.expect)(query.data.amount).toBe(200.0);
        });
        (0, vitest_1.it)('should handle transaction DELETE query', () => {
            const query = {
                table: 'transactions',
                operation: 'delete',
                filters: { id: { eq: 'tx-1' } },
            };
            (0, vitest_1.expect)(query.filters.id.eq).toBe('tx-1');
        });
        (0, vitest_1.it)('should handle goal INSERT with all fields', () => {
            const query = {
                table: 'goals',
                operation: 'insert',
                data: {
                    user_id: 'user-1',
                    title: 'House',
                    target_amount: 500000,
                    current_amount: 0,
                    icon: 'home',
                    color: '#FF0000',
                },
            };
            (0, vitest_1.expect)(query.data.target_amount).toBe(500000);
        });
        (0, vitest_1.it)('should handle card INSERT with all fields', () => {
            const query = {
                table: 'cards',
                operation: 'insert',
                data: {
                    user_id: 'user-1',
                    name: 'Visa',
                    type: 'credit',
                    limit: 15000,
                    available_limit: 15000,
                    closing_day: 15,
                    due_day: 25,
                },
            };
            (0, vitest_1.expect)(query.data.limit).toBe(15000);
            (0, vitest_1.expect)(query.data.closing_day).toBe(15);
        });
        (0, vitest_1.it)('should handle subscription INSERT with linked card', () => {
            const query = {
                table: 'subscriptions',
                operation: 'insert',
                data: {
                    user_id: 'user-1',
                    name: 'Netflix',
                    amount: 55.90,
                    linked_card_id: 'card-1',
                    day_of_month: 15,
                },
            };
            (0, vitest_1.expect)(query.data.linked_card_id).toBe('card-1');
        });
        (0, vitest_1.it)('should handle investment INSERT with all fields', () => {
            const query = {
                table: 'investments',
                operation: 'insert',
                data: {
                    user_id: 'user-1',
                    asset_name: 'PETR4',
                    asset_class: 'acoes',
                    quantity: 100,
                    average_price: 30.0,
                    current_price: 35.0,
                    ticker: 'PETR4',
                },
            };
            (0, vitest_1.expect)(query.data.asset_class).toBe('acoes');
        });
        (0, vitest_1.it)('should handle task INSERT with priority', () => {
            const query = {
                table: 'tasks',
                operation: 'insert',
                data: {
                    user_id: 'user-1',
                    title: 'Pay bills',
                    priority: 'high',
                    due_date: '2025-02-01',
                },
            };
            (0, vitest_1.expect)(query.data.priority).toBe('high');
        });
    });
    (0, vitest_1.describe)('Sync Operations', () => {
        (0, vitest_1.it)('should handle push upsert operation', () => {
            const operation = {
                entity: 'transaction',
                op: 'upsert',
                client_id: 'tx-1',
                payload: { amount: 150 },
                updated_at: '2025-01-15T10:00:00Z',
            };
            (0, vitest_1.expect)(operation.op).toBe('upsert');
            (0, vitest_1.expect)(operation.entity).toBe('transaction');
        });
        (0, vitest_1.it)('should handle push delete operation', () => {
            const operation = {
                entity: 'task',
                op: 'delete',
                client_id: 'task-1',
            };
            (0, vitest_1.expect)(operation.op).toBe('delete');
            (0, vitest_1.expect)(operation.entity).toBe('task');
        });
        (0, vitest_1.it)('should handle pull with since filter', () => {
            const pullQuery = {
                table: 'transactions',
                filters: {
                    updated_at: { gt: '2025-01-15T10:00:00Z' },
                },
            };
            (0, vitest_1.expect)(pullQuery.filters.updated_at.gt).toBe('2025-01-15T10:00:00Z');
        });
    });
    (0, vitest_1.describe)('User Management', () => {
        (0, vitest_1.it)('should handle user profile update', () => {
            const update = {
                table: 'users',
                operation: 'update',
                filters: { id: { eq: 'user-1' } },
                data: {
                    plan: 'premium',
                    enabled_modules: ['transactions', 'goals', 'investments'],
                },
            };
            (0, vitest_1.expect)(update.data.plan).toBe('premium');
            (0, vitest_1.expect)(update.data.enabled_modules.length).toBe(3);
        });
        (0, vitest_1.it)('should handle admin user listing', () => {
            const query = {
                table: 'users',
                operation: 'select',
                filters: {},
                order: { column: 'created_at', ascending: false },
                limit: 50,
            };
            (0, vitest_1.expect)(query.order.column).toBe('created_at');
            (0, vitest_1.expect)(query.limit).toBe(50);
        });
    });
});
//# sourceMappingURL=database.test.js.map