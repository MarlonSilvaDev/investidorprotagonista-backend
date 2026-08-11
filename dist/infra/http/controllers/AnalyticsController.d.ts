import { Request, Response } from 'express';
/**
 * Recebe eventos do app (espelho do Firebase Analytics).
 * Mantém telemetria de negócio no backend sem o front falar com GA direto
 * além do SDK Firebase no device.
 */
export declare class AnalyticsController {
    track(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=AnalyticsController.d.ts.map