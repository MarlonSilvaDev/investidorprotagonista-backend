import { type AppLocale } from './i18n';
/** E-mail de confirmação — com suporte a idioma. */
export declare function sendConfirmationEmail(params: {
    to: string;
    name?: string;
    confirmUrl: string;
    locale?: AppLocale;
}): Promise<void>;
/** E-mail de redefinição de senha — com suporte a idioma. */
export declare function sendPasswordResetEmail(params: {
    to: string;
    name?: string;
    resetUrl: string;
    locale?: AppLocale;
}): Promise<void>;
/** Convite de conta compartilhada — texto simples i18n inline. */
export declare function sendSharedInviteEmail(params: {
    to: string;
    ownerName: string;
    inviteId: string;
    acceptHintUrl: string;
    locale?: AppLocale;
}): Promise<void>;
//# sourceMappingURL=MailService.d.ts.map