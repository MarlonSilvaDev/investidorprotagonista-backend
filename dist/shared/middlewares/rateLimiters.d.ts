/**
 * Limitador global para a API (proteção geral de infraestrutura).
 * Permite até 100 requisições por minuto por IP.
 */
export declare const generalLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Limitador de Autenticação (Login, Registro, Forgot Password, Google Auth).
 * Protege contra ataques de Força Bruta e Criação de Contas Falsas (Bots).
 * Permite no máximo 10 tentativas a cada 15 minutos por IP.
 */
export declare const authLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Limitador de Disparo de Código OTP (WhatsApp, SMS, Telegram).
 * Protege contra spam de mensagens e esgotamento de saldo de gateway (NotifyGW).
 * Permite no máximo 3 solicitações de código a cada 5 minutos por IP.
 */
export declare const otpSendLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Limitador de Validação de Código OTP (Verify SMS / Código de 6 dígitos).
 * Protege contra ataques de adivinhação de código OTP (Brute-force OTP).
 * Permite no máximo 5 tentativas a cada 15 minutos por IP.
 */
export declare const otpVerifyLimiter: import("express-rate-limit").RateLimitRequestHandler;
//# sourceMappingURL=rateLimiters.d.ts.map