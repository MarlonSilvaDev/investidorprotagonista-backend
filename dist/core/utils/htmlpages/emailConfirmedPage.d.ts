import { type AppLocale } from '../i18n';
type EmailConfirmedPageOptions = {
    loginUrl: string;
    appName?: string;
    locale?: AppLocale;
};
/** Página HTML de confirmação de e-mail (redirect do Supabase). */
export declare function renderEmailConfirmedPage({ loginUrl, appName, locale, }: EmailConfirmedPageOptions): string;
export {};
//# sourceMappingURL=emailConfirmedPage.d.ts.map