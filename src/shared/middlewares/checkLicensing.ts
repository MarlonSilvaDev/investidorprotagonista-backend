import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../../config/supabase';

const TRIAL_DAYS = 7;

/** Lista dos 3 planos oficiais suportados */
export const VALID_PLANS = ['free', 'pro_usuario', 'pro_empresa'] as const;
export type OfficialPlanType = 'free' | 'pro_usuario' | 'pro_empresa';

/** Normaliza uma string de plano para um dos 3 planos oficiais */
export function normalizePlan(plan?: string, userType?: string): OfficialPlanType {
  if (userType === 'empresa') return 'pro_empresa';
  if (!plan) return 'free';
  const p = plan.toLowerCase().trim();
  if (p === 'pro_empresa') return 'pro_empresa';
  if (p === 'pro_usuario' || p === 'pro') return 'pro_usuario';
  return 'free';
}

export type SubscriptionOrigin = 'free' | 'app_store' | 'google_play' | 'stripe';

export async function checkLicensing(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const { id: userId } = request.user;

  // Buscar status da licença, origem do plano, tipo de usuário e plano no Supabase
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('user_type, plan, subscription_status, subscription_origin, subscription_expires_at, trial_started_at')
    .eq('id', userId)
    .maybeSingle?.() ?? { data: null, error: null };

  if (error || !profile) {
    return response.status(403).json({
      message: 'Perfil de usuário não encontrado ou falha na verificação de licença',
    });
  }

  const normalizedPlan = normalizePlan(profile.plan, profile.user_type);
  const now = new Date();

  // Calcular data de expiração se subscription_expires_at for nulo mas houver trial_started_at
  let expiresAt: Date | null = profile.subscription_expires_at
    ? new Date(profile.subscription_expires_at)
    : null;

  if (!expiresAt && profile.trial_started_at) {
    const trialStart = new Date(profile.trial_started_at);
    expiresAt = new Date(trialStart.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  }

  // 1. Verificar se a licença expirou
  if (expiresAt && now > expiresAt) {
    if (profile.subscription_status !== 'expired') {
      await supabaseAdmin
        .from('profiles')
        .update({ subscription_status: 'expired' })
        .eq('id', userId);
    }

    return response.status(402).json({
      code: 'LICENSE_EXPIRED',
      message: 'Sua licença ou período de avaliação expirou. Por favor, assine um plano para continuar.',
      expires_at: expiresAt.toISOString(),
      plan: normalizedPlan,
      user_type: profile.user_type,
    });
  }

  // 2. Verificar se a assinatura foi cancelada
  if (profile.subscription_status === 'canceled') {
    return response.status(402).json({
      code: 'SUBSCRIPTION_CANCELED',
      message: 'Sua assinatura foi cancelada. Por favor, reative para continuar.',
      plan: normalizedPlan,
      user_type: profile.user_type,
    });
  }

  // 3. Para planos pagos (não-free), validar a origem da assinatura se não estiver em trial
  if (normalizedPlan !== 'free' && profile.subscription_status !== 'trial') {
    const validPaidOrigins = ['app_store', 'google_play', 'stripe'];
    if (!profile.subscription_origin || !validPaidOrigins.includes(profile.subscription_origin)) {
      return response.status(403).json({
        code: 'INVALID_SUBSCRIPTION_ORIGIN',
        message: 'Origem da assinatura não identificada ou inválida (esperado App Store, Google Play ou Stripe).',
        plan: normalizedPlan,
        user_type: profile.user_type,
      });
    }
  }

  // Se chegou aqui, a licença e assinatura são válidas
  return next();
}

/** Middleware para exigir nível de plano específico */
export function requirePlan(minimumPlan: 'pro_usuario' | 'pro_empresa') {
  return async (request: Request, response: Response, next: NextFunction) => {
    const userPlan = normalizePlan(request.user?.plan, request.user?.userType);
    if (userPlan === 'free') {
      return response.status(403).json({
        code: 'FEATURE_LOCKED',
        message: 'Recurso exclusivo dos planos Pro. Faça upgrade para continuar.',
        required_plan: minimumPlan,
        current_plan: userPlan,
      });
    }
    if (minimumPlan === 'pro_empresa' && userPlan !== 'pro_empresa') {
      return response.status(403).json({
        code: 'COMPANY_FEATURE_LOCKED',
        message: 'Recurso exclusivo do plano Pro Empresa. Faça upgrade para continuar.',
        required_plan: 'pro_empresa',
        current_plan: userPlan,
      });
    }
    return next();
  };
}

