import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  signAuthMailToken,
  verifyAuthMailToken,
  AuthMailTokenPayload,
} from '../../core/utils/AuthTokenService';

// ─── AUTH TOKEN SERVICE ───

describe('AuthTokenService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv, JWT_SECRET: 'test-secret-key-123' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('signAuthMailToken', () => {
    it('should return a valid JWT string', () => {
      const payload: AuthMailTokenPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        type: 'email_confirm',
      };

      const token = signAuthMailToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should sign with email_confirm type', () => {
      const payload: AuthMailTokenPayload = {
        sub: 'user-456',
        email: 'confirm@test.com',
        type: 'email_confirm',
      };

      const token = signAuthMailToken(payload);
      const decoded = verifyAuthMailToken(token);

      expect(decoded.type).toBe('email_confirm');
      expect(decoded.sub).toBe('user-456');
      expect(decoded.email).toBe('confirm@test.com');
    });

    it('should sign with password_reset type', () => {
      const payload: AuthMailTokenPayload = {
        sub: 'user-789',
        email: 'reset@test.com',
        type: 'password_reset',
      };

      const token = signAuthMailToken(payload, '1h');
      const decoded = verifyAuthMailToken(token);

      expect(decoded.type).toBe('password_reset');
      expect(decoded.sub).toBe('user-789');
    });

    it('should use default expiration of 24h', () => {
      const payload: AuthMailTokenPayload = {
        sub: 'user-default',
        email: 'default@test.com',
        type: 'email_confirm',
      };

      const token = signAuthMailToken(payload);
      expect(token).toBeDefined();
    });

    it('should support custom expiration', () => {
      const payload: AuthMailTokenPayload = {
        sub: 'user-custom',
        email: 'custom@test.com',
        type: 'password_reset',
      };

      const token = signAuthMailToken(payload, '2h');
      const decoded = verifyAuthMailToken(token);
      expect(decoded).toBeDefined();
    });
  });

  describe('verifyAuthMailToken', () => {
    it('should decode a valid token correctly', () => {
      const payload: AuthMailTokenPayload = {
        sub: 'user-verify',
        email: 'verify@test.com',
        type: 'email_confirm',
      };

      const token = signAuthMailToken(payload);
      const decoded = verifyAuthMailToken(token);

      expect(decoded.sub).toBe('user-verify');
      expect(decoded.email).toBe('verify@test.com');
      expect(decoded.type).toBe('email_confirm');
    });

    it('should throw on invalid token', () => {
      expect(() => verifyAuthMailToken('invalid-token')).toThrow();
    });

    it('should throw on empty string', () => {
      expect(() => verifyAuthMailToken('')).toThrow();
    });

    it('should throw on tampered token', () => {
      const payload: AuthMailTokenPayload = {
        sub: 'user-tamper',
        email: 'tamper@test.com',
        type: 'email_confirm',
      };

      const token = signAuthMailToken(payload);
      const tampered = token + 'tampered';

      expect(() => verifyAuthMailToken(tampered)).toThrow();
    });

    it('should verify password_reset token', () => {
      const payload: AuthMailTokenPayload = {
        sub: 'user-reset',
        email: 'reset@test.com',
        type: 'password_reset',
      };

      const token = signAuthMailToken(payload, '1h');
      const decoded = verifyAuthMailToken(token);

      expect(decoded.type).toBe('password_reset');
      expect(decoded.sub).toBe('user-reset');
    });
  });

  describe('error handling', () => {
    it('should throw when JWT_SECRET is missing', () => {
      delete process.env.JWT_SECRET;
      vi.resetModules();

      expect(() =>
        signAuthMailToken({
          sub: 'user',
          email: 'test@test.com',
          type: 'email_confirm',
        })
      ).toThrow('JWT_SECRET não configurado');
    });
  });
});
