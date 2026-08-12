"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardController = void 0;
const supabase_1 = require("../../config/supabase");
class CardController {
    async list(request, response) {
        const { id: userId } = request.user;
        const { data, error } = await supabase_1.supabase
            .from('cards')
            .select('*')
            .eq('user_id', userId)
            .is('deleted_at', null)
            .order('name', { ascending: true });
        if (error) {
            return response.status(400).json({ message: error.message });
        }
        return response.json(data);
    }
    async create(request, response) {
        const { id: userId } = request.user;
        const { name, type, limit, availableLimit, closingDay, dueDay, maskedNumber, color, icon, isActive, dataOrigin, institutionId, institutionName, brand, } = request.body;
        if (!name || !type) {
            return response.status(400).json({ message: 'Nome e tipo são obrigatórios' });
        }
        const { data, error } = await supabase_1.supabase
            .from('cards')
            .insert([
            {
                user_id: userId,
                name,
                type,
                limit: limit ?? 0,
                available_limit: availableLimit ?? limit ?? 0,
                closing_day: closingDay ?? null,
                due_day: dueDay ?? null,
                masked_number: maskedNumber ?? null,
                color: color ?? null,
                icon: icon ?? null,
                is_active: isActive ?? true,
                data_origin: dataOrigin || 'manual',
                institution_id: institutionId ?? null,
                institution_name: institutionName ?? null,
                brand: brand ?? null,
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
        const { name, type, limit, availableLimit, closingDay, dueDay, maskedNumber, color, icon, isActive, dataOrigin, institutionId, institutionName, brand, } = request.body;
        const updates = {};
        if (name !== undefined)
            updates.name = name;
        if (type !== undefined)
            updates.type = type;
        if (limit !== undefined)
            updates.limit = limit;
        if (availableLimit !== undefined)
            updates.available_limit = availableLimit;
        if (closingDay !== undefined)
            updates.closing_day = closingDay;
        if (dueDay !== undefined)
            updates.due_day = dueDay;
        if (maskedNumber !== undefined)
            updates.masked_number = maskedNumber;
        if (color !== undefined)
            updates.color = color;
        if (icon !== undefined)
            updates.icon = icon;
        if (isActive !== undefined)
            updates.is_active = isActive;
        if (dataOrigin !== undefined)
            updates.data_origin = dataOrigin;
        if (institutionId !== undefined)
            updates.institution_id = institutionId;
        if (institutionName !== undefined)
            updates.institution_name = institutionName;
        if (brand !== undefined)
            updates.brand = brand;
        updates.updated_at = new Date().toISOString();
        const { data, error } = await supabase_1.supabase
            .from('cards')
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
    async delete(request, response) {
        const { id: userId } = request.user;
        const { id } = request.params;
        const { error } = await supabase_1.supabase
            .from('cards')
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
exports.CardController = CardController;
//# sourceMappingURL=CardController.js.map