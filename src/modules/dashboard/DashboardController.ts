import { Request, Response } from 'express';
import { supabase } from '../../config/supabase';

export class DashboardController {
  async getConsolidatedData(request: Request, response: Response) {
    const { id: userId } = request.user;

    // 1. Resumo Financeiro (Transações)
    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount, type, category, date')
      .eq('user_id', userId);

    const income = transactions?.filter((t: any) => t.type === 'income').reduce((acc: number, t: any) => acc + t.amount, 0) || 0;
    const expense = transactions?.filter((t: any) => t.type === 'expense').reduce((acc: number, t: any) => acc + t.amount, 0) || 0;

    // 2. Dados para Gráfico de Pizza (Categorias de Gastos)
    const categoryData: Record<string, number> = {};
    transactions?.filter((t: any) => t.type === 'expense').forEach((t: any) => {
      categoryData[t.category] = (categoryData[t.category] || 0) + t.amount;
    });

    // 3. Resumo de Investimentos
    const { data: investments } = await supabase
      .from('investments')
      .select('asset_class, current_total, total_invested')
      .eq('user_id', userId);

    const totalInvested = investments?.reduce((acc: number, i: any) => acc + (i.current_total || 0), 0) || 0;

    const assetAllocation: Record<string, number> = {};
    investments?.forEach((i: any) => {
      assetAllocation[i.asset_class] = (assetAllocation[i.asset_class] || 0) + (i.current_total || 0);
    });

    // 4. Metas
    const { data: goals } = await supabase
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
        goalsProgress: goals?.map((g: any) => ({
          title: g.title,
          percent: (g.current_amount / g.target_amount) * 100
        }))
      }
    });
  }
}
