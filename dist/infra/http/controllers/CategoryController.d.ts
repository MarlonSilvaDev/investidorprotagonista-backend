import { Request, Response } from 'express';
export declare class CategoryController {
    /**
     * GET /categories
     * Lista todas as categorias ativas do usuário autenticado.
     * Query params opcionais: ?type=income|expense&source=transaction|subscription
     *
     * Conforme arquitetura de escalabilidade:
     * - Sempre filtra por deleted_at IS NULL (soft delete)
     * - Suporta filtro por source para separar categories de transaction/subscription
     */
    list(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * POST /categories
     * Cria uma nova categoria personalizada para o usuário.
     * Suporta ambos os formatos de source (antigo e novo) para compatibilidade.
     */
    create(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * DELETE /categories/:id
     * Soft delete: marca deleted_at ao invés de remover fisicamente.
     * Conforme a arquitetura de escalabilidade — nunca remove imediatamente.
     */
    delete(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * POST /categories/seed
     * Insere as categorias padrão para o usuário caso ainda não existam.
     * Útil para usuários que se cadastraram antes da feature existir.
     * Suporta source para separar categories de transaction/subscription.
     */
    seed(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=CategoryController.d.ts.map