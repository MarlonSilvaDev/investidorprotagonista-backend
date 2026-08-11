"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryController = void 0;
const supabase_1 = require("../database/supabase");
class CategoryController {
    /**
     * GET /categories
     * Lista todas as categorias ativas do usuário autenticado.
     * Query params opcionais: ?type=income|expense&source=transaction|subscription
     *
     * Conforme arquitetura de escalabilidade:
     * - Sempre filtra por deleted_at IS NULL (soft delete)
     * - Suporta filtro por source para separar categories de transaction/subscription
     */
    async list(request, response) {
        const { id: userId } = request.user;
        const { type, source } = request.query;
        let query = supabase_1.supabase
            .from('categories')
            .select('*')
            .eq('user_id', userId)
            .is('deleted_at', null)
            .order('name', { ascending: true });
        if (type && (type === 'income' || type === 'expense')) {
            query = query.eq('type', type);
        }
        if (source && (source === 'transaction' || source === 'subscription')) {
            query = query.eq('source', source);
        }
        const { data, error } = await query;
        if (error) {
            return response.status(400).json({ message: error.message });
        }
        return response.json(data);
    }
    /**
     * POST /categories
     * Cria uma nova categoria personalizada para o usuário.
     * Suporta ambos os formatos de source (antigo e novo) para compatibilidade.
     */
    async create(request, response) {
        const { id: userId } = request.user;
        const { name, type, icon, color, source } = request.body;
        if (!name || !type) {
            return response
                .status(422)
                .json({ message: 'Os campos name e type são obrigatórios.' });
        }
        if (type !== 'income' && type !== 'expense') {
            return response
                .status(422)
                .json({ message: 'O campo type deve ser "income" ou "expense".' });
        }
        // Suporta categorias sem source (legado) e com source (novo)
        const { data, error } = await supabase_1.supabase
            .from('categories')
            .insert([
            {
                user_id: userId,
                name,
                type,
                icon: icon ?? null,
                color: color ?? null,
                is_default: false,
                source: source ?? 'transaction',
                deleted_at: null,
            },
        ])
            .select()
            .single();
        if (error) {
            // Violação de unique(user_id, name, type)
            if (error.code === '23505') {
                return response
                    .status(409)
                    .json({ message: 'Já existe uma categoria com este nome e tipo.' });
            }
            return response.status(400).json({ message: error.message });
        }
        return response.status(201).json(data);
    }
    /**
     * DELETE /categories/:id
     * Soft delete: marca deleted_at ao invés de remover fisicamente.
     * Conforme a arquitetura de escalabilidade — nunca remove imediatamente.
     */
    async delete(request, response) {
        const { id: userId } = request.user;
        const { id } = request.params;
        // Verifica se a categoria pertence ao usuário e não é padrão
        const { data: existing, error: fetchError } = await supabase_1.supabase
            .from('categories')
            .select('id, is_default')
            .eq('id', id)
            .eq('user_id', userId)
            .is('deleted_at', null)
            .single();
        if (fetchError || !existing) {
            return response.status(404).json({ message: 'Categoria não encontrada.' });
        }
        if (existing.is_default) {
            return response
                .status(403)
                .json({ message: 'Categorias padrão não podem ser removidas.' });
        }
        // SOFT DELETE: atualiza deleted_at ao invés de .delete()
        const { error } = await supabase_1.supabase
            .from('categories')
            .update({
            deleted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
            .match({ id, user_id: userId });
        if (error) {
            return response.status(400).json({ message: error.message });
        }
        return response.status(204).send();
    }
    /**
     * POST /categories/seed
     * Insere as categorias padrão para o usuário caso ainda não existam.
     * Útil para usuários que se cadastraram antes da feature existir.
     * Suporta source para separar categories de transaction/subscription.
     */
    async seed(request, response) {
        const { id: userId } = request.user;
        const { source } = request.body; // 'transaction' | 'subscription' | undefined
        // Conta apenas categorias ativas (não deletadas)
        const { count } = await supabase_1.supabase
            .from('categories')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .is('deleted_at', null);
        // Se source especificado, conta apenas daquele source
        if (count != null && count > 0 && source) {
            const sourceCount = await supabase_1.supabase
                .from('categories')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('source', source)
                .is('deleted_at', null);
            if ((sourceCount.count ?? 0) > 0) {
                return response.json({ message: `Categorias já existem para este usuário (source: ${source}).` });
            }
        }
        else if (count != null && count > 0) {
            return response.json({ message: 'Categorias já existem para este usuário.' });
        }
        const defaults = source === 'subscription'
            ? [
                // Saídas (assinaturas)
                { user_id: userId, name: 'Netflix', type: 'expense', icon: 'tv', color: '#E50914', is_default: true, source: 'subscription', deleted_at: null },
                { user_id: userId, name: 'YouTube', type: 'expense', icon: 'youtube', color: '#FF0000', is_default: true, source: 'subscription', deleted_at: null },
                { user_id: userId, name: 'Spotify', type: 'expense', icon: 'music', color: '#1DB954', is_default: true, source: 'subscription', deleted_at: null },
                { user_id: userId, name: 'Amazon Prime', type: 'expense', icon: 'shopping_bag', color: '#00A8E1', is_default: true, source: 'subscription', deleted_at: null },
                { user_id: userId, name: 'Disney+', type: 'expense', icon: 'star', color: '#113CCF', is_default: true, source: 'subscription', deleted_at: null },
                { user_id: userId, name: 'Academia', type: 'expense', icon: 'dumbbell', color: '#FF6B00', is_default: true, source: 'subscription', deleted_at: null },
                { user_id: userId, name: 'Internet', type: 'expense', icon: 'wifi', color: '#0288D1', is_default: true, source: 'subscription', deleted_at: null },
                { user_id: userId, name: 'Celular', type: 'expense', icon: 'smartphone', color: '#7B1FA2', is_default: true, source: 'subscription', deleted_at: null },
            ]
            : [
                // Categorias padrão de Transações
                { user_id: userId, name: 'Renda Fixa', type: 'income', icon: 'account_balance', color: '#4CAF50', is_default: true, source: 'transaction', deleted_at: null },
                { user_id: userId, name: 'Renda Extra', type: 'income', icon: 'add_circle', color: '#8BC34A', is_default: true, source: 'transaction', deleted_at: null },
                { user_id: userId, name: 'Mercado', type: 'expense', icon: 'shopping_cart', color: '#FF9800', is_default: true, source: 'transaction', deleted_at: null },
                { user_id: userId, name: 'Alimentação', type: 'expense', icon: 'restaurant', color: '#F44336', is_default: true, source: 'transaction', deleted_at: null },
                { user_id: userId, name: 'Energia', type: 'expense', icon: 'bolt', color: '#FFEB3B', is_default: true, source: 'transaction', deleted_at: null },
                { user_id: userId, name: 'Água', type: 'expense', icon: 'water_drop', color: '#2196F3', is_default: true, source: 'transaction', deleted_at: null },
                { user_id: userId, name: 'Aluguel', type: 'expense', icon: 'home', color: '#795548', is_default: true, source: 'transaction', deleted_at: null },
                { user_id: userId, name: 'Parcela Casa', type: 'expense', icon: 'house', color: '#607D8B', is_default: true, source: 'transaction', deleted_at: null },
                { user_id: userId, name: 'Parcela Carro', type: 'expense', icon: 'directions_car', color: '#9E9E9E', is_default: true, source: 'transaction', deleted_at: null },
            ];
        const { error } = await supabase_1.supabase.from('categories').insert(defaults);
        if (error) {
            return response.status(400).json({ message: error.message });
        }
        return response.status(201).json({ message: 'Categorias padrão criadas com sucesso.' });
    }
}
exports.CategoryController = CategoryController;
//# sourceMappingURL=CategoryController.js.map