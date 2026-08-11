"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const AuthValidation_1 = require("../../core/utils/AuthValidation");
(0, vitest_1.describe)('AuthValidation', () => {
    (0, vitest_1.describe)('isValidEmail', () => {
        (0, vitest_1.it)('should return true for valid email', () => {
            (0, vitest_1.expect)((0, AuthValidation_1.isValidEmail)('user@example.com')).toBe(true);
        });
        (0, vitest_1.it)('should return true for valid email with subdomain', () => {
            (0, vitest_1.expect)((0, AuthValidation_1.isValidEmail)('user@mail.example.com')).toBe(true);
        });
        (0, vitest_1.it)('should return true for valid email with plus', () => {
            (0, vitest_1.expect)((0, AuthValidation_1.isValidEmail)('user+tag@example.com')).toBe(true);
        });
        (0, vitest_1.it)('should return true for valid email with numbers', () => {
            (0, vitest_1.expect)((0, AuthValidation_1.isValidEmail)('user123@example.com')).toBe(true);
        });
        (0, vitest_1.it)('should return false for empty string', () => {
            (0, vitest_1.expect)((0, AuthValidation_1.isValidEmail)('')).toBe(false);
        });
        (0, vitest_1.it)('should return false for missing @', () => {
            (0, vitest_1.expect)((0, AuthValidation_1.isValidEmail)('userexample.com')).toBe(false);
        });
        (0, vitest_1.it)('should return false for missing domain', () => {
            (0, vitest_1.expect)((0, AuthValidation_1.isValidEmail)('user@')).toBe(false);
        });
        (0, vitest_1.it)('should return false for missing local part', () => {
            (0, vitest_1.expect)((0, AuthValidation_1.isValidEmail)('@example.com')).toBe(false);
        });
        (0, vitest_1.it)('should return false for spaces', () => {
            (0, vitest_1.expect)((0, AuthValidation_1.isValidEmail)('user @example.com')).toBe(false);
        });
        (0, vitest_1.it)('should return false for special chars only', () => {
            (0, vitest_1.expect)((0, AuthValidation_1.isValidEmail)('@')).toBe(false);
        });
        (0, vitest_1.it)('should trim whitespace before validation', () => {
            (0, vitest_1.expect)((0, AuthValidation_1.isValidEmail)('  user@example.com  ')).toBe(true);
        });
    });
    (0, vitest_1.describe)('validatePassword', () => {
        (0, vitest_1.it)('should return null for valid password', () => {
            (0, vitest_1.expect)((0, AuthValidation_1.validatePassword)('Password1@')).toBeNull();
        });
        (0, vitest_1.it)('should return null for valid password with all special chars', () => {
            (0, vitest_1.expect)((0, AuthValidation_1.validatePassword)('MyPass#1')).toBeNull();
            (0, vitest_1.expect)((0, AuthValidation_1.validatePassword)('MyPass$1')).toBeNull();
            (0, vitest_1.expect)((0, AuthValidation_1.validatePassword)('MyPass*1')).toBeNull();
        });
        (0, vitest_1.it)('should return error for empty password', () => {
            (0, vitest_1.expect)((0, AuthValidation_1.validatePassword)('')).toBe('A senha deve ter no mínimo 8 caracteres');
        });
        (0, vitest_1.it)('should return error for short password', () => {
            (0, vitest_1.expect)((0, AuthValidation_1.validatePassword)('Ab1@')).toBe('A senha deve ter no mínimo 8 caracteres');
        });
        (0, vitest_1.it)('should return error for exactly 7 characters', () => {
            (0, vitest_1.expect)((0, AuthValidation_1.validatePassword)('Abc1@d')).toBe('A senha deve ter no mínimo 8 caracteres');
        });
        (0, vitest_1.it)('should return error for password without uppercase', () => {
            (0, vitest_1.expect)((0, AuthValidation_1.validatePassword)('password1@')).toBe('A senha deve conter ao menos 1 letra maiúscula');
        });
        (0, vitest_1.it)('should return error for password without number', () => {
            (0, vitest_1.expect)((0, AuthValidation_1.validatePassword)('Password@')).toBe('A senha deve conter ao menos 1 número');
        });
        (0, vitest_1.it)('should return error for password without special char', () => {
            (0, vitest_1.expect)((0, AuthValidation_1.validatePassword)('Password1')).toBe('A senha deve conter ao menos 1 caractere especial (@, #, $ ou *)');
        });
        (0, vitest_1.it)('should accept exactly 8 characters valid password', () => {
            (0, vitest_1.expect)((0, AuthValidation_1.validatePassword)('Abcd123@')).toBeNull();
        });
        (0, vitest_1.it)('should accept long valid password', () => {
            (0, vitest_1.expect)((0, AuthValidation_1.validatePassword)('VeryLongPassword123@#$')).toBeNull();
        });
        (0, vitest_1.it)('should return error for password with whitespace only', () => {
            (0, vitest_1.expect)((0, AuthValidation_1.validatePassword)('        ')).toBe('A senha deve ter no mínimo 8 caracteres');
        });
    });
    (0, vitest_1.describe)('normalizeCpf / isValidCpf / validateCpf', () => {
        (0, vitest_1.it)('should normalize masked CPF to digits', () => {
            (0, vitest_1.expect)((0, AuthValidation_1.normalizeCpf)('529.982.247-25')).toBe('52998224725');
        });
        (0, vitest_1.it)('should accept a valid CPF', () => {
            (0, vitest_1.expect)((0, AuthValidation_1.isValidCpf)('529.982.247-25')).toBe(true);
            (0, vitest_1.expect)((0, AuthValidation_1.validateCpf)('52998224725')).toBeNull();
        });
        (0, vitest_1.it)('should reject empty CPF', () => {
            (0, vitest_1.expect)((0, AuthValidation_1.validateCpf)('')).toBe('CPF é obrigatório');
        });
        (0, vitest_1.it)('should reject invalid check digits', () => {
            (0, vitest_1.expect)((0, AuthValidation_1.isValidCpf)('52998224726')).toBe(false);
            (0, vitest_1.expect)((0, AuthValidation_1.validateCpf)('52998224726')).toBe('CPF inválido');
        });
        (0, vitest_1.it)('should reject repeated sequences', () => {
            (0, vitest_1.expect)((0, AuthValidation_1.isValidCpf)('11111111111')).toBe(false);
        });
    });
});
//# sourceMappingURL=authValidation.test.js.map