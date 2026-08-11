"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenFinanceController = void 0;
const supabase_1 = require("../database/supabase");
const BankIntegrationService_1 = require("../../core/utils/BankIntegrationService");
const PROVIDER = 'pluggy';
function paramId(value) {
    if (typeof value === 'string' && value.length > 0)
        return value;
    if (Array.isArray(value) && typeof value[0] === 'string')
        return value[0];
    return null;
}
function mapPluggyStatus(status) {
    switch ((status || '').toUpperCase()) {
        case 'UPDATED':
        case 'UPDATING':
            return 'connected';
        case 'LOGIN_ERROR':
        case 'OUTDATED':
        case 'WAITING_USER_INPUT':
        case 'WAITING_USER_ACTION':
            return 'error';
        default:
            return 'pending';
    }
}
function buildWebhookUrl() {
    const explicit = process.env.PLUGGY_WEBHOOK_URL;
    if (explicit)
        return explicit;
    const base = process.env.API_PUBLIC_URL || process.env.APP_URL;
    if (!base)
        return undefined;
    const secret = process.env.PLUGGY_WEBHOOK_SECRET;
    const url = `${base.replace(/\/$/, '')}/integrations/open-finance/webhook`;
    return secret ? `${url}?secret=${encodeURIComponent(secret)}` : url;
}
function mapTransaction(tx) {
    const amount = Math.abs(Number(tx.amount ?? 0));
    const rawAmount = Number(tx.amount ?? 0);
    return {
        externalId: String(tx.id),
        type: rawAmount >= 0 ? 'income' : 'expense',
        amount,
        category: tx.category || tx.categoryId || 'Open Finance',
        description: tx.description || tx.descriptionRaw || 'Transação',
        date: tx.date || tx.paymentData?.paymentDate || new Date().toISOString(),
    };
}
function dayFromDateLike(value, fallback = 1) {
    if (typeof value === 'number' && value >= 1 && value <= 31)
        return value;
    if (typeof value === 'string' && value.trim()) {
        const parsed = Date.parse(value);
        if (!Number.isNaN(parsed))
            return new Date(parsed).getUTCDate();
        const asNum = Number(value);
        if (asNum >= 1 && asNum <= 31)
            return asNum;
    }
    return fallback;
}
function mapCreditCard(account) {
    const creditData = account.creditData || {};
    const number = account.number || creditData.number || '';
    const last4 = String(number).replace(/\D/g, '').slice(-4) || '0000';
    return {
        externalId: String(account.id),
        name: account.name || account.marketingName || 'Cartão',
        maskedNumber: `**** ${last4}`,
        brand: (creditData.brand || account.subtype || 'card').toString().toLowerCase(),
        limit: Number(creditData.creditLimit ?? account.balance ?? 0),
        availableLimit: Number(creditData.availableCreditLimit ?? account.balance ?? 0),
        closingDay: dayFromDateLike(creditData.balanceCloseDate, 1),
        dueDay: dayFromDateLike(creditData.balanceDueDate, 1),
    };
}
function isCreditAccount(account) {
    const type = String(account.type || '').toUpperCase();
    const subtype = String(account.subtype || '').toUpperCase();
    return type === 'CREDIT' || subtype.includes('CREDIT_CARD') || !!account.creditData;
}
class OpenFinanceController {
    async createConnectToken(request, response) {
        const { id: userId } = request.user;
        const { institutionId } = request.body ?? {};
        try {
            const webhookUrl = buildWebhookUrl();
            const options = {
                clientUserId: userId,
            };
            if (webhookUrl)
                options.webhookUrl = webhookUrl;
            const token = await BankIntegrationService_1.BankIntegrationService.createConnectToken(options);
            return response.json({
                accessToken: token.accessToken,
                connectToken: token.connectToken,
                expiresIn: token.expiresIn,
                institutionId: institutionId ?? null,
            });
        }
        catch (error) {
            return response
                .status(500)
                .json({ message: error.message || 'Failed to create connect token' });
        }
    }
    async listItems(request, response) {
        const { id: userId } = request.user;
        const { data, error } = await supabase_1.supabase
            .from('open_finance_items')
            .select('*')
            .eq('user_id', userId)
            .neq('status', 'disconnected')
            .order('created_at', { ascending: false });
        if (error) {
            return response.status(400).json({ message: error.message });
        }
        return response.json({
            items: (data ?? []).map((row) => ({
                id: row.id,
                itemId: row.item_id,
                provider: row.provider,
                institutionId: row.institution_id,
                institutionName: row.institution_name,
                status: row.status,
                lastSyncAt: row.last_sync_at,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
            })),
        });
    }
    async getSnapshot(request, response) {
        const { id: userId } = request.user;
        const itemId = paramId(request.params.itemId);
        if (!itemId) {
            return response.status(400).json({ message: 'itemId is required' });
        }
        try {
            const ownership = await this.ensureItemOwnedOrLink(userId, itemId);
            if (!ownership.ok) {
                return response.status(ownership.status).json({ message: ownership.message });
            }
            const [item, accounts] = await Promise.all([
                BankIntegrationService_1.BankIntegrationService.getItem(itemId),
                BankIntegrationService_1.BankIntegrationService.getAccounts(itemId),
            ]);
            const connector = item?.connector || {};
            const institutionId = ownership.row?.institution_id ||
                String(connector.id ?? connector.name ?? 'unknown');
            const institutionName = ownership.row?.institution_name ||
                connector.name ||
                'Instituição';
            const bankAccounts = (accounts || []).filter((a) => !isCreditAccount(a));
            const creditAccounts = (accounts || []).filter((a) => isCreditAccount(a));
            const fromDate = new Date();
            fromDate.setDate(fromDate.getDate() - 90);
            const from = fromDate.toISOString().slice(0, 10);
            const transactions = [];
            let accountBalance = 0;
            for (const account of bankAccounts) {
                accountBalance += Number(account.balance ?? 0);
                const txs = await BankIntegrationService_1.BankIntegrationService.getTransactions(account.id, from);
                for (const tx of txs || []) {
                    transactions.push(mapTransaction(tx));
                }
            }
            // Também puxa txs de cartão (fatura)
            for (const account of creditAccounts) {
                const txs = await BankIntegrationService_1.BankIntegrationService.getTransactions(account.id, from);
                for (const tx of txs || []) {
                    transactions.push(mapTransaction(tx));
                }
            }
            const cards = creditAccounts.map(mapCreditCard);
            const status = mapPluggyStatus(item?.status);
            await supabase_1.supabase.from('open_finance_items').upsert({
                user_id: userId,
                provider: PROVIDER,
                item_id: itemId,
                institution_id: String(institutionId),
                institution_name: institutionName,
                status,
                last_sync_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }, { onConflict: 'provider,item_id' });
            return response.json({
                itemId,
                institutionId: String(institutionId),
                institutionName,
                status,
                accountBalance,
                accounts: bankAccounts.map((a) => ({
                    externalId: String(a.id),
                    name: a.name,
                    type: a.type,
                    subtype: a.subtype,
                    balance: Number(a.balance ?? 0),
                    currencyCode: a.currencyCode || 'BRL',
                })),
                transactions,
                cards,
                // Pluggy não expõe produto de "assinaturas de apps" no Open Finance;
                // contrato estável para o FE: sempre array (vazio quando sem fonte).
                subscriptions: [],
            });
        }
        catch (error) {
            return response
                .status(500)
                .json({ message: error.message || 'Failed to build snapshot' });
        }
    }
    async refreshItem(request, response) {
        const { id: userId } = request.user;
        const itemId = paramId(request.params.itemId);
        if (!itemId) {
            return response.status(400).json({ message: 'itemId is required' });
        }
        try {
            const ownership = await this.ensureItemOwned(userId, itemId);
            if (!ownership.ok) {
                return response.status(ownership.status).json({ message: ownership.message });
            }
            await BankIntegrationService_1.BankIntegrationService.refreshItem(itemId);
            await supabase_1.supabase
                .from('open_finance_items')
                .update({
                status: 'pending',
                last_sync_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
                .eq('user_id', userId)
                .eq('item_id', itemId);
            return response.json({
                message: 'Refresh triggered',
                itemId,
                status: 'pending',
            });
        }
        catch (error) {
            return response
                .status(500)
                .json({ message: error.message || 'Failed to refresh item' });
        }
    }
    async deleteItem(request, response) {
        const { id: userId } = request.user;
        const itemId = paramId(request.params.itemId);
        if (!itemId) {
            return response.status(400).json({ message: 'itemId is required' });
        }
        try {
            const ownership = await this.ensureItemOwned(userId, itemId);
            if (!ownership.ok) {
                return response.status(ownership.status).json({ message: ownership.message });
            }
            try {
                await BankIntegrationService_1.BankIntegrationService.deleteItem(itemId);
            }
            catch (err) {
                // Se já foi removido no provedor, ainda marcamos localmente
                if (err?.response?.status !== 404) {
                    throw err;
                }
            }
            await supabase_1.supabase
                .from('open_finance_items')
                .update({
                status: 'disconnected',
                updated_at: new Date().toISOString(),
            })
                .eq('user_id', userId)
                .eq('item_id', itemId);
            return response.json({ message: 'Item disconnected', itemId });
        }
        catch (error) {
            return response
                .status(500)
                .json({ message: error.message || 'Failed to delete item' });
        }
    }
    /**
     * Webhook público do Pluggy.
     * Valida opcionalmente PLUGGY_WEBHOOK_SECRET via query ?secret= ou header x-webhook-secret.
     */
    async webhook(request, response) {
        const secret = process.env.PLUGGY_WEBHOOK_SECRET;
        if (secret) {
            const provided = request.query.secret ||
                request.headers['x-webhook-secret'];
            if (provided !== secret) {
                return response.status(401).json({ message: 'Invalid webhook secret' });
            }
        }
        const event = request.body?.event;
        const itemId = request.body?.itemId;
        const clientUserId = request.body?.clientUserId;
        // Responde rápido (Pluggy exige 2xx em <5s) e processa em seguida
        response.json({ received: true });
        if (!event || !itemId)
            return;
        try {
            if (event === 'item/deleted') {
                await supabase_1.supabase
                    .from('open_finance_items')
                    .update({
                    status: 'disconnected',
                    updated_at: new Date().toISOString(),
                })
                    .eq('provider', PROVIDER)
                    .eq('item_id', itemId);
                return;
            }
            if (event !== 'item/created' &&
                event !== 'item/updated' &&
                event !== 'item/error' &&
                event !== 'item/login_succeeded') {
                return;
            }
            let userId = clientUserId;
            let institutionId = null;
            let institutionName = null;
            let status = event === 'item/error' ? 'error' : 'connected';
            try {
                const item = await BankIntegrationService_1.BankIntegrationService.getItem(itemId);
                institutionId = item?.connector?.id != null ? String(item.connector.id) : null;
                institutionName = item?.connector?.name ?? null;
                status = event === 'item/error' ? 'error' : mapPluggyStatus(item?.status);
                if (!userId && item?.clientUserId) {
                    userId = item.clientUserId;
                }
            }
            catch {
                // Mantém dados mínimos do payload
            }
            if (!userId) {
                // Sem usuário não há como associar — ignora
                return;
            }
            const { data: existing } = await supabase_1.supabase
                .from('open_finance_items')
                .select('id')
                .eq('provider', PROVIDER)
                .eq('item_id', itemId)
                .maybeSingle();
            if (existing) {
                await supabase_1.supabase
                    .from('open_finance_items')
                    .update({
                    user_id: userId,
                    institution_id: institutionId,
                    institution_name: institutionName,
                    status,
                    last_sync_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                    .eq('id', existing.id);
            }
            else {
                await supabase_1.supabase.from('open_finance_items').insert({
                    user_id: userId,
                    provider: PROVIDER,
                    item_id: itemId,
                    institution_id: institutionId,
                    institution_name: institutionName,
                    status,
                    last_sync_at: new Date().toISOString(),
                });
            }
        }
        catch (err) {
            console.error('[OpenFinanceWebhook] processing error', err);
        }
    }
    async ensureItemOwned(userId, itemId) {
        const { data, error } = await supabase_1.supabase
            .from('open_finance_items')
            .select('*')
            .eq('user_id', userId)
            .eq('item_id', itemId)
            .maybeSingle();
        if (error) {
            return { ok: false, status: 400, message: error.message };
        }
        if (!data || data.status === 'disconnected') {
            return { ok: false, status: 404, message: 'Item not found' };
        }
        return { ok: true, row: data };
    }
    /**
     * Snapshot pode ser chamado logo após o widget (antes do webhook).
     * Nesse caso vinculamos o item ao usuário autenticado.
     */
    async ensureItemOwnedOrLink(userId, itemId) {
        const owned = await this.ensureItemOwned(userId, itemId);
        if (owned.ok)
            return owned;
        try {
            const item = await BankIntegrationService_1.BankIntegrationService.getItem(itemId);
            const clientUserId = item?.clientUserId;
            if (clientUserId && clientUserId !== userId) {
                return { ok: false, status: 403, message: 'Item belongs to another user' };
            }
            const institutionId = item?.connector?.id != null ? String(item.connector.id) : null;
            const institutionName = item?.connector?.name ?? null;
            const { data, error } = await supabase_1.supabase
                .from('open_finance_items')
                .upsert({
                user_id: userId,
                provider: PROVIDER,
                item_id: itemId,
                institution_id: institutionId,
                institution_name: institutionName,
                status: mapPluggyStatus(item?.status),
                updated_at: new Date().toISOString(),
            }, { onConflict: 'provider,item_id' })
                .select()
                .single();
            if (error) {
                return { ok: false, status: 400, message: error.message };
            }
            return { ok: true, row: data };
        }
        catch (error) {
            return {
                ok: false,
                status: 404,
                message: error.message || 'Item not found at provider',
            };
        }
    }
}
exports.OpenFinanceController = OpenFinanceController;
//# sourceMappingURL=OpenFinanceController.js.map