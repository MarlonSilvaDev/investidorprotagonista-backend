import { type AppLocale } from '../i18n';
type EmailLinkErrorPageOptions = {
    loginUrl: string;
    appName?: string;
    /** Mensagem vinda do Supabase (opcional). */
    description?: string;
    locale?: AppLocale;
};
/** Página HTML: link de e-mail inválido ou expirado. */
export declare function renderEmailLinkErrorPage({ loginUrl, appName, description, locale, }: EmailLinkErrorPageOptions): string;
/**
 * Gateway na raiz (`/`). O Supabase manda erros no hash
 * (`#error=access_denied&error_code=otp_expired&...`), que só o browser lê.
 */
export declare function renderAuthCallbackGatewayPage({ loginUrl, appName, }: {
    loginUrl: string;
    appName?: string;
}): string;
export {};
//# sourceMappingURL=emailLinkErrorPage.d.ts.map