"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureAuthenticated = ensureAuthenticated;
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
        const { data: profile } = await supabase_1.supabaseAdmin
            .from('profiles')
            .select('user_type, plan, country, document_type, document_number, role, subscription_status')
            .eq('id', data.user.id)
            .maybeSingle();
        request.user = {
            id: data.user.id,
            email: data.user.email || '',
            userType: profile?.user_type || 'usuario',
            plan: profile?.plan || 'usuario',
            country: profile?.country || 'BR',
            documentType: profile?.document_type ?? null,
            documentNumber: profile?.document_number ?? null,
            role: profile?.role || 'padrao',
            subscriptionStatus: profile?.subscription_status || 'trial',
        };
        return next();
    }
    catch {
        return response.status(401).json({ message: 'Invalid token' });
    }
}
//# sourceMappingURL=ensureAuthenticated.js.map