import { Request, Response } from 'express';
export declare class InvestmentController {
    list(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * POST /investments/sync
     * Atualiza cotações via Brapi (B3) nos investimentos manuais do usuário.
     * Não inventa sucesso: sem tickers ou falha do provedor → resposta explícita.
     */
    sync(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=InvestmentController.d.ts.map