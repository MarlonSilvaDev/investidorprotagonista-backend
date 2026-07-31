import { type AppLocale, resolveLocale } from '../../../core/utils/i18n';

type EmailConfirmedPageOptions = {
  loginUrl: string;
  appName?: string;
  locale?: AppLocale;
};

function textsFor(locale: AppLocale) {
  switch (locale) {
    case 'en':
      return {
        lang: 'en-US',
        title: 'Email confirmed',
        message: 'Your account has been verified successfully.',
        cta: 'Go to login',
        subline: 'You can now sign in to',
      };
    case 'es':
      return {
        lang: 'es',
        title: 'Correo confirmado',
        message: 'Tu cuenta ha sido verificada con éxito.',
        cta: 'Ir al inicio de sesión',
        subline: 'Ya puedes entrar en',
      };
    default:
      return {
        lang: 'pt-BR',
        title: 'E-mail confirmado',
        message: 'Sua conta foi verificada com sucesso.',
        cta: 'Ir para o login',
        subline: 'Você já pode entrar no',
      };
  }
}

/** Página HTML de confirmação de e-mail (redirect do Supabase). */
export function renderEmailConfirmedPage({
  loginUrl,
  appName = 'Investidor Protagonista',
  locale = 'pt',
}: EmailConfirmedPageOptions): string {
  const safeLoginUrl = loginUrl.replace(/"/g, '&quot;');
  const t = textsFor(resolveLocale(locale));

  return `<!DOCTYPE html>
<html lang="${t.lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#0B0E14" />
  <title>${t.title} — ${appName}</title>
  <style>
    :root {
      --bg: #0B0E14;
      --surface: #151923;
      --text: #FFFFFF;
      --muted: #9CA3AF;
      --lime: #2ED9A0;
      --purple: #8B7CFF;
      --navy: #0B2748;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      min-height: 100%;
      font-family: Inter, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
      background:
        radial-gradient(1200px 600px at 10% -10%, rgba(139,124,255,.18), transparent 55%),
        radial-gradient(900px 500px at 90% 0%, rgba(46,217,160,.12), transparent 50%),
        var(--bg);
      color: var(--text);
    }
    .wrap {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
    }
    .card {
      width: min(440px, 100%);
      background: linear-gradient(180deg, rgba(255,255,255,.03), transparent), var(--surface);
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 20px;
      padding: 36px 28px 28px;
      text-align: center;
      box-shadow: 0 24px 60px rgba(0,0,0,.35);
    }
    .badge {
      width: 72px;
      height: 72px;
      margin: 0 auto 20px;
      border-radius: 20px;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, var(--lime), var(--purple) 45%, var(--navy));
      box-shadow: 0 10px 30px rgba(46,217,160,.25);
    }
    .badge span {
      width: 58px;
      height: 58px;
      border-radius: 16px;
      background: var(--bg);
      display: grid;
      place-items: center;
      font-size: 28px;
      color: var(--lime);
    }
    h1 {
      margin: 0 0 8px;
      font-size: 1.5rem;
      letter-spacing: -0.02em;
    }
    p {
      margin: 0;
      color: var(--muted);
      line-height: 1.55;
      font-size: .975rem;
    }
    .cta {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      margin-top: 28px;
      padding: 14px 18px;
      border: 0;
      border-radius: 12px;
      background: var(--lime);
      color: #0B0E14;
      font-weight: 700;
      font-size: 1rem;
      text-decoration: none;
      cursor: pointer;
      transition: transform .15s ease, box-shadow .15s ease;
      box-shadow: 0 8px 24px rgba(46,217,160,.28);
    }
    .cta:hover {
      transform: translateY(-1px);
      box-shadow: 0 12px 28px rgba(46,217,160,.36);
    }
    .brand {
      margin-top: 22px;
      font-size: .8rem;
      color: rgba(156,163,175,.85);
    }
  </style>
</head>
<body>
  <main class="wrap">
    <section class="card">
      <div class="badge" aria-hidden="true"><span>✓</span></div>
      <h1>${t.title}</h1>
      <p>
        ${t.message}<br />
        ${t.subline} ${appName}.
      </p>
      <a class="cta" href="${safeLoginUrl}">${t.cta}</a>
      <div class="brand">${appName}</div>
    </section>
  </main>
  <script>
    // Remove tokens do hash da URL (Supabase pode anexar access_token no redirect).
    if (window.location.hash) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  </script>
</body>
</html>`;
}
