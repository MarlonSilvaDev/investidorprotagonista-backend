import { Request, Response } from 'express';
import { supabase } from '../../database/supabase';

export class SubscriptionController {
  async list(request: Request, response: Response) {
    const { id: userId } = request.user;

    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      return response.status(400).json({ message: error.message });
    }

    const totalMonthlyExpenses = subscriptions
      .filter(s => s.type === 'expense' && s.is_active)
      .reduce((acc, s) => acc + (s.amount || 0), 0);

    const totalMonthlyIncome = subscriptions
      .filter(s => s.type === 'income' && s.is_active)
      .reduce((acc, s) => acc + (s.amount || 0), 0);

    return response.json({
      subscriptions,
      totalMonthlyExpenses,
      totalMonthlyIncome,
    });
  }

  async create(request: Request, response: Response) {
    const { id: userId } = request.user;
    const { name, amount, type, category, dayOfMonth } = request.body;

    const { data, error } = await supabase
      .from('subscriptions')
      .insert([
        {
          user_id: userId,
          name,
          amount,
          type,
          category,
          day_of_month: dayOfMonth,
        },
      ])
      .select()
      .single();

    if (error) {
      return response.status(400).json({ message: error.message });
    }

    return response.status(201).json(data);
  }
}
