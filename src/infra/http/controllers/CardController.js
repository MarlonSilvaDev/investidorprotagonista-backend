"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardController = void 0;
const express_1 = require("express");
const supabase_1 = require("../../database/supabase");
class CardController {
    async list(request, response) {
        const { id: userId } = request.user;
        const { data, error } = await supabase_1.supabase
            .from('cards')
            .select('*')
            .eq('user_id', userId);
        if (error) {
            return response.status(400).json({ message: error.message });
        }
        return response.json(data);
    }
    async create(request, response) {
        const { id: userId } = request.user;
        const { name, type, limit, closingDay, dueDay, maskedNumber } = request.body;
        const { data, error } = await supabase_1.supabase
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
exports.CardController = CardController;
//# sourceMappingURL=CardController.js.map