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

const NOTIFY_GW_BASE = 'https://api.notifygw.com/api/v1';

function getApiKey(): string {
  const key = process.env.NOTIFY_GW?.trim();
  if (!key) {
    throw new Error('[NOTIFY_GW] Variável NOTIFY_GW não está definida no .env');
  }
  return key;
}

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    'Content-Type': 'application/json',
  };
}

// ─── Tipos ───

export type NotifyChannel = 'sms' | 'whatsapp' | 'telegram' | 'email';

export interface NotifySendResult {
  ok: boolean;
  outboxId?: number;
  status?: string;
  error?: string;
}

// ─── Funções de envio ───

/**
 * Envia um SMS via NotifyGW.
 * Body: { to: "+5511999999999", message: "..." }
 */
export async function sendSms(to: string, message: string): Promise<NotifySendResult> {
  return sendToChannel('sms', { to: formatPhone(to), message });
}

/**
 * Envia uma mensagem WhatsApp via NotifyGW.
 * Body: { to: "+5511999999999", message: "...", instance?: "..." }
 */
export async function sendWhatsApp(
  to: string,
  message: string,
  instance?: string,
): Promise<NotifySendResult> {
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
export async function sendTelegram(to: string, message: string): Promise<NotifySendResult> {
  return sendToChannel('telegram', { to, message });
}

/**
 * Envia um e-mail via NotifyGW.
 * Body: { to: "user@example.com", subject: "...", message: "...", instance?: "..." }
 */
export async function sendEmail(
  to: string,
  subject: string,
  message: string,
  instance?: string,
): Promise<NotifySendResult> {
  return sendToChannel('email', {
    to,
    subject,
    message,
    ...(instance ? { instance } : {}),
  });
}

// ─── Helpers internos ───

async function sendToChannel(
  channel: NotifyChannel,
  body: Record<string, unknown>,
): Promise<NotifySendResult> {
  const url = `${NOTIFY_GW_BASE}/${channel}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    });

    const text = await response.text();

    if (response.status === 202 || response.ok) {
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch { /* resposta não-JSON, ok */ }

      console.log(`[NOTIFY_GW][${channel.toUpperCase()}] Mensagem enfileirada → outbox_id=${data.outbox_id ?? '?'}`);
      return { ok: true, outboxId: data.outbox_id, status: data.status ?? 'queued' };
    }

    console.error(`[NOTIFY_GW][${channel.toUpperCase()}] Erro ${response.status}: ${text}`);
    return { ok: false, error: text };
  } catch (err: any) {
    console.error(`[NOTIFY_GW][${channel.toUpperCase()}] Exceção:`, err.message ?? err);
    return { ok: false, error: err.message ?? String(err) };
  }
}

/** Garante formato +55... com dígitos. */
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  return digits.startsWith('+') ? digits : `+${digits}`;
}
