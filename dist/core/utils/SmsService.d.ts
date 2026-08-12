import { type AppLocale } from './i18n';
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
export declare function sendVerificationCode({ to, code, channel, locale: rawLocale, }: SendVerificationCodeParams): Promise<boolean>;
export declare const sendVerificationSms: (params: SendVerificationCodeParams) => Promise<boolean>;
export {};
//# sourceMappingURL=SmsService.d.ts.map