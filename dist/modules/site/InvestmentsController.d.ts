import { Request, Response } from 'express';
export declare class InvestmentsController {
    /** GET /site/investments ou /admin/investments — lista pública/admin */
    list(_request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /** GET /site/investments/:slug — busca por slug */
    getBySlug(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /** GET /admin/investments/:id — busca por ID */
    getById(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /** POST /admin/investments — cria registro na tabela investments */
    create(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /** PUT /admin/investments/:id — atualiza registro na tabela investments */
    update(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /** DELETE /admin/investments/:id — exclui registro da tabela investments */
    delete(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=InvestmentsController.d.ts.map