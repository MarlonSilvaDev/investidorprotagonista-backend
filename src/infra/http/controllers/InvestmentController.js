"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvestmentController = void 0;
const express_1 = require("express");
const supabase_1 = require("../../database/supabase");
const BrapiService_1 = require("../../../core/utils/BrapiService");
class InvestmentController {
    async list(request, response) {
        const { id: userId } = request.user;
        const { data: investments, error } = await supabase_1.supabase
            .from('investments')
            .select('*')
            .eq('user_id', userId)
            .is('deleted_at', null);
        if (error) {
            return response.status(400).json({ message: error.message });
        }
        const rows = investments ?? [];
        const portfolioValue = rows.reduce((acc, inv) => acc + (inv.current_total || 0), 0);
        const totalInvested = rows.reduce((acc, inv) => acc + (inv.total_invested || 0), 0);
        const portfolioProfit = portfolioValue - totalInvested;
        const topGainers = [...rows]
            .sort((a, b) => (b.daily_change_percent || 0) - (a.daily_change_percent || 0))
            .slice(0, 3);
        const topLosers = [...rows]
            .sort((a, b) => (a.daily_change_percent || 0) - (b.daily_change_percent || 0))
            .slice(0, 3);
        return response.json({
            investments: rows,
            portfolioValue,
            portfolioProfit,
            topGainers,
            topLosers,
        });
    }
    /**
     * POST /investments/sync
     * Atualiza cotações via Brapi (B3) nos investimentos manuais do usuário.
     * Não inventa sucesso: sem tickers ou falha do provedor → resposta explícita.
     */
    async sync(request, response) {
        const { id: userId } = request.user;
        try {
            const { data: investments, error } = await supabase_1.supabase
                .from('investments')
                .select('id, ticker, quantity, average_price, total_invested, current_price, current_total')
                .eq('user_id', userId)
                .is('deleted_at', null)
                .not('ticker', 'is', null);
            if (error) {
                return response.status(400).json({ message: error.message });
            }
            const withTicker = (investments ?? []).filter((inv) => typeof inv.ticker === 'string' && inv.ticker.trim().length > 0);
            if (!withTicker.length) {
                return response.json({
                    message: 'No investments with ticker to update',
                    updated: 0,
                    investments: [],
                });
            }
            const tickers = [...new Set(withTicker.map((i) => String(i.ticker).toUpperCase()))];
            const quotes = await BrapiService_1.BrapiService.getQuote(tickers);
            const quoteMap = new Map((quotes ?? []).map((q) => [String(q.symbol || '').toUpperCase(), q]));
            const updatedRows = [];
            const now = new Date().toISOString();
            for (const investment of withTicker) {
                const ticker = String(investment.ticker).toUpperCase();
                const quote = quoteMap.get(ticker);
                if (!quote?.regularMarketPrice)
                    continue;
                const quantity = Number(investment.quantity || 0);
                const currentPrice = Number(quote.regularMarketPrice);
                const averagePrice = Number(investment.average_price || 0);
                const totalInvested = Number(investment.total_invested || quantity * averagePrice);
                const currentTotal = quantity * currentPrice;
                const dailyChange = Number(quote.regularMarketChange ?? 0) * quantity;
                const dailyChangePercent = Number(quote.regularMarketChangePercent ?? 0);
                const totalProfit = currentTotal - totalInvested;
                const totalProfitPercent = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
                const patch = {
                    current_price: currentPrice,
                    current_total: currentTotal,
                    daily_change: dailyChange,
                    daily_change_percent: dailyChangePercent,
                    total_profit: totalProfit,
                    total_profit_percent: totalProfitPercent,
                    last_sync_date: now,
                    updated_at: now,
                };
                const { data: updated, error: updateError } = await supabase_1.supabase
                    .from('investments')
                    .update(patch)
                    .eq('id', investment.id)
                    .eq('user_id', userId)
                    .select()
                    .single();
                if (updateError) {
                    return response.status(400).json({ message: updateError.message });
                }
                if (updated)
                    updatedRows.push(updated);
            }
            return response.json({
                message: updatedRows.length > 0
                    ? 'Portfolio synced successfully'
                    : 'No quotes available for current tickers',
                updated: updatedRows.length,
                investments: updatedRows,
            });
        }
        catch (error) {
            return response.status(502).json({
                message: error?.message || 'Failed to sync portfolio quotes',
            });
        }
    }
}
exports.InvestmentController = InvestmentController;
//# sourceMappingURL=InvestmentController.js.map