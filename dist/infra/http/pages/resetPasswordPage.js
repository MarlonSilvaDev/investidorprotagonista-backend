"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderResetPasswordPage = renderResetPasswordPage;
const i18n_1 = require("../../../core/utils/i18n");
function textsFor(locale) {
    switch (locale) {
        case 'en':
            return {
                lang: 'en-US',
                title: 'New password',
                titleSuccess: 'Password updated',
                message: 'Set a strong password for your account.',
                messageSuccess: 'Your password has been reset successfully.',
                labelPassword: 'New password',
                labelConfirm: 'Confirm password',
                ruleLen: '• Minimum 8 characters',
                ruleUpper: '• 1 uppercase letter',
                ruleNum: '• 1 number',
                ruleSpecial: '• 1 special character (@ # $ *)',
                btnSubmit: 'Save new password',
                btnGoLogin: 'Go to login',
                alertInvalid: 'The password does not meet the requirements.',
                alertMismatch: 'The passwords do not match.',
            };
        case 'es':
            return {
                lang: 'es',
                title: 'Nueva contraseña',
                titleSuccess: 'Contraseña actualizada',
                message: 'Define una contraseña segura para tu cuenta.',
                messageSuccess: 'Tu contraseña fue restablecida con éxito.',
                labelPassword: 'Nueva contraseña',
                labelConfirm: 'Confirmar contraseña',
                ruleLen: '• Mínimo 8 caracteres',
                ruleUpper: '• 1 letra mayúscula',
                ruleNum: '• 1 número',
                ruleSpecial: '• 1 carácter especial (@ # $ *)',
                btnSubmit: 'Guardar nueva contraseña',
                btnGoLogin: 'Ir al inicio de sesión',
                alertInvalid: 'La contraseña no cumple los requisitos.',
                alertMismatch: 'Las contraseñas no coinciden.',
            };
        default:
            return {
                lang: 'pt-BR',
                title: 'Nova senha',
                titleSuccess: 'Senha atualizada',
                message: 'Defina uma senha forte para sua conta.',
                messageSuccess: 'Sua senha foi redefinida com sucesso.',
                labelPassword: 'Nova senha',
                labelConfirm: 'Confirmar senha',
                ruleLen: '• Mínimo 8 caracteres',
                ruleUpper: '• 1 letra maiúscula',
                ruleNum: '• 1 número',
                ruleSpecial: '• 1 especial (@ # $ *)',
                btnSubmit: 'Salvar nova senha',
                btnGoLogin: 'Ir para o login',
                alertInvalid: 'A senha não atende aos requisitos.',
                alertMismatch: 'As senhas não coincidem.',
            };
    }
}
function renderResetPasswordPage({ token, errorMessage, success, loginUrl, appName = 'Investidor Protagonista', locale = 'pt', }) {
    const safeToken = token.replace(/"/g, '&quot;');
    const safeLogin = loginUrl.replace(/"/g, '&quot;');
    const t = textsFor((0, i18n_1.resolveLocale)(locale));
    if (success) {
        return `<!DOCTYPE html>
<html lang="${t.lang}"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${t.titleSuccess} — ${appName}</title>
<style>
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0B0E14;color:#fff;font-family:Segoe UI,Roboto,sans-serif;padding:24px}
.card{max-width:440px;width:100%;background:#151923;border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:32px;text-align:center}
a{display:inline-block;margin-top:24px;background:#2ED9A0;color:#0B0E14;text-decoration:none;font-weight:700;padding:14px 18px;border-radius:12px;width:100%;box-sizing:border-box}
p{color:#9CA3AF;line-height:1.5}
</style></head>
<body><div class="card"><h1>${t.titleSuccess}</h1><p>${t.messageSuccess}</p><a href="${safeLogin}">${t.btnGoLogin}</a></div></body></html>`;
    }
    return `<!DOCTYPE html>
<html lang="${t.lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${t.title} — ${appName}</title>
  <style>
    body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0B0E14;color:#fff;font-family:Segoe UI,Roboto,sans-serif;padding:24px}
    .card{max-width:440px;width:100%;background:#151923;border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:32px 28px}
    h1{margin:0 0 8px;font-size:1.4rem}
    p{color:#9CA3AF;margin:0 0 20px;line-height:1.5;font-size:.95rem}
    label{display:block;font-size:.85rem;color:#9CA3AF;margin:0 0 6px}
    input{width:100%;box-sizing:border-box;padding:12px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:#1C2130;color:#fff;margin-bottom:12px}
    button{width:100%;border:0;border-radius:12px;padding:14px;background:#2ED9A0;color:#0B0E14;font-weight:700;cursor:pointer;margin-top:8px}
    .err{background:rgba(220,38,38,.15);color:#FCA5A5;padding:10px 12px;border-radius:10px;margin-bottom:14px;font-size:.9rem}
    .rules{font-size:.8rem;color:#6B7280;margin:0 0 14px;line-height:1.45}
    .ok{color:#2ED9A0}.bad{color:#6B7280}
  </style>
</head>
<body>
  <form class="card" method="POST" action="/auth/reset-password" id="form">
    <h1>${t.title}</h1>
    <p>${t.message}</p>
    ${errorMessage ? `<div class="err">${errorMessage}</div>` : ''}
    <input type="hidden" name="token" value="${safeToken}" />
    <label for="password">${t.labelPassword}</label>
    <input id="password" name="password" type="password" required minlength="8" autocomplete="new-password" />
    <label for="confirm">${t.labelConfirm}</label>
    <input id="confirm" name="confirm" type="password" required minlength="8" autocomplete="new-password" />
    <div class="rules" id="rules">
      <div data-rule="len">${t.ruleLen}</div>
      <div data-rule="upper">${t.ruleUpper}</div>
      <div data-rule="num">${t.ruleNum}</div>
      <div data-rule="special">${t.ruleSpecial}</div>
    </div>
    <button type="submit">${t.btnSubmit}</button>
  </form>
  <script>
    var pwd = document.getElementById('password');
    var confirm = document.getElementById('confirm');
    var form = document.getElementById('form');
    function paint() {
      var v = pwd.value || '';
      var map = {
        len: v.length >= 8,
        upper: /[A-Z]/.test(v),
        num: /\\d/.test(v),
        special: /[@#$*]/.test(v)
      };
      Object.keys(map).forEach(function (k) {
        var el = document.querySelector('[data-rule="' + k + '"]');
        if (el) el.className = map[k] ? 'ok' : 'bad';
      });
    }
    pwd.addEventListener('input', paint);
    form.addEventListener('submit', function (e) {
      var v = pwd.value || '';
      var ok = v.length >= 8 && /[A-Z]/.test(v) && /\\d/.test(v) && /[@#$*]/.test(v);
      if (!ok) { e.preventDefault(); alert('${t.alertInvalid.replace(/'/g, "\\'")}'); return; }
      if (v !== confirm.value) { e.preventDefault(); alert('${t.alertMismatch.replace(/'/g, "\\'")}'); }
    });
    paint();
  </script>
</body>
</html>`;
}
//# sourceMappingURL=resetPasswordPage.js.map