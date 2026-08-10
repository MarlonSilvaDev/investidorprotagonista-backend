import { Request, Response } from 'express';
export declare class SubscriptionController {
    /**
     * GET /subscriptions
     * Lista todas as assinaturas ativas do usuário autenticado.
     * Query param opcional: ?type=income|expense
     *
     * Conforme arquitetura de escalabilidade:
     * - Sempre filtra por deleted_at IS NULL (soft delete)
     */
    list(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * POST /subscriptions
     * Cria uma nova assinatura para o usuário.
     */
    create(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * PUT /subscriptions/:id
     * Atualiza uma assinatura existente.
     */
    update(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * DELETE /subscriptions/:id
     * Soft delete: marca deleted_at ao invés de remover fisicamente.
     * Conforme a arquitetura de escalabilidade.
     */
    delete(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * PATCH /subscriptions/:id/toggle
     * Ativa/desativa uma assinatura.
     */
    toggle(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * GET /subscriptions/cumulative-totals
     * Retorna totais acumulados mês a mês para gráficos.
     * Query params: ?type=expense&months=12
     */
    getCumulativeTotals(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=SubscriptionController.d.ts.map