import type { Request, Response } from 'express';
export declare class OpenFinanceController {
    createConnectToken(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    listItems(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    getSnapshot(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    refreshItem(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    deleteItem(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Webhook público do Pluggy.
     * Valida opcionalmente PLUGGY_WEBHOOK_SECRET via query ?secret= ou header x-webhook-secret.
     */
    webhook(request: Request, response: Response): Promise<Response<any, Record<string, any>> | undefined>;
    private ensureItemOwned;
    /**
     * Snapshot pode ser chamado logo após o widget (antes do webhook).
     * Nesse caso vinculamos o item ao usuário autenticado.
     */
    private ensureItemOwnedOrLink;
}
//# sourceMappingURL=OpenFinanceController.d.ts.map