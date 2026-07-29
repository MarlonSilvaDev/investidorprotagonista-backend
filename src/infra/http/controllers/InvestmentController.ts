import { Request, Response } from 'express';
import { supabase } from '../../database/supabase';

export class InvestmentController {
  async list(request: Request, response: Response) {
    const { id: userId } = request.user;

    const { data: investments, error } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      return response.status(400).json({ message: error.message });
    }

    const portfolioValue = investments.reduce((acc, inv) => acc + (inv.current_total || 0), 0);
    const totalInvested = investments.reduce((acc, inv) => acc + (inv.total_invested || 0), 0);
    const portfolioProfit = portfolioValue - totalInvested;

    const topGainers = [...investments]
      .sort((a, b) => (b.daily_change_percent || 0) - (a.daily_change_percent || 0))
      .slice(0, 3);

    const topLosers = [...investments]
      .sort((a, b) => (a.daily_change_percent || 0) - (b.daily_change_percent || 0))
      .slice(0, 3);

    return response.json({
      investments,
      portfolioValue,
      portfolioProfit,
      topGainers,
      topLosers,
    });
  }

  async sync(request: Request, response: Response) {
    // Lógica de sincronização com APIs de mercado aqui
    return response.json({ message: 'Portfolio synced successfully' });
  }
}
