import { Request, Response } from 'express';
import { supabase } from '../../database/supabase';

export class CardController {
  async list(request: Request, response: Response) {
    const { id: userId } = request.user;

    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      return response.status(400).json({ message: error.message });
    }

    return response.json(data);
  }

  async create(request: Request, response: Response) {
    const { id: userId } = request.user;
    const { name, type, limit, closingDay, dueDay, maskedNumber } = request.body;

    const { data, error } = await supabase
      .from('cards')
      .insert([
        {
          user_id: userId,
          name,
          type,
          limit,
          closing_day: closingDay,
          due_day: dueDay,
          masked_number: maskedNumber,
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
