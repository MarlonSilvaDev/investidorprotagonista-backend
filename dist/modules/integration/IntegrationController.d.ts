import { Request, Response } from 'express';
export declare class IntegrationController {
    getPluggyToken(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    syncPluggyAccount(_request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    updateMarketPrices(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    getWhatsAppStatus(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    linkWhatsApp(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    sendDailySummary(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    updateNotificationPrefs(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    whatsappWebhook(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Helper para gerar resumo financeiro consolidado.
     */
    private generateFinancialSummary;
}
//# sourceMappingURL=IntegrationController.d.ts.map