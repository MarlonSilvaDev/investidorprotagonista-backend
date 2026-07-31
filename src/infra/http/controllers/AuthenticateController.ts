import { Request, Response } from 'express';
import { supabaseAdmin } from '../../database/supabase';
import {
  signAuthMailToken,
  verifyAuthMailToken,
} from '../../../core/utils/AuthTokenService';
import { isValidEmail, validatePassword } from '../../../core/utils/AuthValidation';
import {
  sendConfirmationEmail,
  sendPasswordResetEmail,
} from '../../../core/utils/MailService';
import { resolveLocale } from '../../../core/utils/i18n';
import { renderEmailConfirmedPage } from '../pages/emailConfirmedPage';
import { renderEmailLinkErrorPage } from '../pages/emailLinkErrorPage';
import { renderResetPasswordPage } from '../pages/resetPasswordPage';

function backendUrl(): string {
  return (
    process.env.BACKEND_URL ||
    `http://localhost:${process.env.PORT || 3000}`
  ).replace(/\/$/, '');
}

function frontendLoginUrl(): string {
  const base = (process.env.FRONTEND_URL || 'http://localhost:8080').replace(
    /\/$/,
    ''
  );
  return `${base}/login`;
}

async function getProfileByUserId(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, name, email_registrado, provider_type')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data;
}

async function getProfileByEmail(email: string) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, name, email_registrado, provider_type')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data;
}

export class AuthenticateController {
  async register(request: Request, response: Response) {
    const email = String(request.body.email || '')
      .trim()
      .toLowerCase();
    const password = String(request.body.password || '');
    const name = String(request.body.name || '').trim();

    if (!isValidEmail(email)) {
      return response.status(400).json({ message: 'E-mail inválido' });
    }
    if (!name) {
      return response.status(400).json({ message: 'Nome é obrigatório' });
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      return response.status(400).json({ message: passwordError });
    }

    // Auth do Supabase sem fluxo de e-mail dele.
    // O gate de acesso é profiles.email_registrado (nosso backend).
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (error || !data.user) {
      return response.status(400).json({
        message: error?.message ?? 'Não foi possível criar a conta',
      });
    }

    // Garante flag false (trigger já cria assim; reforço idempotente).
    await supabaseAdmin
      .from('profiles')
      .update({ email_registrado: false, name, email })
      .eq('id', data.user.id);

    const locale = resolveLocale(request.body.locale);

    const token = signAuthMailToken({
      sub: data.user.id,
      email,
      type: 'email_confirm',
    });
    const confirmUrl = `${backendUrl()}/auth/confirm-email?token=${encodeURIComponent(token)}`;

    try {
      await sendConfirmationEmail({ to: email, name, confirmUrl, locale });
    } catch (mailError) {
      console.error('[auth/register] falha ao enviar e-mail', mailError);
      return response.status(500).json({
        message:
          'Conta criada, mas falhou o envio do e-mail de confirmação. Tente reenviar.',
        user_id: data.user.id,
      });
    }

    return response.status(201).json({
      id: data.user.id,
      email,
      requires_email_confirmation: true,
      provider_type: 'email',
      message:
        'Cadastro realizado. Enviamos um e-mail para você confirmar a conta.',
    });
  }

