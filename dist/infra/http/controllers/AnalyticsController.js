"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
/**
 * Recebe eventos do app (espelho do Firebase Analytics).
 * Mantém telemetria de negócio no backend sem o front falar com GA direto
 * além do SDK Firebase no device.
 */
class AnalyticsController {
    async track(request, response) {
        const userId = request.user?.id ?? null;
        const { name, parameters, platform, timestamp } = request.body ?? {};
        if (!name || typeof name !== 'string') {
            return response.status(400).json({ message: 'name is required' });
        }
        // Log estruturado — pode evoluir para tabela analytics_events no Supabase.
        console.info('[analytics]', {
            userId,
            name,
            parameters: parameters ?? {},
            platform: platform ?? 'unknown',
            timestamp: timestamp ?? new Date().toISOString(),
        });
        return response.status(202).json({ accepted: true });
    }
}
exports.AnalyticsController = AnalyticsController;
//# sourceMappingURL=AnalyticsController.js.map