import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  count: number;
  resetTime: number;
}

const WINDOW_MS = 60 * 1000; // 1 minuto
const MAX_REQUESTS_PER_WINDOW = 120; // 120 requisições por minuto padrão

const requestsStore = new Map<string, RateLimitStore>();

// Limpeza periódica dos registros expirados
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestsStore.entries()) {
    if (now > record.resetTime) {
      requestsStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Middleware para limitar a taxa de requisições por IP/Usuário.
 * Retorna HTTP 429 Too Many Requests quando o limite é excedido.
 */
export function rateLimiter(
  maxRequests: number = MAX_REQUESTS_PER_WINDOW,
  windowMs: number = WINDOW_MS
) {
  return (request: Request, response: Response, next: NextFunction) => {
    const key = request.user?.id || request.ip || 'anonymous';
    const now = Date.now();

    let record = requestsStore.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      requestsStore.set(key, record);
      return next();
    }

    record.count += 1;

    if (record.count > maxRequests) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      response.setHeader?.('Retry-After', retryAfterSeconds.toString());
      return response.status(429).json({
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Muitas requisições em pouco tempo. Por favor, aguarde alguns instantes antes de tentar novamente.',
        retry_after_seconds: retryAfterSeconds,
      });
    }

    return next();
  };
}
