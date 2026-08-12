import { Request, Response } from 'express';
export declare class SharedAccountController {
    /**
     * POST /shared/invite
     * Body: { email }
     */
    invite(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * POST /shared/accept
     * Body: { invite_id }
     */
    accept(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * POST /shared/unlink
     */
    unlink(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * GET /shared/list  (também GET /shared/)
     * Retorna conta ativa + convites pendentes relevantes.
     */
    list(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=SharedAccountController.d.ts.map