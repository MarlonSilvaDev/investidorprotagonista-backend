"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureAuthenticated = ensureAuthenticated;
const express_1 = require("express");
const supabase_1 = require("../../database/supabase");
async function ensureAuthenticated(request, response, next) {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
        return response.status(401).json({ message: 'Token missing' });
    }
    const [, token] = authHeader.split(' ');
    if (!token) {
        return response.status(401).json({ message: 'Token missing' });
    }
    try {
        const { data, error } = await supabase_1.supabase.auth.getUser(token);
        if (error || !data.user) {
            return response.status(401).json({ message: 'Invalid token' });
        }
        request.user = {
            id: data.user.id,
        };
        return next();
    }
    catch {
        return response.status(401).json({ message: 'Invalid token' });
    }
}
//# sourceMappingURL=ensureAuthenticated.js.map