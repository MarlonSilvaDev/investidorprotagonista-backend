import { Request, Response } from 'express';
import { supabase } from '../../database/supabase';

export class TaskController {
  async list(request: Request, response: Response) {
    const { id: userId } = request.user;

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return response.status(400).json({ message: error.message });
    }

    return response.json(data);
  }

  async create(request: Request, response: Response) {
    const { id: userId } = request.user;
    const { title, description, dueDate, priority } = request.body;

    const { data, error } = await supabase
      .from('tasks')
      .insert([
        {
          user_id: userId,
          title,
          description,
          due_date: dueDate,
          priority: priority || 'medium',
        },
      ])
      .select()
      .single();

    if (error) {
      return response.status(400).json({ message: error.message });
    }

    return response.status(201).json(data);
  }

  async toggle(request: Request, response: Response) {
    const { id: userId } = request.user;
    const { id } = request.params;

    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('is_completed')
      .match({ id, user_id: userId })
      .single();

    if (fetchError || !task) {
      return response.status(404).json({ message: 'Task not found' });
    }

    const { data, error } = await supabase
      .from('tasks')
      .update({
        is_completed: !task.is_completed,
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
