"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderEmailLinkErrorPage = renderEmailLinkErrorPage;
exports.renderAuthCallbackGatewayPage = renderAuthCallbackGatewayPage;
const i18n_1 = require("../../../core/utils/i18n");
function textsFor(locale) {
    switch (locale) {
        case 'en':
            return {
                lang: 'en-US',
                title: 'Invalid link',
                heading: 'Invalid or expired link',
                defaultDesc: 'The confirmation link is invalid or has expired. Request a new email or log in if the account is already active.',
                cta: 'Go to login',
                secondary: 'Create a new account or request a new email',
            };
        case 'es':
            return {
                lang: 'es',
                title: 'Enlace inválido',
                heading: 'Enlace inválido o expirado',
                defaultDesc: 'El enlace de confirmación es inválido o ya expiró. Solicita un nuevo correo o inicia sesión si la cuenta ya está activa.',
                cta: 'Ir al inicio de sesión',
                secondary: 'Crear una nueva cuenta o solicitar un nuevo correo',
            };
        default:
            return {
                lang: 'pt-BR',
                title: 'Link inválido',
                heading: 'Link inválido ou expirado',
                defaultDesc: 'O link de confirmação é inválido ou já expirou. Solicite um novo e-mail ou faça login se a conta já estiver ativa.',
                cta: 'Ir para o login',
                secondary: 'Criar conta de novo ou solicitar novo e-mail',
            };
    }
}
/** Página HTML: link de e-mail inválido ou expirado. */
function renderEmailLinkErrorPage({ loginUrl, appName = 'Investidor Protagonista', description, locale = 'pt', }) {
    const safeLoginUrl = loginUrl.replace(/"/g, '&quot;');
    const t = textsFor((0, i18n_1.resolveLocale)(locale));
    const detail = description?.trim() || t.defaultDesc;
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
      --warn: #F59E0B;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      min-height: 100%;
      font-family: Inter, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
      background:
        radial-gradient(1200px 600px at 10% -10%, rgba(245,158,11,.14), transparent 55%),
        radial-gradient(900px 500px at 90% 0%, rgba(139,124,255,.12), transparent 50%),
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
      background: linear-gradient(135deg, var(--warn), var(--purple) 55%, var(--navy));
      box-shadow: 0 10px 30px rgba(245,158,11,.22);
    }
    .badge span {
      width: 58px;
      height: 58px;
      border-radius: 16px;
      background: var(--bg);
      display: grid;
      place-items: center;
      font-size: 28px;
      color: var(--warn);
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
    .secondary {
      display: inline-block;
      margin-top: 14px;
      color: var(--muted);
      font-size: .9rem;
      text-decoration: none;
    }
    .secondary:hover { color: var(--text); }
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
      <div class="badge" aria-hidden="true"><span>!</span></div>
      <h1>${t.heading}</h1>
      <p>${detail.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
      <a class="cta" href="${safeLoginUrl}">${t.cta}</a>
      <a class="secondary" href="${safeLoginUrl}">${t.secondary}</a>
      <div class="brand">${appName}</div>
    </section>
  </main>
</body>
</html>`;
}
/**
 * Gateway na raiz (`/`). O Supabase manda erros no hash
 * (`#error=access_denied&error_code=otp_expired&...`), que só o browser lê.
 */
function renderAuthCallbackGatewayPage({ loginUrl, appName = 'Investidor Protagonista', }) {
    const safeLoginUrl = JSON.stringify(loginUrl);
    const safeAppName = JSON.stringify(appName);
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#0B0E14" />
  <title>Auth — Investidor Protagonista</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      background: #0B0E14;
      color: #9CA3AF;
      font-family: Inter, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
      display: grid;
      place-items: center;
    }
  </style>
</head>
<body>
  <p id="status">Carregando…</p>
  <script>
    (function () {
      var loginUrl = ${safeLoginUrl};
      var appName = ${safeAppName};
      var raw = (window.location.hash || '').replace(/^#/, '');
      var params = new URLSearchParams(raw);
      var error = params.get('error');
      var code = params.get('error_code');
      var description = params.get('error_description');

      if (error || code === 'otp_expired') {
        var qs = new URLSearchParams();
        if (description) qs.set('description', description);
        if (code) qs.set('code', code);
        window.location.replace('/auth/email-link-error?' + qs.toString());
        return;
      }

      // Sucesso com tokens no hash (fallback se Site URL for a raiz).
      if (params.get('access_token') || params.get('type') === 'signup') {
        window.location.replace('/auth/email-confirmed');
        return;
      }

      document.getElementById('status').textContent = 'API running';
    })();
  </script>
</body>
</html>`;
}
//# sourceMappingURL=emailLinkErrorPage.js.map