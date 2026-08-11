"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidEmail = isValidEmail;
exports.normalizeCpf = normalizeCpf;
exports.isValidCpf = isValidCpf;
exports.validateCpf = validateCpf;
exports.normalizeCnpj = normalizeCnpj;
exports.isValidCnpj = isValidCnpj;
exports.validateCnpj = validateCnpj;
exports.validateDocument = validateDocument;
exports.validatePassword = validatePassword;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Mín. 8, 1 maiúscula, 1 número e 1 especial entre @ # $ * */
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[@#$*]).{8,}$/;
function isValidEmail(email) {
    return EMAIL_REGEX.test(email.trim());
}
/** Normaliza CPF para 11 dígitos (identificador da conta). */
function normalizeCpf(cpf) {
    return String(cpf || '').replace(/\D/g, '');
}
/** Valida CPF brasileiro (dígitos verificadores + rejeita sequências). */
function isValidCpf(cpf) {
    const digits = normalizeCpf(cpf);
    if (digits.length !== 11)
        return false;
    if (/^(\d)\1{10}$/.test(digits))
        return false;
    const calcDigit = (base, factor) => {
        let sum = 0;
        for (let i = 0; i < base.length; i += 1) {
            sum += Number(base[i]) * (factor - i);
        }
        const mod = (sum * 10) % 11;
        return mod === 10 ? 0 : mod;
    };
    const d1 = calcDigit(digits.slice(0, 9), 10);
    const d2 = calcDigit(digits.slice(0, 10), 11);
    return d1 === Number(digits[9]) && d2 === Number(digits[10]);
}
function validateCpf(cpf) {
    const digits = normalizeCpf(cpf);
    if (!digits) {
        return 'CPF é obrigatório';
    }
    if (!isValidCpf(digits)) {
        return 'CPF inválido';
    }
    return null;
}
function normalizeCnpj(cnpj) {
    return String(cnpj || '').replace(/\D/g, '');
}
function isValidCnpj(cnpj) {
    const digits = normalizeCnpj(cnpj);
    if (digits.length !== 14)
        return false;
    if (/^(\d)\1{13}$/.test(digits))
        return false;
    const calcDigit = (base, weights) => {
        let sum = 0;
        for (let i = 0; i < base.length; i += 1) {
            sum += Number(base[i]) * (weights[i] ?? 0);
        }
        const mod = sum % 11;
        return mod < 2 ? 0 : 11 - mod;
    };
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const d1 = calcDigit(digits.slice(0, 12), weights1);
    const d2 = calcDigit(digits.slice(0, 13), weights2);
    return d1 === Number(digits[12]) && d2 === Number(digits[13]);
}
function validateCnpj(cnpj) {
    const digits = normalizeCnpj(cnpj);
    if (!digits) {
        return 'CNPJ é obrigatório';
    }
    if (!isValidCnpj(digits)) {
        return 'CNPJ inválido';
    }
    return null;
}
function validateDocument(country, userType, documentNumber) {
    const doc = String(documentNumber || '').trim();
    if (country === 'BR') {
        if (userType === 'empresa') {
            return validateCnpj(doc);
        }
        return validateCpf(doc);
    }
    if (!doc || doc.length < 3) {
        return 'Documento é obrigatório e deve ter no mínimo 3 caracteres';
    }
    return null;
}
function validatePassword(password) {
    if (!password || password.length < 8) {
        return 'A senha deve ter no mínimo 8 caracteres';
    }
    if (!/[A-Z]/.test(password)) {
        return 'A senha deve conter ao menos 1 letra maiúscula';
    }
    if (!/\d/.test(password)) {
        return 'A senha deve conter ao menos 1 número';
    }
    if (!/[@#$*]/.test(password)) {
        return 'A senha deve conter ao menos 1 caractere especial (@, #, $ ou *)';
    }
    if (!PASSWORD_REGEX.test(password)) {
        return 'Senha inválida';
    }
    return null;
}
//# sourceMappingURL=AuthValidation.js.map