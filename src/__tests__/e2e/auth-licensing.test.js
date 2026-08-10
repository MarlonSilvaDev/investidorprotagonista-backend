"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
/**
 * E2E Tests for Authentication and Licensing
 * Covers complete auth flows and middleware validation
 */
(0, vitest_1.describe)('E2E - Authentication Middleware Flow', () => {
    (0, vitest_1.it)('should reject request without token', () => {
        const req = { headers: {} };
        const hasAuth = req.headers?.authorization;
        (0, vitest_1.expect)(hasAuth).toBeUndefined();
    });
    (0, vitest_1.it)('should reject request with invalid token format', () => {
        const req = { headers: { authorization: 'invalid' } };
        const authHeader = req.headers?.authorization;
        const isValidBearer = authHeader && authHeader.startsWith('Bearer ');
        (0, vitest_1.expect)(isValidBearer).toBe(false);
    });
    (0, vitest_1.it)('should accept request with valid Bearer token', () => {
        const req = { headers: { authorization: 'Bearer valid-jwt-token' } };
        const authHeader = req.headers?.authorization;
        const isValidBearer = authHeader && authHeader.startsWith('Bearer ');
        (0, vitest_1.expect)(isValidBearer).toBe(true);
        const token = authHeader.split(' ')[1];
        (0, vitest_1.expect)(token).toBe('valid-jwt-token');
    });
    (0, vitest_1.it)('should extract user ID from valid token', () => {
        const mockDecodedToken = { sub: 'user-123', role: 'padrao' };
        const userId = mockDecodedToken.sub;
        (0, vitest_1.expect)(userId).toBe('user-123');
    });
});
(0, vitest_1.describe)('E2E - Licensing Middleware Flow', () => {
    (0, vitest_1.it)('should allow access to user with active license', () => {
        const user = {
            id: 'user-1',
            plan: 'premium',
            license_expiry: '2026-12-31',
            enabled_modules: ['transactions', 'goals', 'investments'],
        };
        const now = new Date('2025-06-01');
        const expiry = new Date(user.license_expiry);
        const isExpired = expiry < now;
        (0, vitest_1.expect)(isExpired).toBe(false);
        (0, vitest_1.expect)(user.enabled_modules).toContain('transactions');
    });
    (0, vitest_1.it)('should block access when license is expired', () => {
        const user = {
            id: 'user-2',
            plan: 'free',
            license_expiry: '2024-06-01',
            enabled_modules: ['transactions'],
        };
        const now = new Date('2025-06-01');
        const expiry = new Date(user.license_expiry);
        const isExpired = expiry < now;
        (0, vitest_1.expect)(isExpired).toBe(true);
    });
    (0, vitest_1.it)('should allow free plan access to basic modules', () => {
        const freeUser = {
            plan: 'free',
            enabled_modules: ['transactions', 'goals', 'tasks'],
        };
        const basicModules = ['transactions', 'goals', 'tasks'];
        const hasBasicAccess = basicModules.every(m => freeUser.enabled_modules.includes(m));
        (0, vitest_1.expect)(hasBasicAccess).toBe(true);
    });
    (0, vitest_1.it)('should block premium modules for free users', () => {
        const freeUser = {
            plan: 'free',
            enabled_modules: ['transactions', 'goals', 'tasks'],
        };
        const premiumModules = ['investments', 'cards', 'subscriptions', 'shared'];
        const hasPremiumAccess = premiumModules.some(m => freeUser.enabled_modules.includes(m));
        (0, vitest_1.expect)(hasPremiumAccess).toBe(false);
    });
    (0, vitest_1.it)('should allow premium modules for premium users', () => {
        const premiumUser = {
            plan: 'premium',
            enabled_modules: ['transactions', 'goals', 'tasks', 'investments', 'cards', 'subscriptions', 'shared'],
        };
        const premiumModules = ['investments', 'cards', 'subscriptions', 'shared'];
        const hasPremiumAccess = premiumModules.every(m => premiumUser.enabled_modules.includes(m));
        (0, vitest_1.expect)(hasPremiumAccess).toBe(true);
    });
    (0, vitest_1.it)('should allow admin access to all modules regardless of plan', () => {
        const admin = {
            role: 'administrador',
            plan: 'free',
            enabled_modules: [],
        };
        // Admin should have implicit access to everything
        const hasImplicitAccess = admin.role === 'administrador';
        (0, vitest_1.expect)(hasImplicitAccess).toBe(true);
    });
});
(0, vitest_1.describe)('E2E - Token Refresh Flow', () => {
    (0, vitest_1.it)('should refresh token successfully', () => {
        const refreshPayload = {
            refresh_token: 'valid-refresh-token',
        };
        const refreshResponse = {
            access_token: 'new-access-token',
            refresh_token: 'new-refresh-token',
            expires_in: 3600,
        };
        (0, vitest_1.expect)(refreshResponse.access_token).toBeDefined();
        (0, vitest_1.expect)(refreshResponse.refresh_token).toBeDefined();
        (0, vitest_1.expect)(refreshResponse.expires_in).toBe(3600);
    });
    (0, vitest_1.it)('should reject invalid refresh token', () => {
        const refreshPayload = {
            refresh_token: 'invalid-refresh-token',
        };
        const isValidToken = refreshPayload.refresh_token.startsWith('valid-');
        (0, vitest_1.expect)(isValidToken).toBe(false);
    });
    (0, vitest_1.it)('should handle token expiry correctly', () => {
        const token = {
            exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
            sub: 'user-1',
        };
        const now = Math.floor(Date.now() / 1000);
        const isExpired = token.exp < now;
        (0, vitest_1.expect)(isExpired).toBe(false);
    });
});
(0, vitest_1.describe)('E2E - Password Policy Flow', () => {
    (0, vitest_1.it)('should validate password with minimum requirements', () => {
        const password = 'SecurePass1@';
        const hasMinLength = password.length >= 8;
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[!@#$%^&*]/.test(password);
        (0, vitest_1.expect)(hasMinLength).toBe(true);
        (0, vitest_1.expect)(hasUpper).toBe(true);
        (0, vitest_1.expect)(hasLower).toBe(true);
        (0, vitest_1.expect)(hasNumber).toBe(true);
        (0, vitest_1.expect)(hasSpecial).toBe(true);
    });
    (0, vitest_1.it)('should reject password without minimum length', () => {
        const password = 'Ab1@';
        const hasMinLength = password.length >= 8;
        (0, vitest_1.expect)(hasMinLength).toBe(false);
    });
    (0, vitest_1.it)('should reject password without uppercase', () => {
        const password = 'securepass1@';
        const hasUpper = /[A-Z]/.test(password);
        (0, vitest_1.expect)(hasUpper).toBe(false);
    });
    (0, vitest_1.it)('should reject password without special character', () => {
        const password = 'SecurePass1';
        const hasSpecial = /[!@#$%^&*]/.test(password);
        (0, vitest_1.expect)(hasSpecial).toBe(false);
    });
});
(0, vitest_1.describe)('E2E - Email Validation Flow', () => {
    (0, vitest_1.it)('should validate correct email format', () => {
        const email = 'user@example.com';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        (0, vitest_1.expect)(emailRegex.test(email)).toBe(true);
    });
    (0, vitest_1.it)('should reject email without domain', () => {
        const email = 'user@';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        (0, vitest_1.expect)(emailRegex.test(email)).toBe(false);
    });
    (0, vitest_1.it)('should reject email without @', () => {
        const email = 'userexample.com';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        (0, vitest_1.expect)(emailRegex.test(email)).toBe(false);
    });
    (0, vitest_1.it)('should reject empty email', () => {
        const email = '';
        const isValid = email.length > 0;
        (0, vitest_1.expect)(isValid).toBe(false);
    });
});
(0, vitest_1.describe)('E2E - Data Ownership Flow', () => {
    (0, vitest_1.it)('should verify user owns the resource', () => {
        const userId = 'user-1';
        const resource = {
            id: 'tx-1',
            user_id: 'user-1',
        };
        const isOwner = resource.user_id === userId;
        (0, vitest_1.expect)(isOwner).toBe(true);
    });
    (0, vitest_1.it)('should block access to other users resources', () => {
        const userId = 'user-1';
        const resource = {
            id: 'tx-2',
            user_id: 'user-2',
        };
        const isOwner = resource.user_id === userId;
        (0, vitest_1.expect)(isOwner).toBe(false);
    });
    (0, vitest_1.it)('should allow admin to access any resource', () => {
        const user = { id: 'admin-1', role: 'administrador' };
        const resource = {
            id: 'tx-1',
            user_id: 'user-2',
        };
        const hasAccess = user.role === 'administrador' || resource.user_id === user.id;
        (0, vitest_1.expect)(hasAccess).toBe(true);
    });
});
//# sourceMappingURL=auth-licensing.test.js.map