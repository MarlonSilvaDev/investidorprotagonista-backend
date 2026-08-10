"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const AuthTokenService_1 = require("../../core/utils/AuthTokenService");
// ─── AUTH TOKEN SERVICE ───
(0, vitest_1.describe)('AuthTokenService', () => {
    const originalEnv = process.env;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.resetModules();
        process.env = { ...originalEnv, JWT_SECRET: 'test-secret-key-123' };
    });
    (0, vitest_1.afterEach)(() => {
        process.env = originalEnv;
    });
    (0, vitest_1.describe)('signAuthMailToken', () => {
        (0, vitest_1.it)('should return a valid JWT string', () => {
            const payload = {
                sub: 'user-123',
                email: 'test@example.com',
                type: 'email_confirm',
            };
            const token = (0, AuthTokenService_1.signAuthMailToken)(payload);
            (0, vitest_1.expect)(token).toBeDefined();
            (0, vitest_1.expect)(typeof token).toBe('string');
            (0, vitest_1.expect)(token.split('.')).toHaveLength(3); // JWT has 3 parts
        });
        (0, vitest_1.it)('should sign with email_confirm type', () => {
            const payload = {
                sub: 'user-456',
                email: 'confirm@test.com',
                type: 'email_confirm',
            };
            const token = (0, AuthTokenService_1.signAuthMailToken)(payload);
            const decoded = (0, AuthTokenService_1.verifyAuthMailToken)(token);
            (0, vitest_1.expect)(decoded.type).toBe('email_confirm');
            (0, vitest_1.expect)(decoded.sub).toBe('user-456');
            (0, vitest_1.expect)(decoded.email).toBe('confirm@test.com');
        });
        (0, vitest_1.it)('should sign with password_reset type', () => {
            const payload = {
                sub: 'user-789',
                email: 'reset@test.com',
                type: 'password_reset',
            };
            const token = (0, AuthTokenService_1.signAuthMailToken)(payload, '1h');
            const decoded = (0, AuthTokenService_1.verifyAuthMailToken)(token);
            (0, vitest_1.expect)(decoded.type).toBe('password_reset');
            (0, vitest_1.expect)(decoded.sub).toBe('user-789');
        });
        (0, vitest_1.it)('should use default expiration of 24h', () => {
            const payload = {
                sub: 'user-default',
                email: 'default@test.com',
                type: 'email_confirm',
            };
            const token = (0, AuthTokenService_1.signAuthMailToken)(payload);
            (0, vitest_1.expect)(token).toBeDefined();
        });
        (0, vitest_1.it)('should support custom expiration', () => {
            const payload = {
                sub: 'user-custom',
                email: 'custom@test.com',
                type: 'password_reset',
            };
            const token = (0, AuthTokenService_1.signAuthMailToken)(payload, '2h');
            const decoded = (0, AuthTokenService_1.verifyAuthMailToken)(token);
            (0, vitest_1.expect)(decoded).toBeDefined();
        });
    });
    (0, vitest_1.describe)('verifyAuthMailToken', () => {
        (0, vitest_1.it)('should decode a valid token correctly', () => {
            const payload = {
                sub: 'user-verify',
                email: 'verify@test.com',
                type: 'email_confirm',
            };
            const token = (0, AuthTokenService_1.signAuthMailToken)(payload);
            const decoded = (0, AuthTokenService_1.verifyAuthMailToken)(token);
            (0, vitest_1.expect)(decoded.sub).toBe('user-verify');
            (0, vitest_1.expect)(decoded.email).toBe('verify@test.com');
            (0, vitest_1.expect)(decoded.type).toBe('email_confirm');
        });
        (0, vitest_1.it)('should throw on invalid token', () => {
            (0, vitest_1.expect)(() => (0, AuthTokenService_1.verifyAuthMailToken)('invalid-token')).toThrow();
        });
        (0, vitest_1.it)('should throw on empty string', () => {
            (0, vitest_1.expect)(() => (0, AuthTokenService_1.verifyAuthMailToken)('')).toThrow();
        });
        (0, vitest_1.it)('should throw on tampered token', () => {
            const payload = {
                sub: 'user-tamper',
                email: 'tamper@test.com',
                type: 'email_confirm',
            };
            const token = (0, AuthTokenService_1.signAuthMailToken)(payload);
            const tampered = token + 'tampered';
            (0, vitest_1.expect)(() => (0, AuthTokenService_1.verifyAuthMailToken)(tampered)).toThrow();
        });
        (0, vitest_1.it)('should verify password_reset token', () => {
            const payload = {
                sub: 'user-reset',
                email: 'reset@test.com',
                type: 'password_reset',
            };
            const token = (0, AuthTokenService_1.signAuthMailToken)(payload, '1h');
            const decoded = (0, AuthTokenService_1.verifyAuthMailToken)(token);
            (0, vitest_1.expect)(decoded.type).toBe('password_reset');
            (0, vitest_1.expect)(decoded.sub).toBe('user-reset');
        });
    });
    (0, vitest_1.describe)('error handling', () => {
        (0, vitest_1.it)('should throw when JWT_SECRET is missing', () => {
            delete process.env.JWT_SECRET;
            vitest_1.vi.resetModules();
            (0, vitest_1.expect)(() => (0, AuthTokenService_1.signAuthMailToken)({
                sub: 'user',
                email: 'test@test.com',
                type: 'email_confirm',
            })).toThrow('JWT_SECRET não configurado');
        });
    });
});
//# sourceMappingURL=authTokenService.test.js.map