"use strict";
/**
 * NotifyGW — gateway unificado de mensageria.
 *
 * Substitui Twilio, Evolution API/Z-API, Telegram Bot API e Signal REST.
 * Um único Bearer token (`NOTIFY_GW`) controla tudo.
 *
 * Endpoints usados:
 *   POST /api/v1/sms        { to, message }
 *   POST /api/v1/whatsapp   { to, message, instance? }
 *   POST /api/v1/telegram   { to, message }
 *   POST /api/v1/email      { to, subject, message, instance? }
 *
 * Todas as respostas de sucesso retornam 202 com { outbox_id, status }.
 *
 * @see https://api.notifygw.com/docs
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSms = sendSms;
exports.sendWhatsApp = sendWhatsApp;
exports.sendTelegram = sendTelegram;
exports.sendEmail = sendEmail;
const NOTIFY_GW_BASE = 'https://api.notifygw.com/api/v1';
function getApiKey() {
    const key = process.env.NOTIFY_GW?.trim();
    if (!key) {
        throw new Error('[NOTIFY_GW] Variável NOTIFY_GW não está definida no .env');
    }
    return key;
}
function headers() {
    return {
        Authorization: `Bearer ${getApiKey()}`,
        'Content-Type': 'application/json',
    };
}
// ─── Funções de envio ───
/**
 * Envia um SMS via NotifyGW.
 * Body: { to: "+5511999999999", message: "..." }
 */
async function sendSms(to, message) {
    return sendToChannel('sms', { to: formatPhone(to), message });
}
/**
 * Envia uma mensagem WhatsApp via NotifyGW.
 * Body: { to: "+5511999999999", message: "...", instance?: "..." }
 */
async function sendWhatsApp(to, message, instance) {
    return sendToChannel('whatsapp', {
        to: formatPhone(to),
        message,
        ...(instance ? { instance } : {}),
    });
}
/**
 * Envia uma mensagem Telegram via NotifyGW.
 * Body: { to: "chat_id", message: "..." }
 */
async function sendTelegram(to, message) {
    return sendToChannel('telegram', { to, message });
}
/**
 * Envia um e-mail via NotifyGW.
 * Body: { to: "user@example.com", subject: "...", message: "...", instance?: "..." }
 */
async function sendEmail(to, subject, message, instance) {
    return sendToChannel('email', {
        to,
        subject,
        message,
        ...(instance ? { instance } : {}),
    });
}
// ─── Helpers internos ───
async function sendToChannel(channel, body) {
    const url = `${NOTIFY_GW_BASE}/${channel}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify(body),
        });
        const text = await response.text();
        if (response.status === 202 || response.ok) {
            let data = {};
            try {
                data = JSON.parse(text);
            }
            catch { /* resposta não-JSON, ok */ }
            console.log(`[NOTIFY_GW][${channel.toUpperCase()}] Mensagem enfileirada → outbox_id=${data.outbox_id ?? '?'}`);
            return { ok: true, outboxId: data.outbox_id, status: data.status ?? 'queued' };
        }
        console.error(`[NOTIFY_GW][${channel.toUpperCase()}] Erro ${response.status}: ${text}`);
        return { ok: false, error: text };
    }
    catch (err) {
        console.error(`[NOTIFY_GW][${channel.toUpperCase()}] Exceção:`, err.message ?? err);
        return { ok: false, error: err.message ?? String(err) };
    }
}
/** Garante formato +55... com dígitos. */
function formatPhone(raw) {
    const digits = raw.replace(/\D/g, '');
    return digits.startsWith('+') ? digits : `+${digits}`;
}
//# sourceMappingURL=NotifyGwService.js.map