"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionController = void 0;
const supabase_1 = require("../../config/supabase");
class SubscriptionController {
    /**
     * GET /subscriptions
     * Lista todas as assinaturas ativas do usuário autenticado.
     * Query param opcional: ?type=income|expense
     *
     * Conforme arquitetura de escalabilidade:
     * - Sempre filtra por deleted_at IS NULL (soft delete)
     */
    async list(request, response) {
        const { id: userId } = request.user;
        const { type } = request.query || {};
        let query = supabase_1.supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .is('deleted_at', null)
            .order('name', { ascending: true });
        if (type && (type === 'income' || type === 'expense')) {
            query = query.eq('type', type);
        }
        const { data, error } = await query;
        if (error) {
            return response.status(400).json({ message: error.message });
        }
        return response.json(data);
    }
    /**
     * POST /subscriptions
     * Cria uma nova assinatura para o usuário.
     */
    async create(request, response) {
        const { id: userId } = request.user;
        const { name, type, amount, category, description, dayOfMonth, startDate, endDate, linkedCardId, isActive, isFixedMonthly, } = request.body;
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
        const { data, error } = await supabase_1.supabase
            .from('subscriptions')
            .insert([
            {
                user_id: userId,
                name,
                type,
                amount: amount ?? 0,
                category: category ?? null,
                description: description ?? null,
                day_of_month: dayOfMonth ?? 1,
                start_date: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
                end_date: endDate ? new Date(endDate).toISOString() : null,
                linked_card_id: linkedCardId ?? null,
                is_active: isActive ?? true,
                is_fixed_monthly: isFixedMonthly ?? false,
                deleted_at: null,
            },
        ])
            .select()
            .single();
        if (error) {
            return response.status(400).json({ message: error.message });
        }
        return response.status(201).json(data);
    }
    /**
     * PUT /subscriptions/:id
     * Atualiza uma assinatura existente.
     */
    async update(request, response) {
        const { id: userId } = request.user;
        const { id } = request.params;
        const { name, type, amount, category, description, dayOfMonth, startDate, endDate, linkedCardId, isActive, isFixedMonthly, } = request.body;
        const updates = {};
        if (name !== undefined)
            updates.name = name;
        if (type !== undefined)
            updates.type = type;
        if (amount !== undefined)
            updates.amount = amount;
        if (category !== undefined)
            updates.category = category;
        if (description !== undefined)
            updates.description = description;
        if (dayOfMonth !== undefined)
            updates.day_of_month = dayOfMonth;
        if (startDate !== undefined)
            updates.start_date = new Date(startDate).toISOString();
        if (endDate !== undefined)
            updates.end_date = endDate ? new Date(endDate).toISOString() : null;
        if (linkedCardId !== undefined)
            updates.linked_card_id = linkedCardId;
        if (isActive !== undefined)
            updates.is_active = isActive;
        if (isFixedMonthly !== undefined)
            updates.is_fixed_monthly = isFixedMonthly;
        updates.updated_at = new Date().toISOString();
        const { data, error } = await supabase_1.supabase
            .from('subscriptions')
            .update(updates)
            .eq('id', id)
            .eq('user_id', userId)
            .is('deleted_at', null)
            .select()
            .single();
        if (error) {
            return response.status(400).json({ message: error.message });
        }
        if (!data) {
            return response.status(404).json({ message: 'Assinatura não encontrada.' });
        }
        return response.json(data);
    }
    /**
     * DELETE /subscriptions/:id
     * Soft delete: marca deleted_at ao invés de remover fisicamente.
     * Conforme a arquitetura de escalabilidade.
     */
    async delete(request, response) {
        const { id: userId } = request.user;
        const { id } = request.params;
        // SOFT DELETE: atualiza deleted_at ao invés de .delete()
        const { error } = await supabase_1.supabase
            .from('subscriptions')
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
     * PATCH /subscriptions/:id/toggle
     * Ativa/desativa uma assinatura.
     */
    async toggle(request, response) {
        const { id: userId } = request.user;
        const { id } = request.params;
        const { data: existing, error: fetchError } = await supabase_1.supabase
            .from('subscriptions')
            .select('is_active')
            .eq('id', id)
            .eq('user_id', userId)
            .is('deleted_at', null)
            .single();
        if (fetchError || !existing) {
            return response.status(404).json({ message: 'Assinatura não encontrada.' });
        }
        const { data, error } = await supabase_1.supabase
            .from('subscriptions')
            .update({
            is_active: !existing.is_active,
            updated_at: new Date().toISOString(),
        })
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();
        if (error) {
            return response.status(400).json({ message: error.message });
        }
        return response.json(data);
    }
    /**
     * GET /subscriptions/cumulative-totals
     * Retorna totais acumulados mês a mês para gráficos.
     * Query params: ?type=expense&months=12
     */
    async getCumulativeTotals(request, response) {
        const { id: userId } = request.user;
        const { type, months: monthsRaw } = request.query;
        const months = parseInt(monthsRaw) || 12;
        const typeFilter = (type === 'income' || type === 'expense') ? type : undefined;
        const { data, error } = await supabase_1.supabase
            .from('subscriptions')
            .select('type, amount, start_date, end_date, is_active')
            .eq('user_id', userId)
            .is('deleted_at', null)
            .eq('is_active', true);
        if (error) {
            return response.status(400).json({ message: error.message });
        }
        const filtered = typeFilter ? (data ?? []).filter((s) => s.type === typeFilter) : (data ?? []);
        const start = new Date();
        start.setDate(1);
        start.setMonth(start.getMonth() - months + 1);
        const result = {};
        let cumulative = 0;
        for (let i = 0; i < months; i++) {
            const month = new Date(start.getFullYear(), start.getMonth() + i, 1);
            const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
            const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
            const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
            let monthTotal = 0;
            for (const sub of filtered) {
                const subStart = new Date(sub.start_date);
                const subEnd = sub.end_date ? new Date(sub.end_date) : null;
                if (subStart > monthEnd)
                    continue;
                if (subEnd && subEnd < monthStart)
                    continue;
                monthTotal += sub.amount;
            }
            cumulative += monthTotal;
            result[key] = cumulative;
        }
        return response.json(result);
    }
}
exports.SubscriptionController = SubscriptionController;
//# sourceMappingURL=SubscriptionController.js.map