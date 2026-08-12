import rateLimit from 'express-rate-limit';

/**
 * Limitador global para a API (proteção geral de infraestrutura).
 * Permite até 100 requisições por minuto por IP.
 */
export const generalLimiter = rateLimit({
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
export const authLimiter = rateLimit({
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
export const otpSendLimiter = rateLimit({
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
export const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Excesso de tentativas incorretas de código. Por favor, aguarde 15 minutos antes de tentar novamente.',
  },
});
