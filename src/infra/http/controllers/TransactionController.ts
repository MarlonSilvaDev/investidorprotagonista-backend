import { Request, Response } from 'express';
import { supabase } from '../../database/supabase';

export class TransactionController {
  async list(request: Request, response: Response) {
    const { id: userId } = request.user;

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      return response.status(400).json({ message: error.message });
    }

    return response.json(data);
  }

  async create(request: Request, response: Response) {
    const { id: userId } = request.user;
    const { title, amount, type, category, date, description } = request.body;

    const { data, error } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: userId,
          title,
          amount,
          type,
          category,
          date,
          description,
        },
      ])
      .select()
      .single();

    if (error) {
      return response.status(400).json({ message: error.message });
    }

    return response.status(201).json(data);
  }

  async delete(request: Request, response: Response) {
    const { id: userId } = request.user;
    const { id } = request.params;

    const { error } = await supabase
      .from('transactions')
      .delete()
      .match({ id, user_id: userId });

    if (error) {
      return response.status(400).json({ message: error.message });
    }

    return response.status(204).send();
  }
}
