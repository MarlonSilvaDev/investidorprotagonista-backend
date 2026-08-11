"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const supabase_1 = require("../database/supabase");
class DashboardController {
    async getConsolidatedData(request, response) {
        const { id: userId } = request.user;
        // 1. Resumo Financeiro (Transações)
        const { data: transactions } = await supabase_1.supabase
            .from('transactions')
            .select('amount, type, category, date')
            .eq('user_id', userId);
        const income = transactions?.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0) || 0;
        const expense = transactions?.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0) || 0;
        // 2. Dados para Gráfico de Pizza (Categorias de Gastos)
        const categoryData = {};
        transactions?.filter(t => t.type === 'expense').forEach(t => {
            categoryData[t.category] = (categoryData[t.category] || 0) + t.amount;
        });
        // 3. Resumo de Investimentos
        const { data: investments } = await supabase_1.supabase
            .from('investments')
            .select('asset_class, current_total, total_invested')
            .eq('user_id', userId);
        const totalInvested = investments?.reduce((acc, i) => acc + (i.current_total || 0), 0) || 0;
        const assetAllocation = {};
        investments?.forEach(i => {
            assetAllocation[i.asset_class] = (assetAllocation[i.asset_class] || 0) + (i.current_total || 0);
        });
        // 4. Metas
        const { data: goals } = await supabase_1.supabase
            .from('goals')
            .select('title, target_amount, current_amount')
            .eq('user_id', userId);
        return response.json({
            summary: {
                balance: income - expense,
                income,
                expense,
                totalInvested
            },
            charts: {
                expensesByCategory: Object.entries(categoryData).map(([name, value]) => ({ name, value })),
                assetAllocation: Object.entries(assetAllocation).map(([name, value]) => ({ name, value })),
                goalsProgress: goals?.map(g => ({
                    title: g.title,
                    percent: (g.current_amount / g.target_amount) * 100
                }))
            }
        });
    }
}
exports.DashboardController = DashboardController;
//# sourceMappingURL=DashboardController.js.map