"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.otpVerifyLimiter = exports.otpSendLimiter = exports.authLimiter = exports.generalLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
/**
 * Limitador global para a API (proteção geral de infraestrutura).
 * Permite até 100 requisições por minuto por IP.
 */
exports.generalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: 'Muitas requisições originadas deste IP. Por favor, aguarde um minuto.',
    },
});
/**
 * Limitador de Autenticação (Login, Registro, Forgot Password, Google Auth).
 * Protege contra ataques de Força Bruta e Criação de Contas Falsas (Bots).
 * Permite no máximo 10 tentativas a cada 15 minutos por IP.
 */
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: 'Muitas tentativas de autenticação a partir deste IP. Por favor, aguarde 15 minutos e tente novamente.',
    },
});
/**
 * Limitador de Disparo de Código OTP (WhatsApp, SMS, Telegram).
 * Protege contra spam de mensagens e esgotamento de saldo de gateway (NotifyGW).
 * Permite no máximo 3 solicitações de código a cada 5 minutos por IP.
 */
exports.otpSendLimiter = (0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000, // 5 minutos
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: 'Muitas solicitações de código de verificação. Aguarde 5 minutos antes de solicitar um novo código.',
    },
});
/**
 * Limitador de Validação de Código OTP (Verify SMS / Código de 6 dígitos).
 * Protege contra ataques de adivinhação de código OTP (Brute-force OTP).
 * Permite no máximo 5 tentativas a cada 15 minutos por IP.
 */
exports.otpVerifyLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: 'Excesso de tentativas incorretas de código. Por favor, aguarde 15 minutos antes de tentar novamente.',
    },
});
//# sourceMappingURL=rateLimiters.js.map