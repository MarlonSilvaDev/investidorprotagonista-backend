"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketAssetsController = void 0;
const crypto_1 = require("crypto");
const siteDatabase_1 = require("../../config/siteDatabase");
class MarketAssetsController {
    /** GET /site/market-assets ou /admin/market-assets — lista ativos */
    async list(_request, response) {
        const db = (0, siteDatabase_1.getSiteDatabase)();
        const { data, error } = await db
            .from('market_assets')
            .select('*')
            .order('sort_order', { ascending: true });
        if (error)
            return response.status(400).json({ message: error.message });
        return response.json({ success: true, assets: data || [] });
    }
    /** GET /admin/market-assets/:id — busca ativo por ID */
    async getById(request, response) {
        const { id } = request.params;
        const db = (0, siteDatabase_1.getSiteDatabase)();
        const { data, error } = await db
            .from('market_assets')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error)
            return response.status(400).json({ message: error.message });
        if (!data)
            return response.status(404).json({ message: 'Ativo de mercado não encontrado' });
        return response.json({ success: true, asset: data });
    }
    /** POST /admin/market-assets — cria registro na tabela market_assets */
    async create(request, response) {
        const { symbol, name, price, changePercent, sortOrder, isActive } = request.body;
        if (!symbol || !name || price === undefined) {
            return response.status(400).json({ message: 'Campos obrigatórios: symbol, name, price' });
        }
        const db = (0, siteDatabase_1.getSiteDatabase)();
        const id = (0, crypto_1.randomUUID)();
        const now = new Date().toISOString();
        const { data, error } = await db
            .from('market_assets')
            .insert([
            {
                id,
                symbol,
                name,
                price,
                change_percent: changePercent ?? 0,
                sort_order: sortOrder ?? 0,
                is_active: isActive ?? true,
                created_at: now,
                updated_at: now,
            },
        ])
            .select('*')
            .single();
        if (error)
            return response.status(400).json({ message: error.message });
        return response.status(201).json({ success: true, asset: data });
    }
    /** PUT /admin/market-assets/:id — atualiza registro na tabela market_assets */
    async update(request, response) {
        const { id } = request.params;
        const { symbol, name, price, changePercent, sortOrder, isActive } = request.body;
        const db = (0, siteDatabase_1.getSiteDatabase)();
        const updatePayload = {
            updated_at: new Date().toISOString(),
        };
        if (symbol !== undefined)
            updatePayload.symbol = symbol;
        if (name !== undefined)
            updatePayload.name = name;
        if (price !== undefined)
            updatePayload.price = price;
        if (changePercent !== undefined)
            updatePayload.change_percent = changePercent;
        if (sortOrder !== undefined)
            updatePayload.sort_order = sortOrder;
        if (isActive !== undefined)
            updatePayload.is_active = isActive;
        const { data, error } = await db
            .from('market_assets')
            .update(updatePayload)
            .eq('id', id)
            .select('*')
            .single();
        if (error)
            return response.status(400).json({ message: error.message });
        return response.json({ success: true, asset: data });
    }
    /** DELETE /admin/market-assets/:id — exclui registro da tabela market_assets */
    async delete(request, response) {
        const { id } = request.params;
        const db = (0, siteDatabase_1.getSiteDatabase)();
        const { error } = await db.from('market_assets').delete().eq('id', id);
        if (error)
            return response.status(400).json({ message: error.message });
        return response.json({ success: true, message: 'Ativo excluído da tabela market_assets' });
    }
}
exports.MarketAssetsController = MarketAssetsController;
//# sourceMappingURL=MarketAssetsController.js.map