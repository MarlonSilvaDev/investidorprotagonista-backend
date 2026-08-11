/**
 * Internacionalização do backend — centraliza textos e templates
 * de e-mail para os idiomas suportados (pt, en, es).
 */
export type AppLocale = "pt" | "en" | "es";
/** Resolve o locale a partir do valor enviado pelo cliente. */
export declare function resolveLocale(raw: unknown): AppLocale;
export interface EmailTemplate {
    subject: string;
    html: string;
}
export declare const EMAIL_TEMPLATES: Record<AppLocale, Record<string, EmailTemplate>>;
/** Obtém o template de e-mail para o locale e tipo solicitados. */
export declare function getEmailTemplate(type: string, locale?: AppLocale): EmailTemplate;
/** Substitui placeholders no HTML do template. */
export declare function interpolateTemplate(html: string, replacements: Record<string, string>): string;
//# sourceMappingURL=i18n.d.ts.map