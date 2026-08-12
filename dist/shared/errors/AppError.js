"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalServerError = exports.LicensingError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.ValidationError = exports.AppError = void 0;
/**
 * Base custom application error class.
 */
class AppError extends Error {
    message;
    statusCode;
    code;
    constructor(message, statusCode = 400, code) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.message = message;
        this.statusCode = statusCode;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
/** Erro de validação de dados de entrada (400) */
class ValidationError extends AppError {
    constructor(message = 'Dados de entrada inválidos.', code = 'VALIDATION_ERROR') {
        super(message, 400, code);
    }
}
exports.ValidationError = ValidationError;
/** Erro de autenticação / token inválido ou ausente (401) */
class UnauthorizedError extends AppError {
    constructor(message = 'Sessão inválida ou expirada. Faça login novamente.', code = 'UNAUTHORIZED') {
        super(message, 401, code);
    }
}
exports.UnauthorizedError = UnauthorizedError;
/** Erro de permissão insuficiente (403) */
class ForbiddenError extends AppError {
    constructor(message = 'Você não possui permissão para realizar esta ação.', code = 'FORBIDDEN') {
        super(message, 403, code);
    }
}
exports.ForbiddenError = ForbiddenError;
/** Erro de recurso não encontrado (404) */
class NotFoundError extends AppError {
    constructor(message = 'Recurso solicitado não foi encontrado.', code = 'NOT_FOUND') {
        super(message, 404, code);
    }
}
exports.NotFoundError = NotFoundError;
/** Erro de conflito/duplicação (409) */
class ConflictError extends AppError {
    constructor(message = 'Conflito de dados. O recurso já existe.', code = 'CONFLICT') {
        super(message, 409, code);
    }
}
exports.ConflictError = ConflictError;
/** Erro de licenciamento / plano bloqueado (402/403) */
class LicensingError extends AppError {
    constructor(message = 'Seu plano atual não permite o acesso a este recurso.', code = 'LICENSE_RESTRICTED') {
        super(message, 403, code);
    }
}
exports.LicensingError = LicensingError;
/** Erro interno inesperado do servidor (500) */
class InternalServerError extends AppError {
    constructor(message = 'Ocorreu um erro interno no servidor. Tente novamente mais tarde.', code = 'INTERNAL_SERVER_ERROR') {
        super(message, 500, code);
    }
}
exports.InternalServerError = InternalServerError;
//# sourceMappingURL=AppError.js.map