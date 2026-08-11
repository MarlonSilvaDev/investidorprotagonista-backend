import { Request, Response } from 'express';
export declare class PaymentController {
    createCheckoutSession(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    verifyPurchase(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    stripeWebhook(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=PaymentController.d.ts.map