/**
 * Base custom application error class.
 */
export class AppError extends Error {
  public readonly message: string;
  public readonly statusCode: number;
  public readonly code?: string;

  constructor(message: string, statusCode = 400, code?: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.message = message;
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

/** Erro de validação de dados de entrada (400) */
export class ValidationError extends AppError {
  constructor(message = 'Dados de entrada inválidos.', code = 'VALIDATION_ERROR') {
    super(message, 400, code);
  }
}

/** Erro de autenticação / token inválido ou ausente (401) */
export class UnauthorizedError extends AppError {
  constructor(message = 'Sessão inválida ou expirada. Faça login novamente.', code = 'UNAUTHORIZED') {
    super(message, 401, code);
  }
}

/** Erro de permissão insuficiente (403) */
export class ForbiddenError extends AppError {
  constructor(message = 'Você não possui permissão para realizar esta ação.', code = 'FORBIDDEN') {
    super(message, 403, code);
  }
}

/** Erro de recurso não encontrado (404) */
export class NotFoundError extends AppError {
  constructor(message = 'Recurso solicitado não foi encontrado.', code = 'NOT_FOUND') {
    super(message, 404, code);
  }
}

/** Erro de conflito/duplicação (409) */
export class ConflictError extends AppError {
  constructor(message = 'Conflito de dados. O recurso já existe.', code = 'CONFLICT') {
    super(message, 409, code);
  }
}

/** Erro de licenciamento / plano bloqueado (402/403) */
export class LicensingError extends AppError {
  constructor(message = 'Seu plano atual não permite o acesso a este recurso.', code = 'LICENSE_RESTRICTED') {
    super(message, 403, code);
  }
}

/** Erro interno inesperado do servidor (500) */
export class InternalServerError extends AppError {
  constructor(message = 'Ocorreu um erro interno no servidor. Tente novamente mais tarde.', code = 'INTERNAL_SERVER_ERROR') {
    super(message, 500, code);
  }
}
