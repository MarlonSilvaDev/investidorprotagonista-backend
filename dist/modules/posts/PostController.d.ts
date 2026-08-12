import { Request, Response } from 'express';
export declare const ALLOWED_POST_CATEGORIES: readonly ["FINANCEIRO", "EDUCACAO"];
export declare class PostController {
    /** GET /posts — lista pública */
    listPublic(_request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /** GET /posts/:slug — detalhe público */
    getBySlug(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /** POST /posts/:slug/view — incrementa views (público) */
    trackView(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /** GET /admin/posts — lista admin + categorias */
    listAdmin(_request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /** GET /admin/posts/:id */
    getById(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /** POST /admin/posts */
    create(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /** PUT /admin/posts/:id */
    update(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /** DELETE /admin/posts/:id */
    delete(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /** GET /admin/posts/analytics */
    analytics(_request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=PostController.d.ts.map