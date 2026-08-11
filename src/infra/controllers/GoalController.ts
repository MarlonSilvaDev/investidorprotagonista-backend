import { Request, Response } from 'express';
import { supabase } from '../database/supabase';

export class GoalController {
  async list(request: Request, response: Response) {
    const { id: userId } = request.user;

    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      return response.status(400).json({ message: error.message });
    }

    return response.json(data);
  }

  async create(request: Request, response: Response) {
    const { id: userId } = request.user;
    const { title, description, targetAmount, currentAmount, deadline, icon, color, isShared } = request.body;

    if (!title) {
      return response.status(400).json({ message: 'Título é obrigatório' });
    }

    const { data, error } = await supabase
      .from('goals')
      .insert([
        {
          user_id: userId,
          title,
          description: description ?? null,
          target_amount: targetAmount ?? 0,
          current_amount: currentAmount ?? 0,
          deadline: deadline ? new Date(deadline).toISOString() : null,
          icon: icon ?? null,
          color: color ?? null,
          is_shared: isShared ?? false,
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
    const { title, description, targetAmount, currentAmount, deadline, icon, color, isShared } = request.body;

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (targetAmount !== undefined) updates.target_amount = targetAmount;
    if (currentAmount !== undefined) updates.current_amount = currentAmount;
    if (deadline !== undefined) updates.deadline = deadline ? new Date(deadline).toISOString() : null;
    if (icon !== undefined) updates.icon = icon;
    if (color !== undefined) updates.color = color;
    if (isShared !== undefined) updates.is_shared = isShared;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('goals')
      .update(updates)
      .match({ id, user_id: userId })
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      return response.status(400).json({ message: error.message });
    }

    return response.json(data);
  }

  async delete(request: Request, response: Response) {
    const { id: userId } = request.user;
    const { id } = request.params;

    const { error } = await supabase
      .from('goals')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .match({ id, user_id: userId });

    if (error) {
      return response.status(400).json({ message: error.message });
    }

    return response.status(204).send();
  }
}
