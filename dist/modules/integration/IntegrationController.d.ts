import { Request, Response } from 'express';
export declare class IntegrationController {
    getPluggyToken(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * LEGADO DESATIVADO (410 Gone).
     * Open Finance agora é local-only no Flutter: use
     * POST /integrations/open-finance/connect-token + GET .../snapshot.
     * Este endpoint não deve mais gravar txs/investments no Supabase.
     */
    syncPluggyAccount(_request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    updateMarketPrices(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    sendDailySummary(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    updateNotificationPrefs(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    whatsappWebhook(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=IntegrationController.d.ts.map