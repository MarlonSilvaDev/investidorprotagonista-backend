"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionController = void 0;
const express_1 = require("express");
const supabase_1 = require("../../database/supabase");
class TransactionController {
    async list(request, response) {
        const { id: userId } = request.user;
        const { data, error } = await supabase_1.supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });
        if (error) {
            return response.status(400).json({ message: error.message });
        }
        return response.json(data);
    }
    async create(request, response) {
        const { id: userId } = request.user;
        const { title, amount, type, category, date, description } = request.body;
        const { data, error } = await supabase_1.supabase
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
    async delete(request, response) {
        const { id: userId } = request.user;
        const { id } = request.params;
        const { error } = await supabase_1.supabase
            .from('transactions')
            .delete()
            .match({ id, user_id: userId });
        if (error) {
            return response.status(400).json({ message: error.message });
        }
        return response.status(204).send();
    }
}
exports.TransactionController = TransactionController;
//# sourceMappingURL=TransactionController.js.map