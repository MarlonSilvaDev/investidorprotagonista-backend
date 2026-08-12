"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppService = void 0;
const NotifyGwService_1 = require("./NotifyGwService");
/**
 * Wrapper de compatibilidade — redireciona para NotifyGwService.
 * Mantém a interface estática para não quebrar chamadas existentes
 * em IntegrationController e outros módulos.
 */
class WhatsAppService {
    static async sendMessage(to, message) {
        const result = await (0, NotifyGwService_1.sendWhatsApp)(to, message);
        if (!result.ok) {
            console.error('[WhatsAppService] Falha ao enviar via NotifyGW:', result.error);
        }
    }
    static async sendAssetAlert(to, asset, price, change) {
        const message = `📊 *Informativo de Ativo*\n\n` +
            `O ativo *${asset}* está cotado a *R$ ${price.toFixed(2)}* ` +
            `(${change > 0 ? '📈' : '📉'} ${change.toFixed(2)}%).`;
        await this.sendMessage(to, message);
    }
}
exports.WhatsAppService = WhatsAppService;
//# sourceMappingURL=WhatsAppService.js.map