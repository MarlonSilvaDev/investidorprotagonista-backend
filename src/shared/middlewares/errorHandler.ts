import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';

/**
 * Middleware global para captura e tratamento centralizado de erros no Backend.
 * Garante que NUNCA exceções não tratadas ou stacktraces sejam expostas ao cliente.
 */
export function errorHandler(
  err: Error,
  _request: Request,
  response: Response,
  _next: NextFunction
): Response {
  // Erros de domínio conhecidos
  if (err instanceof AppError) {
    return response.status(err.statusCode).json({
      success: false,
      status: 'error',
      message: err.message,
      code: err.code || 'APP_ERROR',
    });
  }

  // Erros de validação Zod
  if (err instanceof ZodError) {
    const formattedErrors = err.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join(' | ');

    return response.status(400).json({
      success: false,
      status: 'error',
      message: formattedErrors || 'Dados de entrada inválidos.',
      code: 'VALIDATION_ERROR',
      details: err.issues,
    });
  }

  // Log interno para rastreamento de erros não mapeados
  console.error('[UNHANDLED BACKEND ERROR]:', err);

  // Fallback seguro para o cliente
  return response.status(500).json({
    success: false,
    status: 'error',
    message: 'Ocorreu um erro interno no servidor. Tente novamente mais tarde.',
    code: 'INTERNAL_SERVER_ERROR',
  });
}
