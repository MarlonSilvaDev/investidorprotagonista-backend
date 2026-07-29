import { Request, Response } from 'express';
import { supabase } from '../../database/supabase';

export class GoalController {
  async list(request: Request, response: Response) {
    const { id: userId } = request.user;

    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      return response.status(400).json({ message: error.message });
    }

    return response.json(data);
  }

  async create(request: Request, response: Response) {
    const { id: userId } = request.user;
    const { title, description, targetAmount, currentAmount, deadline, icon, color } = request.body;

    const { data, error } = await supabase
      .from('goals')
      .insert([
        {
          user_id: userId,
          title,
          description,
          target_amount: targetAmount,
          current_amount: currentAmount || 0,
          deadline,
          icon,
          color,
        },
      ])
      .select()
      .single();

    if (error) {
      return response.status(400).json({ message: error.message });
    }

    return response.status(201).json(data);
  }

  async update(request: Request, response: Response) {
    const { id: userId } = request.user;
    const { id } = request.params;
    const { title, description, targetAmount, currentAmount, deadline, icon, color } = request.body;

    const { data, error } = await supabase
      .from('goals')
      .update({
        title,
        description,
        target_amount: targetAmount,
        current_amount: currentAmount,
        deadline,
        icon,
        color,
        updated_at: new Date(),
      })
      .match({ id, user_id: userId })
      .select()
      .single();

    if (error) {
      return response.status(400).json({ message: error.message });
    }

    return response.json(data);
  }
}
