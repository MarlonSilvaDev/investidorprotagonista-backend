import { Request, Response, NextFunction } from 'express';
/**
 * Middleware global para captura e tratamento centralizado de erros no Backend.
 * Garante que NUNCA exceções não tratadas ou stacktraces sejam expostas ao cliente.
 */
export declare function errorHandler(err: Error, _request: Request, response: Response, _next: NextFunction): Response;
//# sourceMappingURL=errorHandler.d.ts.map