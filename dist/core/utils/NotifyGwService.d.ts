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
export type NotifyChannel = 'sms' | 'whatsapp' | 'telegram' | 'email';
export interface NotifySendResult {
    ok: boolean;
    outboxId?: number;
    status?: string;
    error?: string;
}
/**
 * Envia um SMS via NotifyGW.
 * Body: { to: "+5511999999999", message: "..." }
 */
export declare function sendSms(to: string, message: string): Promise<NotifySendResult>;
/**
 * Envia uma mensagem WhatsApp via NotifyGW.
 * Body: { to: "+5511999999999", message: "...", instance?: "..." }
 */
export declare function sendWhatsApp(to: string, message: string, instance?: string): Promise<NotifySendResult>;
/**
 * Envia uma mensagem Telegram via NotifyGW.
 * Body: { to: "chat_id", message: "..." }
 */
export declare function sendTelegram(to: string, message: string): Promise<NotifySendResult>;
/**
 * Envia um e-mail via NotifyGW.
 * Body: { to: "user@example.com", subject: "...", message: "...", instance?: "..." }
 */
export declare function sendEmail(to: string, subject: string, message: string, instance?: string): Promise<NotifySendResult>;
//# sourceMappingURL=NotifyGwService.d.ts.map