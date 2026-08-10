import { Request, Response } from 'express';
import { supabase } from '../../database/supabase';

export class TransactionController {
  async list(request: Request, response: Response) {
    const { id: userId } = request.user;

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('date', { ascending: false });

    if (error) {
      return response.status(400).json({ message: error.message });
    }

    return response.json(data);
  }

  async create(request: Request, response: Response) {
    const { id: userId } = request.user;
    const {
      title,
      amount,
      type,
      category,
      date,
      description,
      dataOrigin,
      institutionId,
      institutionName,
      externalId,
      attachmentUrl,
      isRecurring,
      recurringRuleId,
      isShared,
    } = request.body;

    if (!type || !amount) {
      return response.status(400).json({ message: 'Tipo e valor são obrigatórios' });
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: userId,
          title: title ?? null,
          type,
          amount: amount ?? 0,
          category: category ?? null,
          description: description ?? null,
          date: date ? new Date(date).toISOString() : new Date().toISOString(),
          data_origin: dataOrigin || 'manual',
          institution_id: institutionId ?? null,
          institution_name: institutionName ?? null,
          external_id: externalId ?? null,
          attachment_url: attachmentUrl ?? null,
          is_recurring: isRecurring ?? false,
          recurring_rule_id: recurringRuleId ?? null,
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
    const {
      title,
      amount,
      type,
      category,
      date,
      description,
      dataOrigin,
      institutionId,
      institutionName,
      attachmentUrl,
      isRecurring,
      recurringRuleId,
      isShared,
    } = request.body;

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (amount !== undefined) updates.amount = amount;
    if (type !== undefined) updates.type = type;
    if (category !== undefined) updates.category = category;
    if (date !== undefined) updates.date = date ? new Date(date).toISOString() : new Date().toISOString();
    if (description !== undefined) updates.description = description;
    if (dataOrigin !== undefined) updates.data_origin = dataOrigin;
    if (institutionId !== undefined) updates.institution_id = institutionId;
    if (institutionName !== undefined) updates.institution_name = institutionName;
    if (attachmentUrl !== undefined) updates.attachment_url = attachmentUrl;
    if (isRecurring !== undefined) updates.is_recurring = isRecurring;
    if (recurringRuleId !== undefined) updates.recurring_rule_id = recurringRuleId;
    if (isShared !== undefined) updates.is_shared = isShared;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('transactions')
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
      .from('transactions')
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
