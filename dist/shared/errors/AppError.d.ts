/**
 * Base custom application error class.
 */
export declare class AppError extends Error {
    readonly message: string;
    readonly statusCode: number;
    readonly code?: string;
    constructor(message: string, statusCode?: number, code?: string);
}
/** Erro de validação de dados de entrada (400) */
export declare class ValidationError extends AppError {
    constructor(message?: string, code?: string);
}
/** Erro de autenticação / token inválido ou ausente (401) */
export declare class UnauthorizedError extends AppError {
    constructor(message?: string, code?: string);
}
/** Erro de permissão insuficiente (403) */
export declare class ForbiddenError extends AppError {
    constructor(message?: string, code?: string);
}
/** Erro de recurso não encontrado (404) */
export declare class NotFoundError extends AppError {
    constructor(message?: string, code?: string);
}
/** Erro de conflito/duplicação (409) */
export declare class ConflictError extends AppError {
    constructor(message?: string, code?: string);
}
/** Erro de licenciamento / plano bloqueado (402/403) */
export declare class LicensingError extends AppError {
    constructor(message?: string, code?: string);
}
/** Erro interno inesperado do servidor (500) */
export declare class InternalServerError extends AppError {
    constructor(message?: string, code?: string);
}
//# sourceMappingURL=AppError.d.ts.map