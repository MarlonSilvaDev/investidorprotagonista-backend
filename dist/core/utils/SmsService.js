"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendVerificationSms = void 0;
exports.sendVerificationCode = sendVerificationCode;
const i18n_1 = require("./i18n");
const NotifyGwService_1 = require("./NotifyGwService");
/**
 * Envia o código de verificação através do canal selecionado via NotifyGW:
 * - 'sms':       POST /api/v1/sms
 * - 'whatsapp':  POST /api/v1/whatsapp
 * - 'telegram':  POST /api/v1/telegram
 */
async function sendVerificationCode({ to, code, channel = 'whatsapp', locale: rawLocale, }) {
    const locale = (0, i18n_1.resolveLocale)(rawLocale);
    const messages = {
        pt: `Investidor Protagonista: Seu codigo de verificacao e ${code}. Nao compartilhe este codigo com ninguem.`,
        en: `Investidor Protagonista: Your verification code is ${code}. Do not share this code.`,
        es: `Investidor Protagonista: Tu codigo de verificacion es ${code}. No compartas este codigo.`,
    };
    const messageText = messages[locale] || messages.pt;
    switch (channel) {
        case 'sms': {
            const result = await (0, NotifyGwService_1.sendSms)(to, messageText);
            return result.ok;
        }
        case 'whatsapp': {
            const result = await (0, NotifyGwService_1.sendWhatsApp)(to, messageText);
            return result.ok;
        }
        case 'telegram': {
            const result = await (0, NotifyGwService_1.sendTelegram)(to, messageText);
            return result.ok;
        }
        default: {
            console.error(`[VERIFICAÇÃO] Canal inválido: ${channel}`);
            return false;
        }
    }
}
const sendVerificationSms = (params) => sendVerificationCode({ ...params, channel: params.channel || 'sms' });
exports.sendVerificationSms = sendVerificationSms;
//# sourceMappingURL=SmsService.js.map