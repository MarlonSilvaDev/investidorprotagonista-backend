"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendVerificationSms = void 0;
exports.sendVerificationCode = sendVerificationCode;
const i18n_1 = require("./i18n");
/**
 * Envia o código de verificação através do canal selecionado:
 * - 'sms': Twilio SMS API
 * - 'whatsapp': WhatsApp Gateway API (Evolution API / Z-API / UltraMsg)
 * - 'telegram': Telegram Bot API
 * - 'signal': Signal REST API
 */
async function sendVerificationCode({ to, code, channel = 'whatsapp', locale: rawLocale, }) {
    const locale = (0, i18n_1.resolveLocale)(rawLocale);
    const messages = {
        pt: `Investidor Protagonista: Seu codigo de verificacao e ${code}. Nao compartilhe este codigo com ninguem.`,
        en: `Investidor Protagonista: Your verification code is ${code}. Do not share this code.`,
        es: `Investidor Protagonista: Tu codigo de verificacion es ${code}. No compartas este codigo.`,
    };
    const messageText = messages[locale] || messages.pt;
    // Normaliza o número (só dígitos)
    const cleanNumber = to.replace(/\D/g, '');
    switch (channel) {
        // ─── CANAL 1: SMS (TWILIO) ───
        case 'sms': {
            const accountSid = process.env.TWILIO_ACCOUNT_SID;
            const authToken = process.env.TWILIO_AUTH_TOKEN;
            const fromNumber = process.env.TWILIO_PHONE_NUMBER;
            if (accountSid && authToken && fromNumber) {
                try {
                    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
                    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
                    const body = new URLSearchParams({
                        To: to,
                        From: fromNumber,
                        Body: messageText || '',
                    });
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            Authorization: `Basic ${credentials}`,
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: body.toString(),
                    });
                    if (response.ok) {
                        console.log(`[TWILIO SMS] SMS enviado com sucesso para ${to}`);
                        return true;
                    }
                    const errText = await response.text();
                    console.error('[TWILIO SMS ERROR]', response.status, errText);
                    return false;
                }
                catch (err) {
                    console.error('[TWILIO SMS ERROR] Exceção:', err);
                    return false;
                }
            }
            console.warn('[TWILIO SMS] Credenciais não configuradas');
            return false;
        }
        // ─── CANAL 2: WHATSAPP ───
        case 'whatsapp': {
            const waApiUrl = process.env.WHATSAPP_API_URL?.trim();
            const waToken = process.env.WHATSAPP_API_TOKEN?.trim();
            const waInstance = process.env.WHATSAPP_INSTANCE?.trim(); // opcional (Evolution API)
            console.log("here");
            // Validação importante
            if (!waApiUrl) {
                console.error('[WHATSAPP ERROR] WHATSAPP_API_URL não está definida');
                return false;
            }
            if (waApiUrl.includes('wa.me')) {
                console.error('[WHATSAPP ERROR] WHATSAPP_API_URL está com link wa.me. Isso NÃO é uma API.\n' +
                    'Use a URL da Evolution API, Z-API, UltraMsg, etc.\n' +
                    `URL atual: ${waApiUrl}`);
                return false;
            }
            try {
                // Monta a URL final
                // Evolution API geralmente usa: /message/sendText/{instance}
                // Algumas instalações usam só /message/sendText
                let endpoint = `${waApiUrl.replace(/\/$/, '')}/message/sendText`;
                if (waInstance) {
                    endpoint = `${waApiUrl.replace(/\/$/, '')}/message/sendText/${waInstance}`;
                }
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(waToken ? { apikey: waToken } : {}),
                    },
                    body: JSON.stringify({
                        number: cleanNumber,
                        text: messageText,
                    }),
                });
                const responseText = await response.text();
                if (response.ok) {
                    console.log(`[WHATSAPP] Código enviado com sucesso para ${cleanNumber}`);
                    return true;
                }
                console.error(`[WHATSAPP ERROR] Status ${response.status} | Resposta: ${responseText}`);
                return false;
            }
            catch (err) {
                console.error('[WHATSAPP ERROR] Falha na requisição:', err);
                return false;
            }
        }
        // ─── CANAL 3: TELEGRAM ───
        case 'telegram': {
            const botToken = process.env.TELEGRAM_BOT_TOKEN;
            const chatId = process.env.TELEGRAM_CHAT_ID;
            if (!botToken || !chatId) {
                console.warn('[TELEGRAM] TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID não configurados');
                return false;
            }
            try {
                const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: `📱 *Validação Investidor Protagonista*\n\n${messageText}`,
                        parse_mode: 'Markdown',
                    }),
                });
                if (response.ok) {
                    console.log(`[TELEGRAM] Código enviado com sucesso`);
                    return true;
                }
                const errText = await response.text();
                console.error('[TELEGRAM ERROR]', response.status, errText);
                return false;
            }
            catch (err) {
                console.error('[TELEGRAM ERROR] Exceção:', err);
                return false;
            }
        }
        // ─── CANAL 4: SIGNAL ───
        case 'signal': {
            const signalUrl = process.env.SIGNAL_API_URL;
            const signalSender = process.env.SIGNAL_SENDER_NUMBER;
            if (!signalUrl || !signalSender) {
                console.warn('[SIGNAL] SIGNAL_API_URL ou SIGNAL_SENDER_NUMBER não configurados');
                return false;
            }
            try {
                const response = await fetch(`${signalUrl.replace(/\/$/, '')}/v2/send`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        number: signalSender,
                        recipients: [to],
                        message: messageText,
                    }),
                });
                if (response.ok) {
                    console.log(`[SIGNAL] Código enviado com sucesso para ${to}`);
                    return true;
                }
                const errText = await response.text();
                console.error('[SIGNAL ERROR]', response.status, errText);
                return false;
            }
            catch (err) {
                console.error('[SIGNAL ERROR] Exceção:', err);
                return false;
            }
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