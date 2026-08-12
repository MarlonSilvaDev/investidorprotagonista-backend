import { Request, Response } from 'express';
export declare class MarketAssetsController {
    /** GET /site/market-assets ou /admin/market-assets — lista ativos */
    list(_request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /** GET /admin/market-assets/:id — busca ativo por ID */
    getById(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /** POST /admin/market-assets — cria registro na tabela market_assets */
    create(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /** PUT /admin/market-assets/:id — atualiza registro na tabela market_assets */
    update(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /** DELETE /admin/market-assets/:id — exclui registro da tabela market_assets */
    delete(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=MarketAssetsController.d.ts.map