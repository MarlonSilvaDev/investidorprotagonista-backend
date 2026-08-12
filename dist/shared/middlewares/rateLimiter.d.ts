import { Request, Response, NextFunction } from 'express';
/**
 * Middleware para limitar a taxa de requisições por IP/Usuário.
 * Retorna HTTP 429 Too Many Requests quando o limite é excedido.
 */
export declare function rateLimiter(maxRequests?: number, windowMs?: number): (request: Request, response: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
//# sourceMappingURL=rateLimiter.d.ts.map