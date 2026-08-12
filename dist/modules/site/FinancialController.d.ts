import { Request, Response } from 'express';
export declare class FinancialController {
    /** GET /site/financial ou /admin/financial — lista pública/admin */
    list(_request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /** GET /site/financial/:slug — busca por slug */
    getBySlug(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /** GET /admin/financial/:id — busca por ID */
    getById(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /** POST /admin/financial — cria registro na tabela financial */
    create(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /** PUT /admin/financial/:id — atualiza registro na tabela financial */
    update(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /** DELETE /admin/financial/:id — exclui registro da tabela financial */
    delete(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=FinancialController.d.ts.map