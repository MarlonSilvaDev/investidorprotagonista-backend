import { Request, Response, NextFunction } from 'express';
/**
 * Exige que o usuário autenticado tenha profiles.role = 'administrador'.
 * Deve ser usado após ensureAuthenticated.
 */
export declare function ensureAdmin(request: Request, response: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
//# sourceMappingURL=ensureAdmin.d.ts.map