  async confirmEmail(request: Request, response: Response) {
    const token = String(request.query.token || '');
    try {
      const payload = verifyAuthMailToken(token);
      if (payload.type !== 'email_confirm') {
        throw new Error('Token inválido para confirmação');
      }

      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          email_registrado: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payload.sub);

      if (error) {
        throw error;
      }

      return response
        .status(200)
        .type('html')
        .send(renderEmailConfirmedPage({ loginUrl: frontendLoginUrl(), locale: request.query.locale as any }));
    } catch {
      return response.status(400).type('html').send(
        renderEmailLinkErrorPage({
          loginUrl: frontendLoginUrl(),
          description:
            'O link de confirmação é inválido ou já expirou. Solicite um novo e-mail pelo app.',
          locale: request.query.locale as any,
        })
      );
    }
  }

  async login(request: Request, response: Response) {
    const email = String(request.body.email || '')
      .trim()
      .toLowerCase();
    const password = String(request.body.password || '');

    if (!isValidEmail(email)) {
      return response.status(400).json({ message: 'E-mail inválido' });
    }
    if (!password) {
      return response.status(400).json({ message: 'Senha é obrigatória' });
    }

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return response.status(400).json({
        message: error?.message ?? 'E-mail ou senha inválidos',
      });
    }

    const profile = await getProfileByUserId(data.user.id);
    if (!profile?.email_registrado) {
      return response.status(403).json({
        message:
          'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.',
      });
    }

    return response.json({
      user: data.user,
      token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
      provider_type: profile?.provider_type ?? 'email',
    });
  }

  async forgotPassword(request: Request, response: Response) {
    const email = String(request.body.email || '')
      .trim()
      .toLowerCase();

    if (!isValidEmail(email)) {
      return response.status(400).json({ message: 'E-mail inválido' });
    }

    const generic = {
      message:
        'Se o e-mail estiver cadastrado, enviaremos um link para redefinir a senha.',
    };

    // Sem generateLink / e-mail do Supabase — só nosso SMTP.
    const profile = await getProfileByEmail(email);
    if (!profile) {
      return response.json(generic);
    }

    // Bloqueia recuperação de senha para contas Google
    if (profile.provider_type === 'google') {
      const locale = resolveLocale(request.body.locale);
      const messages: Record<string, string> = {
        en: 'Password recovery is not available for accounts registered with Google. Please log in using Google Sign-In.',
        es: 'La recuperación de contraseña no está disponible para cuentas registradas con Google. Por favor, inicia sesión usando Google Sign-In.',
      };
      return response.json({
        message: messages[locale] ?? 'Recuperação de senha não disponível para contas cadastradas pelo Google. Faça login utilizando o Google Sign-In.',
        provider_type: 'google',
      });
    }

    const locale = resolveLocale(request.body.locale);

    const token = signAuthMailToken(
      {
        sub: profile.id,
        email,
        type: 'password_reset',
      },
      '1h'
    );
    const resetUrl = `${backendUrl()}/auth/reset-password?token=${encodeURIComponent(token)}&locale=${encodeURIComponent(locale)}`;

    try {
      await sendPasswordResetEmail({
        to: email,
        name: profile.name ?? undefined,
        resetUrl,
        locale,
      });
    } catch (mailError) {
      console.error('[auth/forgot-password] falha ao enviar e-mail', mailError);
      return response.status(500).json({
        message: 'Não foi possível enviar o e-mail. Tente novamente.',
      });
    }

    return response.json(generic);
  }

  async resetPasswordForm(request: Request, response: Response) {
    const token = String(request.query.token || '');
    try {
      const payload = verifyAuthMailToken(token);
      if (payload.type !== 'password_reset') {
        throw new Error('invalid');
      }
      return response.status(200).type('html').send(
        renderResetPasswordPage({
          token,
          loginUrl: frontendLoginUrl(),
          locale: request.query.locale as any,
        })
      );
    } catch {
      return response.status(400).type('html').send(
        renderEmailLinkErrorPage({
          loginUrl: frontendLoginUrl(),
          description:
            'O link de redefinição de senha é inválido ou já expirou.',
          locale: request.query.locale as any,
        })
      );
    }
  }

  async resetPassword(request: Request, response: Response) {
    const token = String(request.body.token || '');
    const password = String(request.body.password || '');
    const confirm = String(request.body.confirm || '');

    const renderError = (message: string) =>
      response.status(400).type('html').send(
        renderResetPasswordPage({
          token,
          errorMessage: message,
          loginUrl: frontendLoginUrl(),
          locale: request.body.locale,
        })
      );

    try {
      const payload = verifyAuthMailToken(token);
      if (payload.type !== 'password_reset') {
        throw new Error('Token inválido');
      }

      if (password !== confirm) {
        return renderError('As senhas não coincidem');
      }

      const passwordError = validatePassword(password);
      if (passwordError) {
        return renderError(passwordError);
      }

      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        payload.sub,
        { password }
      );
      if (error) {
        return renderError(error.message);
      }

      return response.status(200).type('html').send(
        renderResetPasswordPage({
          token,
          success: true,
          loginUrl: frontendLoginUrl(),
          locale: request.body.locale,
        })
      );
    } catch {
      return response.status(400).type('html').send(
        renderEmailLinkErrorPage({
          loginUrl: frontendLoginUrl(),
          description:
            'O link de redefinição de senha é inválido ou já expirou.',
          locale: request.body.locale,
        })
      );
    }
  }

  async changePassword(request: Request, response: Response) {
    const currentPassword = String(request.body.currentPassword || '');
    const newPassword = String(request.body.newPassword || '');

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return response.status(400).json({ message: passwordError });
    }
    if (!currentPassword) {
      return response.status(400).json({ message: 'Informe a senha atual' });
    }

    const userId = request.user?.id;
    if (!userId) {
      return response.status(401).json({ message: 'Não autenticado' });
    }

    // Verifica tipo de cadastro
    const profile = await getProfileByUserId(userId);
    if (profile?.provider_type === 'google') {
      const locale = resolveLocale(request.body.locale);
      const messages: Record<string, string> = {
        en: 'Password change is not available for accounts registered with Google.',
        es: 'No es posible cambiar la contraseña para cuentas registradas con Google.',
      };
      return response.status(403).json({
        message: messages[locale] ?? 'Troca de senha não disponível para contas cadastradas pelo Google.',
        provider_type: 'google',
      });
    }

    const { data: userData, error: userError } =
      await supabaseAdmin.auth.admin.getUserById(userId);
    if (userError || !userData.user?.email) {
      return response.status(400).json({ message: 'Usuário não encontrado' });
    }

    const email = userData.user.email;
    const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (signInError) {
      return response.status(400).json({ message: 'Senha atual incorreta' });
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });
    if (error) {
      return response.status(400).json({ message: error.message });
    }

    return response.json({ message: 'Senha alterada com sucesso' });
  }

  async google(request: Request, response: Response) {
    const { id_token: idToken, access_token: accessToken } = request.body;

    if (!idToken) {
      return response.status(400).json({ message: 'id_token is required' });
    }

    const { data, error } = await supabaseAdmin.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
      access_token: accessToken,
    });

    if (error || !data.user) {
      return response.status(400).json({ message: error?.message ?? 'Falha no Google' });
    }

    // Verifica se já existe perfil com este e-mail
    const existingProfile = await getProfileByEmail(data.user.email);

    if (existingProfile && existingProfile.provider_type === 'google') {
      // Já é conta Google: apenas faz login (atualiza flags)
      await supabaseAdmin
        .from('profiles')
        .update({
          email_registrado: true,
          email: data.user.email,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.user.id);
    } else if (existingProfile && existingProfile.provider_type === 'email') {
      // Tem conta por email: converte para Google (vincula)
      await supabaseAdmin
        .from('profiles')
        .update({
          email_registrado: true,
          email: data.user.email,
          provider_type: 'google',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingProfile.id);
    } else {
      // Novo usuário Google: o trigger já cria o profile, apenas atualiza flags
      await supabaseAdmin
        .from('profiles')
        .update({
          email_registrado: true,
          provider_type: 'google',
          email: data.user.email,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.user.id);
    }

    return response.json({
      user: data.user,
      token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
      provider_type: 'google',
    });
  }

  async refresh(request: Request, response: Response) {
    const { refresh_token: refreshToken } = request.body;

    if (!refreshToken) {
      return response.status(400).json({ message: 'refresh_token is required' });
    }

    const { data, error } = await supabaseAdmin.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session || !data.user) {
      return response.status(401).json({
        message: error?.message ?? 'Unable to refresh session',
      });
    }

    const profile = await getProfileByUserId(data.user.id);
    if (!profile?.email_registrado) {
      return response.status(403).json({
        message: 'Confirme seu e-mail antes de continuar.',
      });
    }

    return response.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      token: data.session.access_token,
      user: data.user,
      provider_type: profile?.provider_type ?? 'email',
    });
  }
}
