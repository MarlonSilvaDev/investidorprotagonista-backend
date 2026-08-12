/**
 * Internacionalização do backend — centraliza textos e templates
 * de e-mail para os idiomas suportados (pt, en, es).
 */

export type AppLocale = "pt" | "en" | "es";

/** Resolve o locale a partir do valor enviado pelo cliente. */
export function resolveLocale(raw: unknown): AppLocale {
  if (typeof raw !== "string") return "pt";
  const code = raw.toLowerCase().split(/[-_]/)[0];
  if (code === "en") return "en";
  if (code === "es") return "es";
  return "pt";
}

// ─── TEMPLATES DE E-MAIL ───

export interface EmailTemplate {
  subject: string;
  html: string;
}

export const EMAIL_TEMPLATES: Record<AppLocale, Record<string, EmailTemplate>> = {
  pt: {
    confirm: {
      subject: "Confirme seu e-mail — Investidor Protagonista",
      html: `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Confirme seu e-mail</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0B0F1A;color:#E2E8F0;padding:40px 20px;line-height:1.6}
  .card{max-width:520px;margin:0 auto;background:#111827;border-radius:16px;padding:40px;border:1px solid rgba(255,255,255,.08)}
  .logo{font-size:24px;font-weight:800;color:#fff;text-align:center;margin-bottom:32px}
  .logo span{color:#10b981}
  h1{font-size:22px;font-weight:700;color:#fff;margin-bottom:16px;text-align:center}
  p{font-size:15px;color:#94A3B8;margin-bottom:24px;text-align:center}
  .btn{display:inline-block;background:linear-gradient(135deg,#10b981,#059669);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:16px;margin-top:8px}
  .footer{margin-top:32px;text-align:center;font-size:13px;color:#64748B}
</style></head>
<body>
  <div class="card">
    <div class="logo">Investidor <span>Protagonista</span></div>
    <h1>Confirme seu e-mail</h1>
    <p>Para ativar sua conta, clique no botão abaixo e confirme seu endereço de e-mail.</p>
    <div style="text-align:center"><a href="{CONFIRM_URL}" class="btn">Confirmar e-mail</a></div>
    <p class="footer">Se você não criou esta conta, ignore este e-mail.</p>
    <p class="footer">© 2026 Investidor Protagonista</p>
  </div>
</body></html>`,
    },
    resetPassword: {
      subject: "Redefinir sua senha — Investidor Protagonista",
      html: `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Redefinir sua senha</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0B0F1A;color:#E2E8F0;padding:40px 20px;line-height:1.6}
  .card{max-width:520px;margin:0 auto;background:#111827;border-radius:16px;padding:40px;border:1px solid rgba(255,255,255,.08)}
  .logo{font-size:24px;font-weight:800;color:#fff;text-align:center;margin-bottom:32px}
  .logo span{color:#10b981}
  h1{font-size:22px;font-weight:700;color:#fff;margin-bottom:16px;text-align:center}
  p{font-size:15px;color:#94A3B8;margin-bottom:24px;text-align:center}
  .btn{display:inline-block;background:linear-gradient(135deg,#10b981,#059669);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:16px;margin-top:8px}
  .footer{margin-top:32px;text-align:center;font-size:13px;color:#64748B}
  .warning{font-size:13px;color:#F59E0B;text-align:center;margin-bottom:16px}
</style></head>
<body>
  <div class="card">
    <div class="logo">Investidor <span>Protagonista</span></div>
    <h1>Redefinir sua senha</h1>
    <p>Você solicitou a redefinição da sua senha. Clique no botão abaixo para escolher uma nova senha.</p>
    <div class="warning">Este link expira em 30 minutos.</div>
    <div style="text-align:center"><a href="{RESET_URL}" class="btn">Redefinir senha</a></div>
    <p class="footer">Se você não solicitou esta alteração, ignore este e-mail e sua senha permanecerá inalterada.</p>
    <p class="footer">© 2026 Investidor Protagonista</p>
  </div>
</body></html>`,
    },
  },
  en: {
    confirm: {
      subject: "Confirm your email — Protagonist Investor",
      html: `<!DOCTYPE html>
<html lang="en-US">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Confirm your email</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0B0F1A;color:#E2E8F0;padding:40px 20px;line-height:1.6}
  .card{max-width:520px;margin:0 auto;background:#111827;border-radius:16px;padding:40px;border:1px solid rgba(255,255,255,.08)}
  .logo{font-size:24px;font-weight:800;color:#fff;text-align:center;margin-bottom:32px}
  .logo span{color:#10b981}
  h1{font-size:22px;font-weight:700;color:#fff;margin-bottom:16px;text-align:center}
  p{font-size:15px;color:#94A3B8;margin-bottom:24px;text-align:center}
  .btn{display:inline-block;background:linear-gradient(135deg,#10b981,#059669);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:16px;margin-top:8px}
  .footer{margin-top:32px;text-align:center;font-size:13px;color:#64748B}
</style></head>
<body>
  <div class="card">
    <div class="logo">Investidor <span>Protagonista</span></div>
    <h1>Confirm your email</h1>
    <p>To activate your account, click the button below and confirm your email address.</p>
    <div style="text-align:center"><a href="{CONFIRM_URL}" class="btn">Confirm email</a></div>
    <p class="footer">If you didn't create this account, please ignore this email.</p>
    <p class="footer">© 2026 Protagonist Investor</p>
  </div>
</body></html>`,
    },
    resetPassword: {
      subject: "Reset your password — Protagonist Investor",
      html: `<!DOCTYPE html>
<html lang="en-US">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Reset your password</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0B0F1A;color:#E2E8F0;padding:40px 20px;line-height:1.6}
  .card{max-width:520px;margin:0 auto;background:#111827;border-radius:16px;padding:40px;border:1px solid rgba(255,255,255,.08)}
  .logo{font-size:24px;font-weight:800;color:#fff;text-align:center;margin-bottom:32px}
  .logo span{color:#10b981}
  h1{font-size:22px;font-weight:700;color:#fff;margin-bottom:16px;text-align:center}
  p{font-size:15px;color:#94A3B8;margin-bottom:24px;text-align:center}
  .btn{display:inline-block;background:linear-gradient(135deg,#10b981,#059669);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:16px;margin-top:8px}
  .footer{margin-top:32px;text-align:center;font-size:13px;color:#64748B}
  .warning{font-size:13px;color:#F59E0B;text-align:center;margin-bottom:16px}
</style></head>
<body>
  <div class="card">
    <div class="logo">Investidor <span>Protagonista</span></div>
    <h1>Reset your password</h1>
    <p>You requested a password reset. Click the button below to choose a new password.</p>
    <div class="warning">This link expires in 30 minutes.</div>
    <div style="text-align:center"><a href="{RESET_URL}" class="btn">Reset password</a></div>
    <p class="footer">If you didn't request this change, please ignore this email and your password will remain unchanged.</p>
    <p class="footer">© 2026 Protagonist Investor</p>
  </div>
</body></html>`,
    },
  },
  es: {
    confirm: {
      subject: "Confirma tu correo — Inversor Protagonista",
      html: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Confirma tu correo</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0B0F1A;color:#E2E8F0;padding:40px 20px;line-height:1.6}
  .card{max-width:520px;margin:0 auto;background:#111827;border-radius:16px;padding:40px;border:1px solid rgba(255,255,255,.08)}
  .logo{font-size:24px;font-weight:800;color:#fff;text-align:center;margin-bottom:32px}
  .logo span{color:#10b981}
  h1{font-size:22px;font-weight:700;color:#fff;margin-bottom:16px;text-align:center}
  p{font-size:15px;color:#94A3B8;margin-bottom:24px;text-align:center}
  .btn{display:inline-block;background:linear-gradient(135deg,#10b981,#059669);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:16px;margin-top:8px}
  .footer{margin-top:32px;text-align:center;font-size:13px;color:#64748B}
</style></head>
<body>
  <div class="card">
    <div class="logo">Investidor <span>Protagonista</span></div>
    <h1>Confirma tu correo</h1>
    <p>Para activar tu cuenta, haz clic en el botón de abajo y confirma tu dirección de correo.</p>
    <div style="text-align:center"><a href="{CONFIRM_URL}" class="btn">Confirmar correo</a></div>
    <p class="footer">Si no creaste esta cuenta, ignora este correo.</p>
    <p class="footer">© 2026 Inversor Protagonista</p>
  </div>
</body></html>`,
    },
    resetPassword: {
      subject: "Restablecer tu contraseña — Inversor Protagonista",
      html: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Restablecer tu contraseña</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0B0F1A;color:#E2E8F0;padding:40px 20px;line-height:1.6}
  .card{max-width:520px;margin:0 auto;background:#111827;border-radius:16px;padding:40px;border:1px solid rgba(255,255,255,.08)}
  .logo{font-size:24px;font-weight:800;color:#fff;text-align:center;margin-bottom:32px}
  .logo span{color:#10b981}
  h1{font-size:22px;font-weight:700;color:#fff;margin-bottom:16px;text-align:center}
  p{font-size:15px;color:#94A3B8;margin-bottom:24px;text-align:center}
  .btn{display:inline-block;background:linear-gradient(135deg,#10b981,#059669);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:16px;margin-top:8px}
  .footer{margin-top:32px;text-align:center;font-size:13px;color:#64748B}
  .warning{font-size:13px;color:#F59E0B;text-align:center;margin-bottom:16px}
</style></head>
<body>
  <div class="card">
    <div class="logo">Investidor <span>Protagonista</span></div>
    <h1>Restablecer tu contraseña</h1>
    <p>Solicitaste el restablecimiento de tu contraseña. Haz clic en el botón de abajo para elegir una nueva contraseña.</p>
    <div class="warning">Este enlace expira en 30 minutos.</div>
    <div style="text-align:center"><a href="{RESET_URL}" class="btn">Restablecer contraseña</a></div>
    <p class="footer">Si no solicitaste este cambio, ignora este correo y tu contraseña permanecerá sin cambios.</p>
    <p class="footer">© 2026 Inversor Protagonista</p>
  </div>
</body></html>`,
    },
  },
};

/** Obtém o template de e-mail para o locale e tipo solicitados. */
export function getEmailTemplate(type: string, locale: AppLocale = "pt"): EmailTemplate {
  const templates = EMAIL_TEMPLATES[locale] ?? EMAIL_TEMPLATES.pt;
  return templates[type] ?? EMAIL_TEMPLATES.pt[type] ?? {
    subject: "Investidor Protagonista",
    html: `<p>${type}</p>`,
  };
}

/** Substitui placeholders no HTML do template. */
export function interpolateTemplate(
  html: string,
  replacements: Record<string, string>
): string {
  let result = html;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replaceAll(`{${key}}`, value);
  }
  return result;
}
