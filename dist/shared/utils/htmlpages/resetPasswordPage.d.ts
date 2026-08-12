import { type AppLocale } from '../i18n';
type ResetPasswordPageOptions = {
    token: string;
    errorMessage?: string;
    success?: boolean;
    loginUrl: string;
    appName?: string;
    locale?: AppLocale;
};
export declare function renderResetPasswordPage({ token, errorMessage, success, loginUrl, appName, locale, }: ResetPasswordPageOptions): string;
export {};
//# sourceMappingURL=resetPasswordPage.d.ts.map