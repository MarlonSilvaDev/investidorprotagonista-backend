import { getEmailTemplate, interpolateTemplate, resolveLocale, type AppLocale } from './i18n';

/** E-mail de confirmação — com suporte a idioma. */
export async function sendConfirmationEmail(params: {
  to: string;
  name?: string;
  confirmUrl: string;
  locale?: AppLocale;
}) {
  const locale = resolveLocale(params.locale);
  const template = getEmailTemplate('confirm', locale);

  const html = interpolateTemplate(template.html, {
    CONFIRM_URL: params.confirmUrl,
  });

  await sendMail(params.to, template.subject, html);
}

/** E-mail de redefinição de senha — com suporte a idioma. */
export async function sendPasswordResetEmail(params: {
  to: string;
  name?: string;
  resetUrl: string;
  locale?: AppLocale;
}) {
  const locale = resolveLocale(params.locale);
  const template = getEmailTemplate('resetPassword', locale);

  const html = interpolateTemplate(template.html, {
    RESET_URL: params.resetUrl,
  });

  await sendMail(params.to, template.subject, html);
}

// ─── INTERNAL ───

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} não configurado no .env`);
  }
  return value;
}

async function sendMail(to: string, subject: string, html: string) {
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
