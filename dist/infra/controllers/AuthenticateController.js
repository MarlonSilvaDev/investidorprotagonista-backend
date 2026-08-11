"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticateController = void 0;
const supabase_1 = require("../database/supabase");
const AuthTokenService_1 = require("../../core/utils/AuthTokenService");
const AuthValidation_1 = require("../../core/utils/AuthValidation");
const MailService_1 = require("../../core/utils/MailService");
const SmsService_1 = require("../../core/utils/SmsService");
const i18n_1 = require("../../core/utils/i18n");
const emailConfirmedPage_1 = require("../http/pages/emailConfirmedPage");
const emailLinkErrorPage_1 = require("../http/pages/emailLinkErrorPage");
const resetPasswordPage_1 = require("../http/pages/resetPasswordPage");
function backendUrl() {
    return (process.env.BACKEND_URL ||
        `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, '');
}
function frontendLoginUrl() {
    const base = (process.env.FRONTEND_URL || 'http://localhost:8080').replace(/\/$/, '');
    return `${base}/login`;
}
async function getProfileByUserId(userId) {
    const { data, error } = await supabase_1.supabaseAdmin
        .from('profiles')
        .select('id, email, name, email_registrado, provider_type, role, cpf')
        .eq('id', userId)
        .maybeSingle();
    if (error) {
        throw error;
    }
    return data;
}
async function getProfileByEmail(email) {
    if (!email)
        return null;
    const { data, error } = await supabase_1.supabaseAdmin
        .from('profiles')
        .select('id, email, name, phone_number, email_registrado, provider_type, role, cpf, document_number')
        .eq('email', email)
        .maybeSingle();
    if (error) {
        throw error;
    }
    return data;
}
async function getProfileByDocument(documentNumber, cpf) {
    const doc = documentNumber || cpf;
    if (!doc)
        return null;
    const filters = [];
    if (documentNumber)
        filters.push(`document_number.eq.${documentNumber}`);
    if (cpf)
        filters.push(`cpf.eq.${cpf}`);
    if (documentNumber)
        filters.push(`cpf.eq.${documentNumber}`);
    const uniqueFilters = [...new Set(filters)].join(',');
    const { data, error } = await supabase_1.supabaseAdmin
        .from('profiles')
        .select('id, email, name, email_registrado, provider_type, role, cpf, document_number')
        .or(uniqueFilters)
        .maybeSingle();
    if (error) {
        throw error;
    }
    return data;
}
class AuthenticateController {
    async register(request, response) {
        const email = String(request.body.email || '')
            .trim()
            .toLowerCase();
        const password = String(request.body.password || '');
        const name = String(request.body.name || '').trim();
        const phone = String(request.body.phone || '').trim();
        const nickname = String(request.body.nickname || '').trim();
        const userType = String(request.body.userType || 'usuario').trim().toLowerCase();
        const verificationChannel = (request.body.verificationChannel || request.body.channel || 'whatsapp').toString().toLowerCase();
        const country = String(request.body.country || 'BR').trim().toUpperCase();
        const documentType = String(request.body.documentType || (userType === 'empresa' ? 'cnpj' : 'cpf')).trim().toLowerCase();
        const rawDoc = String(request.body.documentNumber || request.body.cpf || request.body.cnpj || '');
        const isBrasil = country === 'BR';
        const documentNumber = isBrasil
            ? (userType === 'empresa' ? (0, AuthValidation_1.normalizeCnpj)(rawDoc) : (0, AuthValidation_1.normalizeCpf)(rawDoc))
            : rawDoc.trim();
        const cpf = isBrasil && userType === 'usuario' ? documentNumber : (0, AuthValidation_1.normalizeCpf)(rawDoc);
        if (!(0, AuthValidation_1.isValidEmail)(email)) {
            return response.status(400).json({ message: 'E-mail inválido' });
        }
        if (!name) {
            return response.status(400).json({ message: 'Nome é obrigatório' });
        }
        if (!phone) {
            return response.status(400).json({ message: 'Celular é obrigatório' });
        }
        const docError = (0, AuthValidation_1.validateDocument)(country, userType, documentNumber);
        if (docError) {
            return response.status(400).json({ message: docError });
        }
        const passwordError = (0, AuthValidation_1.validatePassword)(password);
        if (passwordError) {
            return response.status(400).json({ message: passwordError });
        }
        // 1. Valida se o e-mail já possui cadastro (1 conta por usuário)
        const existingByEmail = await getProfileByEmail(email);
        if (existingByEmail) {
            return response.status(409).json({
                message: 'Já existe uma conta cadastrada com este e-mail',
            });
        }
        // 2. Valida se o documento (CPF / CNPJ / Documento) já possui cadastro
        if (documentNumber || cpf) {
            const existingByDoc = await getProfileByDocument(documentNumber, cpf || undefined);
            if (existingByDoc) {
                const docLabel = country === 'BR' ? (userType === 'empresa' ? 'CNPJ' : 'CPF') : 'documento';
                return response.status(409).json({
                    message: `Já existe uma conta cadastrada com este ${docLabel}`,
                });
            }
        }
        // Auth do Supabase sem fluxo de e-mail dele.
        // O gate de acesso é profiles.email_registrado (nosso backend).
        const { data, error } = await supabase_1.supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name, phone, nickname, cpf, country, userType, documentType, documentNumber },
        });
        if (error || !data.user) {
            return response.status(400).json({
                message: error?.message ?? 'Não foi possível criar a conta',
            });
        }
        // 3. Tenta salvar o perfil em public.profiles
        const profilePayload = {
            id: data.user.id,
            email_registrado: false,
            name,
            email,
            phone_number: phone,
            nickname,
            user_type: userType,
            country,
            document_type: documentType,
            document_number: documentNumber,
            cpf: cpf || (country === 'BR' && userType === 'usuario' ? documentNumber : null),
        };
        let { error: profileError } = await supabase_1.supabaseAdmin
            .from('profiles')
            .upsert(profilePayload, { onConflict: 'id' });
        // Fallback: Se o banco do Supabase remoto ainda não tiver as colunas estendidas
        if (profileError && /column|schema|does not exist/i.test(profileError.message || '')) {
            console.warn('[REGISTER WARNING] Colunas estendidas não encontradas em profiles, tentando payload base:', profileError.message);
            const basePayload = {
                id: data.user.id,
                email_registrado: false,
                name,
                email,
                phone_number: phone,
                nickname,
                cpf: cpf || (country === 'BR' && userType === 'usuario' ? documentNumber : null),
            };
            const fallback = await supabase_1.supabaseAdmin
                .from('profiles')
                .upsert(basePayload, { onConflict: 'id' });
            profileError = fallback.error;
        }
        if (profileError) {
            console.error('[REGISTER PROFILE ERROR]', profileError);
            await supabase_1.supabaseAdmin.auth.admin.deleteUser(data.user.id);
            const isDuplicate = profileError.code === '23505' ||
                /cpf|document|email|unique/i.test(profileError.message || '');
            return response.status(isDuplicate ? 409 : 400).json({
                message: isDuplicate
                    ? 'Já existe uma conta cadastrada com estes dados (e-mail ou documento)'
                    : profileError.message || 'Não foi possível criar a conta',
            });
        }
        // Gera código SMS (OTP)
        const smsCode = Math.floor(100000 + Math.random() * 900000).toString();
        // Salva no banco para validação posterior
        await supabase_1.supabaseAdmin.from('sms_verifications').insert({
            email,
            phone,
            code: smsCode,
            channel: verificationChannel,
        });
        // Envia o código através do canal selecionado (whatsapp, telegram, signal, sms)
        await (0, SmsService_1.sendVerificationCode)({
            to: phone,
            code: smsCode,
            channel: verificationChannel,
            locale: request.body.locale,
        });
        return response.status(201).json({
            id: data.user.id,
            email,
            cpf,
            requires_email_confirmation: false,
            requires_sms_verification: true,
            provider_type: 'email',
            message: 'Cadastro realizado. Enviamos um código por SMS para você confirmar a conta.',
        });
    }
    async verifySms(request, response) {
        const email = String(request.body.email || '').trim().toLowerCase();
        const code = String(request.body.code || '').trim();
        if (!email || !code) {
            return response.status(400).json({ message: 'E-mail e código são obrigatórios' });
        }
        // Busca o código mais recente não expirado
        const { data: verification, error } = await supabase_1.supabaseAdmin
            .from('sms_verifications')
            .select('*')
            .eq('email', email)
            .eq('code', code)
            .eq('verified', false)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (error || !verification) {
            return response.status(400).json({ message: 'Código inválido ou expirado' });
        }
        // Marca como verificado
        await supabase_1.supabaseAdmin
            .from('sms_verifications')
            .update({ verified: true })
            .eq('id', verification.id);
        // Busca o perfil do usuário
        const profile = await getProfileByEmail(email);
        if (!profile) {
            return response.status(404).json({ message: 'Usuário não encontrado' });
        }
        // Ativa a conta
        await supabase_1.supabaseAdmin
            .from('profiles')
            .update({ email_registrado: true })
            .eq('id', profile.id);
        return response.json({
            message: 'Celular validado com sucesso! Agora você pode entrar na sua conta.',
            user: {
                id: profile.id,
                email: profile.email,
                name: profile.name,
            },
            // O front deve redirecionar para o login após esta mensagem
            requires_login: true
        });
    }
    async sendVerificationCode(request, response) {
        const email = String(request.body.email || '').trim().toLowerCase();
        const channel = (request.body.verificationChannel || request.body.channel || 'whatsapp')
            .toString()
            .toLowerCase();
        if (!email) {
            return response.status(400).json({ message: 'E-mail é obrigatório' });
        }
        const profile = await getProfileByEmail(email);
        const { data: recentVerif } = await supabase_1.supabaseAdmin
            .from('sms_verifications')
            .select('phone')
            .eq('email', email)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        const phone = profile?.phone_number || recentVerif?.phone;
        if (!phone) {
            return response.status(404).json({ message: 'Telefone do usuário não encontrado' });
        }
        const smsCode = Math.floor(100000 + Math.random() * 900000).toString();
        await supabase_1.supabaseAdmin.from('sms_verifications').insert({
            email,
            phone,
            code: smsCode,
            channel,
        });
        await (0, SmsService_1.sendVerificationCode)({
            to: phone,
            code: smsCode,
            channel,
            locale: request.body.locale,
        });
        const channelLabels = {
            whatsapp: 'WhatsApp',
            sms: 'SMS',
            telegram: 'Telegram',
            signal: 'Signal',
        };
        return response.json({
            message: `Código enviado via ${channelLabels[channel] || channel}!`,
            channel,
        });
    }
    async confirmEmail(request, response) {
        const token = String(request.query.token || '');
        try {
            const payload = (0, AuthTokenService_1.verifyAuthMailToken)(token);
            if (payload.type !== 'email_confirm') {
                throw new Error('Token inválido para confirmação');
            }
            const { error } = await supabase_1.supabaseAdmin
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
                .send((0, emailConfirmedPage_1.renderEmailConfirmedPage)({ loginUrl: frontendLoginUrl(), locale: request.query.locale }));
        }
        catch {
            return response.status(400).type('html').send((0, emailLinkErrorPage_1.renderEmailLinkErrorPage)({
                loginUrl: frontendLoginUrl(),
                description: 'O link de confirmação é inválido ou já expirou. Solicite um novo e-mail pelo app.',
                locale: request.query.locale,
            }));
        }
    }
    async login(request, response) {
        const email = String(request.body.email || '')
            .trim()
            .toLowerCase();
        const password = String(request.body.password || '');
        if (!(0, AuthValidation_1.isValidEmail)(email)) {
            return response.status(400).json({ message: 'E-mail inválido' });
        }
        if (!password) {
            return response.status(400).json({ message: 'Senha é obrigatória' });
        }
        const { data, error } = await supabase_1.supabaseAdmin.auth.signInWithPassword({
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
                message: 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.',
            });
        }
        return response.json({
            user: data.user,
            token: data.session?.access_token,
            refresh_token: data.session?.refresh_token,
            provider_type: profile?.provider_type ?? 'email',
            role: profile?.role ?? 'padrao',
            cpf: profile?.cpf ?? null,
        });
    }
    async forgotPassword(request, response) {
        const email = String(request.body.email || '')
            .trim()
            .toLowerCase();
        if (!(0, AuthValidation_1.isValidEmail)(email)) {
            return response.status(400).json({ message: 'E-mail inválido' });
        }
        const generic = {
            message: 'Se o e-mail estiver cadastrado, enviaremos um link para redefinir a senha.',
        };
        // Sem generateLink / e-mail do Supabase — só nosso SMTP.
        const profile = await getProfileByEmail(email);
        if (!profile) {
            return response.json(generic);
        }
        // Bloqueia recuperação de senha para contas Google
        if (profile.provider_type === 'google') {
            const locale = (0, i18n_1.resolveLocale)(request.body.locale);
            const messages = {
                en: 'Password recovery is not available for accounts registered with Google. Please log in using Google Sign-In.',
                es: 'La recuperación de contraseña no está disponible para cuentas registradas con Google. Por favor, inicia sesión usando Google Sign-In.',
            };
            return response.json({
                message: messages[locale] ?? 'Recuperação de senha não disponível para contas cadastradas pelo Google. Faça login utilizando o Google Sign-In.',
                provider_type: 'google',
            });
        }
        const locale = (0, i18n_1.resolveLocale)(request.body.locale);
        const token = (0, AuthTokenService_1.signAuthMailToken)({
            sub: profile.id,
            email,
            type: 'password_reset',
        }, '1h');
        const resetUrl = `${backendUrl()}/auth/reset-password?token=${encodeURIComponent(token)}&locale=${encodeURIComponent(locale)}`;
        try {
            await (0, MailService_1.sendPasswordResetEmail)({
                to: email,
                name: profile.name ?? undefined,
                resetUrl,
                locale,
            });
        }
        catch (mailError) {
            console.error('[auth/forgot-password] falha ao enviar e-mail', mailError);
            return response.status(500).json({
                message: 'Não foi possível enviar o e-mail. Tente novamente.',
            });
        }
        return response.json(generic);
    }
    async resetPasswordForm(request, response) {
        const token = String(request.query.token || '');
        try {
            const payload = (0, AuthTokenService_1.verifyAuthMailToken)(token);
            if (payload.type !== 'password_reset') {
                throw new Error('invalid');
            }
            return response.status(200).type('html').send((0, resetPasswordPage_1.renderResetPasswordPage)({
                token,
                loginUrl: frontendLoginUrl(),
                locale: request.query.locale,
            }));
        }
        catch {
            return response.status(400).type('html').send((0, emailLinkErrorPage_1.renderEmailLinkErrorPage)({
                loginUrl: frontendLoginUrl(),
                description: 'O link de redefinição de senha é inválido ou já expirou.',
                locale: request.query.locale,
            }));
        }
    }
    async resetPassword(request, response) {
        const token = String(request.body.token || '');
        const password = String(request.body.password || '');
        const confirm = String(request.body.confirm || '');
        const renderError = (message) => response.status(400).type('html').send((0, resetPasswordPage_1.renderResetPasswordPage)({
            token,
            errorMessage: message,
            loginUrl: frontendLoginUrl(),
            locale: request.body.locale,
        }));
        try {
            const payload = (0, AuthTokenService_1.verifyAuthMailToken)(token);
            if (payload.type !== 'password_reset') {
                throw new Error('Token inválido');
            }
            if (password !== confirm) {
                return renderError('As senhas não coincidem');
            }
            const passwordError = (0, AuthValidation_1.validatePassword)(password);
            if (passwordError) {
                return renderError(passwordError);
            }
            const { error } = await supabase_1.supabaseAdmin.auth.admin.updateUserById(payload.sub, { password });
            if (error) {
                return renderError(error.message);
            }
            return response.status(200).type('html').send((0, resetPasswordPage_1.renderResetPasswordPage)({
                token,
                success: true,
                loginUrl: frontendLoginUrl(),
                locale: request.body.locale,
            }));
        }
        catch {
            return response.status(400).type('html').send((0, emailLinkErrorPage_1.renderEmailLinkErrorPage)({
                loginUrl: frontendLoginUrl(),
                description: 'O link de redefinição de senha é inválido ou já expirou.',
                locale: request.body.locale,
            }));
        }
    }
    async changePassword(request, response) {
        const currentPassword = String(request.body.currentPassword || '');
        const newPassword = String(request.body.newPassword || '');
        const passwordError = (0, AuthValidation_1.validatePassword)(newPassword);
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
            const locale = (0, i18n_1.resolveLocale)(request.body.locale);
            const messages = {
                en: 'Password change is not available for accounts registered with Google.',
                es: 'No es posible cambiar la contraseña para cuentas registradas con Google.',
            };
            return response.status(403).json({
                message: messages[locale] ?? 'Troca de senha não disponível para contas cadastradas pelo Google.',
                provider_type: 'google',
            });
        }
        const { data: userData, error: userError } = await supabase_1.supabaseAdmin.auth.admin.getUserById(userId);
        if (userError || !userData.user?.email) {
            return response.status(400).json({ message: 'Usuário não encontrado' });
        }
        const email = userData.user.email;
        const { error: signInError } = await supabase_1.supabaseAdmin.auth.signInWithPassword({
            email,
            password: currentPassword,
        });
        if (signInError) {
            return response.status(400).json({ message: 'Senha atual incorreta' });
        }
        const { error } = await supabase_1.supabaseAdmin.auth.admin.updateUserById(userId, {
            password: newPassword,
        });
        if (error) {
            return response.status(400).json({ message: error.message });
        }
        return response.json({ message: 'Senha alterada com sucesso' });
    }
    async google(request, response) {
        const { id_token: idToken, access_token: accessToken } = request.body;
        if (!idToken) {
            return response.status(400).json({ message: 'id_token is required' });
        }
        const { data, error } = await supabase_1.supabaseAdmin.auth.signInWithIdToken({
            provider: 'google',
            token: idToken,
            access_token: accessToken,
        });
        if (error || !data.user) {
            return response.status(400).json({ message: error?.message ?? 'Falha no Google' });
        }
        // Verifica se já existe perfil com este e-mail
        const existingProfile = await getProfileByEmail(data.user.email || '');
        if (existingProfile && existingProfile.provider_type === 'google') {
            // Já é conta Google: apenas faz login (atualiza flags)
            await supabase_1.supabaseAdmin
                .from('profiles')
                .update({
                email_registrado: true,
                email: data.user.email,
                updated_at: new Date().toISOString(),
            })
                .eq('id', data.user.id);
        }
        else if (existingProfile && existingProfile.provider_type === 'email') {
            // Tem conta por email: converte para Google (vincula)
            await supabase_1.supabaseAdmin
                .from('profiles')
                .update({
                email_registrado: true,
                email: data.user.email,
                provider_type: 'google',
                updated_at: new Date().toISOString(),
            })
                .eq('id', existingProfile.id);
        }
        else {
            // Novo usuário Google: o trigger já cria o profile, apenas atualiza flags
            await supabase_1.supabaseAdmin
                .from('profiles')
                .update({
                email_registrado: true,
                provider_type: 'google',
                email: data.user.email,
                updated_at: new Date().toISOString(),
            })
                .eq('id', data.user.id);
        }
        const profile = await getProfileByUserId(data.user.id);
        const firstAccess = !profile?.cpf;
        return response.json({
            user: data.user,
            token: data.session?.access_token,
            refresh_token: data.session?.refresh_token,
            provider_type: 'google',
            role: profile?.role ?? 'padrao',
            cpf: profile?.cpf ?? null,
            first_access: firstAccess,
        });
    }
    /**
     * Primeiro acesso Google (sem CPF): grava CPF único na conta autenticada.
     * Contas que já têm CPF não podem alterar por este endpoint.
     */
    async completeCpf(request, response) {
        const userId = request.user?.id;
        if (!userId) {
            return response.status(401).json({ message: 'Não autenticado' });
        }
        const cpf = (0, AuthValidation_1.normalizeCpf)(String(request.body.cpf || ''));
        const cpfError = (0, AuthValidation_1.validateCpf)(cpf);
        if (cpfError) {
            return response.status(400).json({ message: cpfError });
        }
        const profile = await getProfileByUserId(userId);
        if (!profile) {
            return response.status(404).json({ message: 'Usuário não encontrado' });
        }
        if (profile.cpf) {
            return response.status(400).json({
                message: 'Esta conta já possui CPF cadastrado',
                first_access: false,
                cpf: profile.cpf,
            });
        }
        const existingByCpf = await getProfileByDocument(cpf, cpf);
        if (existingByCpf && existingByCpf.id !== userId) {
            return response.status(409).json({
                message: 'Já existe uma conta cadastrada com este CPF',
            });
        }
        const { error } = await supabase_1.supabaseAdmin
            .from('profiles')
            .update({
            cpf,
            updated_at: new Date().toISOString(),
        })
            .eq('id', userId);
        if (error) {
            const isDuplicateCpf = error.code === '23505' || /cpf|unique/i.test(error.message || '');
            return response.status(isDuplicateCpf ? 409 : 400).json({
                message: isDuplicateCpf
                    ? 'Já existe uma conta cadastrada com este CPF'
                    : error.message || 'Não foi possível salvar o CPF',
            });
        }
        return response.json({
            message: 'CPF cadastrado com sucesso',
            cpf,
            first_access: false,
        });
    }
    async refresh(request, response) {
        const { refresh_token: refreshToken } = request.body;
        if (!refreshToken) {
            return response.status(400).json({ message: 'refresh_token is required' });
        }
        const { data, error } = await supabase_1.supabaseAdmin.auth.refreshSession({
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
            role: profile?.role ?? 'padrao',
        });
    }
}
exports.AuthenticateController = AuthenticateController;
//# sourceMappingURL=AuthenticateController.js.map