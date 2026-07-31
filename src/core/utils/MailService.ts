import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} não configurado no .env`);
  }
  return value;
}

function createTransport() {
  const port = Number(process.env.SMTP_PORT || 465);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: {
      user: requireEnv('SMTP_USER'),
      pass: requireEnv('SMTP_PASS').replace(/\s+/g, ''),
    },
  });
}

function loadTemplate(fileName: string): string {
  const candidates = [
    path.join(process.cwd(), 'src', 'infra', 'email', 'templates', fileName),
    path.join(__dirname, 'templates', fileName),
    path.join(process.cwd(), 'email.txt'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return fs.readFileSync(candidate, 'utf8');
    }
  }

  throw new Error(`Template de e-mail não encontrado: ${fileName}`);
}

function fillTemplate(html: string, vars: Record<string, string>): string {
  let result = html;
  for (const [key, value] of Object.entries(vars)) {
    result = result.split(`{{${key}}}`).join(value);
    // Compatível com placeholder antigo do Supabase, se ainda existir no arquivo.
    result = result.split(`{{ .${key} }}`).join(value);
  }
  return result;
}

async function sendMail(to: string, subject: string, html: string) {
  const fromName = process.env.SMTP_FROM_NAME || 'Investidor Protagonista';
  const fromEmail = process.env.SMTP_FROM_EMAIL || requireEnv('SMTP_USER');
  const transporter = createTransport();
  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    html,
  });
}

/** E-mail de confirmação — template personalizado (email.txt / confirm-email.html). */
export async function sendConfirmationEmail(params: {
  to: string;
  name?: string;
  confirmUrl: string;
}) {
  const html = fillTemplate(loadTemplate('confirm-email.html'), {
    CONFIRMATION_URL: params.confirmUrl,
    ConfirmationURL: params.confirmUrl,
  });

  await sendMail(
    params.to,
    'Confirme seu e-mail — Investidor Protagonista',
    html
  );
}

/** E-mail de redefinição de senha — template próprio do backend. */
export async function sendPasswordResetEmail(params: {
  to: string;
  name?: string;
  resetUrl: string;
}) {
  const html = fillTemplate(loadTemplate('reset-password.html'), {
    RESET_URL: params.resetUrl,
  });

  await sendMail(
    params.to,
    'Redefinir senha — Investidor Protagonista',
    html
  );
}
