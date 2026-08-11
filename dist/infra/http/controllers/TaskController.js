"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskController = void 0;
const supabase_1 = require("../../database/supabase");
class TaskController {
    async list(request, response) {
        const { id: userId } = request.user;
        const { data, error } = await supabase_1.supabase
            .from('tasks')
            .select('*')
            .eq('user_id', userId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });
        if (error) {
            return response.status(400).json({ message: error.message });
        }
        return response.json(data);
    }
    async create(request, response) {
        const { id: userId } = request.user;
        const { title, description, dueDate, priority, isCompleted, linkedTransactionId, } = request.body;
        if (!title) {
            return response.status(400).json({ message: 'Título é obrigatório' });
        }
        const completed = isCompleted === true;
        const { data, error } = await supabase_1.supabase
            .from('tasks')
            .insert([
            {
                user_id: userId,
                title,
                description: description ?? null,
                due_date: dueDate ? new Date(dueDate).toISOString() : null,
                priority: priority || 'medium',
                is_completed: completed,
                linked_transaction_id: linkedTransactionId ?? null,
                completed_at: completed ? new Date().toISOString() : null,
            },
        ])
            .select()
            .single();
        if (error) {
            return response.status(400).json({ message: error.message });
        }
        return response.status(201).json(data);
    }
    async update(request, response) {
        const { id: userId } = request.user;
        const { id } = request.params;
        const { title, description, dueDate, priority, isCompleted, linkedTransactionId, } = request.body;
        const updates = {};
        if (title !== undefined)
            updates.title = title;
        if (description !== undefined)
            updates.description = description;
        if (dueDate !== undefined)
            updates.due_date = dueDate ? new Date(dueDate).toISOString() : null;
        if (priority !== undefined)
            updates.priority = priority;
        if (linkedTransactionId !== undefined)
            updates.linked_transaction_id = linkedTransactionId;
        if (isCompleted !== undefined) {
            updates.is_completed = isCompleted;
            updates.completed_at = isCompleted ? new Date().toISOString() : null;
        }
        updates.updated_at = new Date().toISOString();
        const { data, error } = await supabase_1.supabase
            .from('tasks')
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
    async toggle(request, response) {
        const { id: userId } = request.user;
        const { id } = request.params;
        const { data: task, error: fetchError } = await supabase_1.supabase
            .from('tasks')
            .select('is_completed')
            .match({ id, user_id: userId })
            .is('deleted_at', null)
            .single();
        if (fetchError || !task) {
            return response.status(404).json({ message: 'Tarefa não encontrada' });
        }
        const nextCompleted = !task.is_completed;
        const { data, error } = await supabase_1.supabase
            .from('tasks')
            .update({
            is_completed: nextCompleted,
            completed_at: nextCompleted ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
        })
            .match({ id, user_id: userId })
            .select()
            .single();
        if (error) {
            return response.status(400).json({ message: error.message });
        }
        return response.json(data);
    }
    async delete(request, response) {
        const { id: userId } = request.user;
        const { id } = request.params;
        const { error } = await supabase_1.supabase
            .from('tasks')
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
exports.TaskController = TaskController;
//# sourceMappingURL=TaskController.js.map