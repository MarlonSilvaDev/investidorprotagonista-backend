import { Request, Response, NextFunction } from 'express';
/** Lista dos 3 planos oficiais suportados */
export declare const VALID_PLANS: readonly ["free", "pro_usuario", "pro_empresa"];
export type OfficialPlanType = 'free' | 'pro_usuario' | 'pro_empresa';
/** Normaliza uma string de plano para um dos 3 planos oficiais */
export declare function normalizePlan(plan?: string, userType?: string): OfficialPlanType;
export type SubscriptionOrigin = 'free' | 'app_store' | 'google_play' | 'stripe';
export declare function checkLicensing(request: Request, response: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
/** Middleware para exigir nível de plano específico */
export declare function requirePlan(minimumPlan: 'pro_usuario' | 'pro_empresa'): (request: Request, response: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
//# sourceMappingURL=checkLicensing.d.ts.map