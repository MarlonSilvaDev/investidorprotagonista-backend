"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppService = void 0;
const axios_1 = __importDefault(require("axios"));
class WhatsAppService {
    static apiUrl = process.env.WHATSAPP_API_URL;
    static apiKey = process.env.WHATSAPP_API_KEY;
    static async sendMessage(to, message) {
        try {
            // Exemplo usando Evolution API ou Twilio
            await axios_1.default.post(`${this.apiUrl}/message/sendText`, {
                number: to,
                text: message
            }, {
                headers: { 'apikey': this.apiKey }
            });
        }
        catch (error) {
            console.error('Failed to send WhatsApp message:', error);
        }
    }
    static async sendAssetAlert(to, asset, price, change) {
        const message = `📊 *Informativo de Ativo*\n\nO ativo *${asset}* está cotado a *R$ ${price.toFixed(2)}* (${change > 0 ? '📈' : '📉'} ${change.toFixed(2)}%).`;
        await this.sendMessage(to, message);
    }
}
exports.WhatsAppService = WhatsAppService;
//# sourceMappingURL=WhatsAppService.js.map