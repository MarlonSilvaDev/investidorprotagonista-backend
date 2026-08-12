import { describe, it, expect } from 'vitest';
import {
  isValidCpf,
  isValidEmail,
  normalizeCpf,
  validateCpf,
  validatePassword,
} from '../../core/utils/AuthValidation';

describe('AuthValidation', () => {
  describe('isValidEmail', () => {
    it('should return true for valid email', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
    });

    it('should return true for valid email with subdomain', () => {
      expect(isValidEmail('user@mail.example.com')).toBe(true);
    });

    it('should return true for valid email with plus', () => {
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should return true for valid email with numbers', () => {
      expect(isValidEmail('user123@example.com')).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(isValidEmail('')).toBe(false);
    });

    it('should return false for missing @', () => {
      expect(isValidEmail('userexample.com')).toBe(false);
    });

    it('should return false for missing domain', () => {
      expect(isValidEmail('user@')).toBe(false);
    });

    it('should return false for missing local part', () => {
      expect(isValidEmail('@example.com')).toBe(false);
    });

    it('should return false for spaces', () => {
      expect(isValidEmail('user @example.com')).toBe(false);
    });

    it('should return false for special chars only', () => {
      expect(isValidEmail('@')).toBe(false);
    });

    it('should trim whitespace before validation', () => {
      expect(isValidEmail('  user@example.com  ')).toBe(true);
    });
  });

  describe('validatePassword', () => {
    it('should return null for valid password', () => {
      expect(validatePassword('Password1@')).toBeNull();
    });

    it('should return null for valid password with all special chars', () => {
      expect(validatePassword('MyPass#1')).toBeNull();
      expect(validatePassword('MyPass$1')).toBeNull();
      expect(validatePassword('MyPass*1')).toBeNull();
    });

    it('should return error for empty password', () => {
      expect(validatePassword('')).toBe('A senha deve ter no mínimo 8 caracteres');
    });

    it('should return error for short password', () => {
      expect(validatePassword('Ab1@')).toBe('A senha deve ter no mínimo 8 caracteres');
    });

    it('should return error for exactly 7 characters', () => {
      expect(validatePassword('Abc1@d')).toBe('A senha deve ter no mínimo 8 caracteres');
    });

    it('should return error for password without uppercase', () => {
      expect(validatePassword('password1@')).toBe(
        'A senha deve conter ao menos 1 letra maiúscula'
      );
    });

    it('should return error for password without number', () => {
      expect(validatePassword('Password@')).toBe(
        'A senha deve conter ao menos 1 número'
      );
    });

    it('should return error for password without special char', () => {
      expect(validatePassword('Password1')).toBe(
        'A senha deve conter ao menos 1 caractere especial (@, #, $ ou *)'
      );
    });

    it('should accept exactly 8 characters valid password', () => {
      expect(validatePassword('Abcd123@')).toBeNull();
    });

    it('should accept long valid password', () => {
      expect(validatePassword('VeryLongPassword123@#$')).toBeNull();
    });

    it('should return error for password with whitespace only', () => {
      expect(validatePassword('    ')).toBe('A senha deve ter no mínimo 8 caracteres');
    });
  });

  describe('normalizeCpf / isValidCpf / validateCpf', () => {
    it('should normalize masked CPF to digits', () => {
      expect(normalizeCpf('529.982.247-25')).toBe('52998224725');
    });

    it('should accept a valid CPF', () => {
      expect(isValidCpf('529.982.247-25')).toBe(true);
      expect(validateCpf('52998224725')).toBeNull();
    });

    it('should reject empty CPF', () => {
      expect(validateCpf('')).toBe('CPF é obrigatório');
    });

    it('should reject invalid check digits', () => {
      expect(isValidCpf('52998224726')).toBe(false);
      expect(validateCpf('52998224726')).toBe('CPF inválido');
    });

    it('should reject repeated sequences', () => {
      expect(isValidCpf('11111111111')).toBe(false);
    });
  });
});
