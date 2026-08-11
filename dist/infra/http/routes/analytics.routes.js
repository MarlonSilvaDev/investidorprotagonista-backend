"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsRoutes = void 0;
const express_1 = require("express");
const AnalyticsController_1 = require("../../controllers/AnalyticsController");
const supabase_1 = require("../../database/supabase");
const analyticsRoutes = (0, express_1.Router)();
exports.analyticsRoutes = analyticsRoutes;
const analyticsController = new AnalyticsController_1.AnalyticsController();
/** Auth opcional: se houver Bearer válido, preenche request.user. */
async function optionalAuth(request, _response, next) {
    const authHeader = request.headers.authorization;
    if (!authHeader)
        return next();
    const [, token] = authHeader.split(' ');
    if (!token)
        return next();
    try {
        const { data } = await supabase_1.supabase.auth.getUser(token);
        if (data.user) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            request.user = { id: data.user.id };
        }
    }
    catch {
        // Ignora token inválido em analytics.
    }
    return next();
}
analyticsRoutes.post('/events', optionalAuth, (request, response) => analyticsController.track(request, response));
//# sourceMappingURL=analytics.routes.js.map