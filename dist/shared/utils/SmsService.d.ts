import { type AppLocale } from './i18n';
export type VerificationChannel = 'whatsapp' | 'telegram' | 'signal' | 'sms';
interface SendVerificationCodeParams {
    to: string;
    code: string;
    channel?: VerificationChannel;
    locale?: AppLocale;
}
/**
 * Envia o código de verificação através do canal selecionado:
 * - 'sms': Twilio SMS API
 * - 'whatsapp': WhatsApp Gateway API (Evolution API / Z-API / UltraMsg)
 * - 'telegram': Telegram Bot API
 * - 'signal': Signal REST API
 */
export declare function sendVerificationCode({ to, code, channel, locale: rawLocale, }: SendVerificationCodeParams): Promise<boolean>;
export declare const sendVerificationSms: (params: SendVerificationCodeParams) => Promise<boolean>;
export {};
//# sourceMappingURL=SmsService.d.ts.map