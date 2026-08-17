import { Request, Response } from 'express';
import { supabase } from '../../config/supabase';
import { normalizePlan } from '../../shared/middlewares/checkLicensing';

export class ReportController {
  async exportReport(request: Request, response: Response) {
    const { id: userId } = request.user;
    const { screenTitle, format, period, includeCharts, includeCategories, applyFilters } = request.body;

    try {
      // 1. Validação estrita do plano no banco de dados
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, plan, user_type, subscription_status')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        return response.status(403).json({
          code: 'PROFILE_NOT_FOUND',
          message: 'Perfil de usuário não encontrado.',
        });
      }

      const userPlan = normalizePlan(profile.plan, profile.user_type);
      if (userPlan === 'free') {
        return response.status(403).json({
          code: 'FEATURE_LOCKED',
          message: 'Exportação de relatórios (PDF, Excel e CSV) é um recurso exclusivo dos planos Pro. Atualize seu plano para continuar.',
          required_plan: 'pro_usuario',
          current_plan: userPlan,
        });
      }

      // 2. Coleta de dados financeiros para o relatório
      const startDate = new Date();
      if (period === 'Este Mês') {
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
      } else if (period === 'Últimos 3 Meses') {
        startDate.setMonth(startDate.getMonth() - 3);
        startDate.setDate(1);
      } else if (period === 'Ano Atual') {
        startDate.setMonth(0, 1);
        startDate.setHours(0, 0, 0, 0);
      } else {
        // Tudo
        startDate.setFullYear(2020, 0, 1);
      }

      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString());

      const { data: goals } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId);

      const { data: investments } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', userId);

      const income =
        transactions
          ?.filter((t: any) => t.type === 'income')
          .reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0) || 0;
      const expense =
        transactions
          ?.filter((t: any) => t.type === 'expense')
          .reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0) || 0;

      return response.json({
        success: true,
        reportTitle: screenTitle || 'Relatório Financeiro',
        format: format || 'PDF',
        period: period || 'Este Mês',
        generatedAt: new Date().toISOString(),
        userName: profile.name || 'Investidor',
        userPlan,
        summary: {
          totalIncome: income,
          totalExpense: expense,
          netBalance: income - expense,
          transactionCount: transactions?.length || 0,
          goalCount: goals?.length || 0,
          investmentCount: investments?.length || 0,
        },
        options: {
          includeCharts: !!includeCharts,
          includeCategories: !!includeCategories,
          applyFilters: !!applyFilters,
        },
      });
    } catch (error: any) {
      return response.status(500).json({
        message: error.message || 'Falha ao processar exportação de relatório',
      });
    }
  }
}
