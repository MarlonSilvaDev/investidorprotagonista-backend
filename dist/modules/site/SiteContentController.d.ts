import { Request, Response } from 'express';
export declare const ALLOWED_POST_CATEGORIES: readonly ["FINANCEIRO", "INVESTIMENTOS", "EDUCACAO"];
export declare class SiteContentController {
    /** GET /site/articles — lista pública unificada */
    listPublic(_request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /** GET /posts/:slug — detalhe público por slug */
    getBySlug(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /** POST /posts/:slug/view — incrementa visualizações */
    trackView(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /** GET /admin/posts — lista admin */
    listAdmin(_request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /** GET /admin/posts/:id */
    getById(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /** POST /admin/posts — cria post na tabela correspondente do site */
    create(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /** PUT /admin/posts/:id — atualiza post no site */
    update(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /** DELETE /admin/posts/:id */
    delete(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /** GET /admin/posts/analytics */
    analytics(_request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /** GET /admin/books ou /site/books — lista livros */
    listBooks(_request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /** POST /admin/books — adiciona livro */
    createBook(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /** PUT /admin/books/:id — atualiza livro */
    updateBook(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /** DELETE /admin/books/:id — exclui livro */
    deleteBook(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /** GET /admin/market-assets ou /site/market-assets — lista ativos */
    listMarketAssets(_request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /** POST /admin/market-assets — cria novo ativo de mercado */
    createMarketAsset(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /** PUT /admin/market-assets/:id — atualiza ativo de mercado */
    updateMarketAsset(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /** DELETE /admin/market-assets/:id — exclui ativo */
    deleteMarketAsset(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=SiteContentController.d.ts.map