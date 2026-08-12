import { Request, Response } from 'express';
export declare class BooksController {
    /** GET /site/books ou /admin/books — lista livros */
    list(_request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /** GET /admin/books/:id — busca por ID */
    getById(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /** POST /admin/books — cria registro na tabela books */
    create(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /** PUT /admin/books/:id — atualiza registro na tabela books */
    update(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /** DELETE /admin/books/:id — exclui registro da tabela books */
    delete(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=BooksController.d.ts.map