"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncController = void 0;
const supabase_1 = require("../../database/supabase");
const TABLE_BY_ENTITY = {
    transaction: 'transactions',
    goal: 'goals',
    task: 'tasks',
    card: 'cards',
    subscription: 'subscriptions',
    investment: 'investments',
    category: 'categories',
};
function toIso(value) {
    if (value == null || value === '')
        return null;
    if (typeof value === 'number') {
        return new Date(value).toISOString();
    }
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
function mapTransactionRow(userId, clientId, payload) {
    const title = payload.title ||
        payload.category ||
        payload.description ||
        'Transação';
    return {
        id: clientId,
        user_id: userId,
        title,
        type: payload.type,
        amount: payload.amount,
        category: payload.category ?? null,
        description: payload.description ?? null,
        date: toIso(payload.date) ?? new Date().toISOString(),
        attachment_url: payload.attachmentUrl ?? payload.attachment_url ?? null,
        is_recurring: Boolean(payload.isRecurring ?? payload.is_recurring ?? false),
        recurring_rule_id: payload.recurringRuleId ?? payload.recurring_rule_id ?? null,
        is_shared: Boolean(payload.isShared ?? payload.is_shared ?? false),
        updated_at: toIso(payload.updatedAt ?? payload.updated_at) ?? new Date().toISOString(),
    };
}
function mapGoalRow(userId, clientId, payload) {
    return {
        id: clientId,
        user_id: userId,
        title: payload.title,
        description: payload.description ?? null,
        target_amount: payload.targetAmount ?? payload.target_amount ?? 0,
        current_amount: payload.currentAmount ?? payload.current_amount ?? 0,
        deadline: toIso(payload.deadline),
        icon: payload.icon ?? null,
        color: payload.color ?? null,
        is_shared: Boolean(payload.isShared ?? payload.is_shared ?? false),
        updated_at: toIso(payload.updatedAt ?? payload.updated_at) ?? new Date().toISOString(),
    };
}
function mapTaskRow(userId, clientId, payload) {
    return {
        id: clientId,
        user_id: userId,
        title: payload.title,
        description: payload.description ?? null,
        due_date: toIso(payload.dueDate ?? payload.due_date),
        priority: payload.priority ?? 'medium',
        is_completed: Boolean(payload.isCompleted ?? payload.is_completed ?? false),
        linked_transaction_id: payload.linkedTransactionId ?? payload.linked_transaction_id ?? null,
        completed_at: toIso(payload.completedAt ?? payload.completed_at),
        updated_at: toIso(payload.updatedAt ?? payload.updated_at) ?? new Date().toISOString(),
    };
}
function mapCardRow(userId, clientId, payload) {
    return {
        id: clientId,
        user_id: userId,
        name: payload.name,
        type: payload.type,
        masked_number: payload.maskedNumber ?? payload.masked_number ?? null,
        limit: payload.limit ?? 0,
        available_limit: payload.availableLimit ?? payload.available_limit ?? 0,
        closing_day: payload.closingDay ?? payload.closing_day ?? null,
        due_day: payload.dueDay ?? payload.due_day ?? null,
        color: payload.color ?? null,
        icon: payload.icon ?? null,
        is_active: payload.isActive ?? payload.is_active ?? true,
        updated_at: toIso(payload.updatedAt ?? payload.updated_at) ?? new Date().toISOString(),
    };
}
function mapSubscriptionRow(userId, clientId, payload) {
    return {
        id: clientId,
        user_id: userId,
        name: payload.name,
        type: payload.type,
        amount: payload.amount ?? 0,
        category: payload.category ?? null,
        description: payload.description ?? null,
        day_of_month: payload.dayOfMonth ?? payload.day_of_month ?? 1,
        start_date: toIso(payload.startDate ?? payload.start_date) ?? new Date().toISOString(),
        end_date: toIso(payload.endDate ?? payload.end_date),
        linked_card_id: payload.linkedCardId ?? payload.linked_card_id ?? null,
        is_active: payload.isActive ?? payload.is_active ?? true,
        updated_at: toIso(payload.updatedAt ?? payload.updated_at) ?? new Date().toISOString(),
    };
}
function mapInvestmentRow(userId, clientId, payload) {
    return {
        id: clientId,
        user_id: userId,
        asset_name: payload.assetName ?? payload.asset_name,
        asset_class: payload.assetClass ?? payload.asset_class,
        ticker: payload.ticker,
        quantity: payload.quantity ?? 0,
        average_price: payload.averagePrice ?? payload.average_price ?? 0,
        current_price: payload.currentPrice ?? payload.current_price ?? 0,
        total_invested: payload.totalInvested ?? payload.total_invested ?? 0,
        current_total: payload.currentTotal ?? payload.current_total ?? 0,
        daily_change: payload.dailyChange ?? payload.daily_change ?? null,
        daily_change_percent: payload.dailyChangePercent ?? payload.daily_change_percent ?? null,
        total_profit: payload.totalProfit ?? payload.total_profit ?? null,
        total_profit_percent: payload.totalProfitPercent ?? payload.total_profit_percent ?? null,
        last_sync_date: toIso(payload.lastSyncDate ?? payload.last_sync_date),
        updated_at: toIso(payload.updatedAt ?? payload.updated_at) ?? new Date().toISOString(),
    };
}
function mapCategoryRow(userId, clientId, payload) {
    return {
        id: clientId,
        user_id: userId,
        name: payload.name,
        type: payload.type,
        icon: payload.icon ?? null,
        color: payload.color ?? null,
        is_default: Boolean(payload.isDefault ?? payload.is_default ?? false),
        source: payload.source ?? 'transaction',
        updated_at: toIso(payload.updatedAt ?? payload.updated_at) ?? new Date().toISOString(),
    };
}
function mapRow(entity, userId, clientId, payload) {
    switch (entity) {
        case 'transaction':
            return mapTransactionRow(userId, clientId, payload);
        case 'goal':
            return mapGoalRow(userId, clientId, payload);
        case 'task':
            return mapTaskRow(userId, clientId, payload);
        case 'card':
            return mapCardRow(userId, clientId, payload);
        case 'subscription':
            return mapSubscriptionRow(userId, clientId, payload);
        case 'investment':
            return mapInvestmentRow(userId, clientId, payload);
        case 'category':
            return mapCategoryRow(userId, clientId, payload);
    }
}
/** Detecta linhas criadas pelo legado POST /integrations/pluggy/sync. */
function isLegacyOpenFinanceRow(entity, row) {
    if (entity === 'transaction') {
        if (row.external_id)
            return true;
        const description = String(row.description ?? '');
        const category = String(row.category ?? '');
        return (description.includes('Sincronizado via Pluggy') ||
            category === 'Open Finance');
    }
    if (entity === 'investment') {
        return Boolean(row.external_id);
    }
    return false;
}
class SyncController {
    async push(request, response) {
        const { id: userId } = request.user;
        const operations = (request.body?.operations ?? []);
        if (!Array.isArray(operations)) {
            return response.status(400).json({ message: 'operations must be an array' });
        }
        const results = [];
        for (const operation of operations) {
            const { entity, op, client_id: clientId, payload = {} } = operation;
            if (!entity || !op || !clientId || !TABLE_BY_ENTITY[entity]) {
                results.push({
                    client_id: clientId ?? null,
                    entity: entity ?? null,
                    status: 'error',
                    message: 'Invalid operation',
                });
                continue;
            }
            const table = TABLE_BY_ENTITY[entity];
            try {
                if (op === 'delete') {
                    // SOFT DELETE: usa deleted_at ao invés de DELETE físico
                    // Conforme a arquitetura de escalabilidade
                    const { error } = await supabase_1.supabase
                        .from(table)
                        .update({
                        deleted_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    })
                        .match({ id: clientId, user_id: userId });
                    if (error) {
                        results.push({
                            client_id: clientId,
                            entity,
                            status: 'error',
                            message: error.message,
                        });
                        continue;
                    }
                    results.push({
                        client_id: clientId,
                        server_id: clientId,
                        entity,
                        status: 'applied',
                    });
                    continue;
                }
                // Defensivo: não persistir payload marcado como Open Finance.
                const origin = String(payload.dataOrigin ?? payload.data_origin ?? 'manual').toLowerCase();
                if (origin === 'openfinance' || origin === 'open_finance') {
                    results.push({
                        client_id: clientId,
                        entity,
                        status: 'ignored',
                        message: 'Open Finance data is local-only',
                    });
                    continue;
                }
                const row = mapRow(entity, userId, clientId, payload);
                const { data, error } = await supabase_1.supabase
                    .from(table)
                    .upsert(row, { onConflict: 'id' })
                    .select()
                    .single();
                if (error) {
                    results.push({
                        client_id: clientId,
                        entity,
                        status: 'error',
                        message: error.message,
                    });
                    continue;
                }
                results.push({
                    client_id: clientId,
                    server_id: data.id,
                    entity,
                    status: 'applied',
                    server_updated_at: data.updated_at ?? null,
                });
            }
            catch (error) {
                results.push({
                    client_id: clientId,
                    entity,
                    status: 'error',
                    message: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
        return response.json({ results });
    }
    async pull(request, response) {
        const { id: userId } = request.user;
        const sinceRaw = request.query.since;
        const since = sinceRaw ? new Date(sinceRaw) : null;
        if (sinceRaw && Number.isNaN(since?.getTime())) {
            return response.status(400).json({ message: 'Invalid since timestamp' });
        }
        const entities = [
            'transaction',
            'category',
            'goal',
            'task',
            'card',
            'subscription',
            'investment',
        ];
        const changes = {};
        for (const entity of entities) {
            const table = TABLE_BY_ENTITY[entity];
            let query = supabase_1.supabase
                .from(table)
                .select('*')
                .eq('user_id', userId);
            // Filtra apenas registros ativos (deleted_at IS NULL)
            query = query.is('deleted_at', null);
            if (since) {
                query = query.gt('updated_at', since.toISOString());
            }
            const { data, error } = await query;
            if (error) {
                return response.status(400).json({ message: error.message, entity });
            }
            // Exclui lixo legado do antigo pluggy/sync (OF não deve entrar no pull).
            const rows = (data ?? []).filter((row) => !isLegacyOpenFinanceRow(entity, row));
            // Usa plural do TABLE_BY_ENTITY (category → categories, não categorys).
            changes[TABLE_BY_ENTITY[entity]] = rows;
        }
        // Retorna também as exclusões (deleted_at != NULL) para o app remover do Drift
        const deletions = {};
        for (const entity of entities) {
            const table = TABLE_BY_ENTITY[entity];
            let query = supabase_1.supabase
                .from(table)
                .select('id')
                .eq('user_id', userId)
                .not('deleted_at', 'is', null);
            if (since) {
                query = query.gt('updated_at', since.toISOString());
            }
            const { data } = await query;
            if (data && data.length > 0) {
                deletions[TABLE_BY_ENTITY[entity]] = data;
            }
        }
        return response.json({
            server_time: new Date().toISOString(),
            changes,
            deletions: Object.keys(deletions).length > 0 ? deletions : undefined,
        });
    }
}
exports.SyncController = SyncController;
//# sourceMappingURL=SyncController.js.map