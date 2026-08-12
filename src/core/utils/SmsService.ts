import { resolveLocale, type AppLocale } from './i18n';
import { sendSms, sendWhatsApp, sendTelegram, type NotifyChannel } from './NotifyGwService';

export type VerificationChannel = 'whatsapp' | 'telegram' | 'sms';

interface SendVerificationCodeParams {
  to: string;
  code: string;
  channel?: VerificationChannel;
  locale?: AppLocale;
}

/**
 * Envia o código de verificação através do canal selecionado via NotifyGW:
 * - 'sms':       POST /api/v1/sms
 * - 'whatsapp':  POST /api/v1/whatsapp
 * - 'telegram':  POST /api/v1/telegram
 */
export async function sendVerificationCode({
  to,
  code,
  channel = 'whatsapp',
  locale: rawLocale,
}: SendVerificationCodeParams): Promise<boolean> {
  const locale = resolveLocale(rawLocale);

  const messages: Record<string, string> = {
    pt: `Investidor Protagonista: Seu codigo de verificacao e ${code}. Nao compartilhe este codigo com ninguem.`,
    en: `Investidor Protagonista: Your verification code is ${code}. Do not share this code.`,
    es: `Investidor Protagonista: Tu codigo de verificacion es ${code}. No compartas este codigo.`,
  };

  const messageText = messages[locale] || messages.pt;

  switch (channel) {
    case 'sms': {
      const result = await sendSms(to, messageText);
      return result.ok;
    }

    case 'whatsapp': {
      const result = await sendWhatsApp(to, messageText);
      return result.ok;
    }

    case 'telegram': {
      const result = await sendTelegram(to, messageText);
      return result.ok;
    }

    default: {
      console.error(`[VERIFICAÇÃO] Canal inválido: ${channel}`);
      return false;
    }
  }
}

export const sendVerificationSms = (params: SendVerificationCodeParams) =>
  sendVerificationCode({ ...params, channel: params.channel || 'sms' });