"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendConfirmationEmail = sendConfirmationEmail;
exports.sendPasswordResetEmail = sendPasswordResetEmail;
exports.sendSharedInviteEmail = sendSharedInviteEmail;
const i18n_1 = require("./i18n");
/** E-mail de confirmação — com suporte a idioma. */
async function sendConfirmationEmail(params) {
    const locale = (0, i18n_1.resolveLocale)(params.locale);
    const template = (0, i18n_1.getEmailTemplate)('confirm', locale);
    const html = (0, i18n_1.interpolateTemplate)(template.html, {
        CONFIRM_URL: params.confirmUrl,
    });
    await sendMail(params.to, template.subject, html);
}
/** E-mail de redefinição de senha — com suporte a idioma. */
async function sendPasswordResetEmail(params) {
    const locale = (0, i18n_1.resolveLocale)(params.locale);
    const template = (0, i18n_1.getEmailTemplate)('resetPassword', locale);
    const html = (0, i18n_1.interpolateTemplate)(template.html, {
        RESET_URL: params.resetUrl,
    });
    await sendMail(params.to, template.subject, html);
}
/** Convite de conta compartilhada — texto simples i18n inline. */
async function sendSharedInviteEmail(params) {
    const locale = (0, i18n_1.resolveLocale)(params.locale);
    const copy = {
        pt: {
            subject: 'Convite para conta compartilhada — Investidor Protagonista',
            body: `<p><strong>${params.ownerName}</strong> convidou você para compartilhar a conta no Investidor Protagonista.</p>
<p>Abra o app, faça login com este e-mail e aceite o convite.</p>
<p>ID do convite: <code>${params.inviteId}</code></p>
<p><a href="${params.acceptHintUrl}">Abrir convite</a></p>`,
        },
        en: {
            subject: 'Shared account invite — Investidor Protagonista',
            body: `<p><strong>${params.ownerName}</strong> invited you to share an account on Investidor Protagonista.</p>
<p>Open the app, sign in with this email and accept the invite.</p>
<p>Invite ID: <code>${params.inviteId}</code></p>
<p><a href="${params.acceptHintUrl}">Open invite</a></p>`,
        },
        es: {
            subject: 'Invitación a cuenta compartida — Investidor Protagonista',
            body: `<p><strong>${params.ownerName}</strong> te invitó a compartir una cuenta en Investidor Protagonista.</p>
<p>Abre la app, inicia sesión con este correo y acepta la invitación.</p>
<p>ID de invitación: <code>${params.inviteId}</code></p>
<p><a href="${params.acceptHintUrl}">Abrir invitación</a></p>`,
        },
    }[locale];
    await sendMail(params.to, copy.subject, copy.body);
}
// ─── INTERNAL ───
function requireEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} não configurado no .env`);
    }
    return value;
}
async function sendMail(to, subject, html) {
    const { default: nodemailer } = await import('nodemailer');
    const port = Number(process.env.SMTP_PORT || 465);
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port,
        secure: port === 465,
        auth: {
            user: requireEnv('SMTP_USER'),
            pass: requireEnv('SMTP_PASS').replace(/\s+/g, ''),
        },
    });
    const fromName = process.env.SMTP_FROM_NAME || 'Investidor Protagonista';
    const fromEmail = process.env.SMTP_FROM_EMAIL || requireEnv('SMTP_USER');
    await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject,
        html,
    });
}
//# sourceMappingURL=MailService.js.map