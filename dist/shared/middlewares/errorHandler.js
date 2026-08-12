"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
const AppError_1 = require("../errors/AppError");
/**
 * Middleware global para captura e tratamento centralizado de erros no Backend.
 * Garante que NUNCA exceções não tratadas ou stacktraces sejam expostas ao cliente.
 */
function errorHandler(err, _request, response, _next) {
    // Erros de domínio conhecidos
    if (err instanceof AppError_1.AppError) {
        return response.status(err.statusCode).json({
            success: false,
            status: 'error',
            message: err.message,
            code: err.code || 'APP_ERROR',
        });
    }
    // Erros de validação Zod
    if (err instanceof zod_1.ZodError) {
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
//# sourceMappingURL=errorHandler.js.map