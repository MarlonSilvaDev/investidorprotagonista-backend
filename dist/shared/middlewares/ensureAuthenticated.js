"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureAuthenticated = ensureAuthenticated;
const supabase_1 = require("../../config/supabase");
function parseCookies(cookieHeader) {
    const list = {};
    if (!cookieHeader)
        return list;
    cookieHeader.split(';').forEach((cookie) => {
        const parts = cookie.split('=');
        const name = parts.shift()?.trim();
        if (name) {
            list[name] = decodeURIComponent(parts.join('='));
        }
    });
    return list;
}
async function ensureAuthenticated(request, response, next) {
    let token;
    const authHeader = request.headers.authorization;
    if (authHeader) {
        const parts = authHeader.split(' ');
        if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
            token = parts[1];
        }
    }
    if (!token && request.headers.cookie) {
        const cookies = parseCookies(request.headers.cookie);
        token = cookies.auth_token || cookies.token;
    }
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