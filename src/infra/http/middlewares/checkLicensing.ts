import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../../database/supabase';

const TRIAL_DAYS = 7;

export async function checkLicensing(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const { id: userId } = request.user;

  // Buscar status da licença, tipo de usuário e plano no Supabase
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('user_type, plan, subscription_status, subscription_expires_at, trial_started_at')
    .eq('id', userId)
    .maybeSingle();

  if (error || !profile) {
    return response.status(403).json({
      message: 'Perfil de usuário não encontrado ou falha na verificação de licença',
    });
  }

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
      plan: profile.plan,
      user_type: profile.user_type,
    });
  }

  // 2. Verificar se a assinatura foi cancelada
  if (profile.subscription_status === 'canceled') {
    return response.status(402).json({
      code: 'SUBSCRIPTION_CANCELED',
      message: 'Sua assinatura foi cancelada. Por favor, reative para continuar.',
      plan: profile.plan,
      user_type: profile.user_type,
    });
  }

  // Se chegou aqui, a licença é válida (trial ativo ou assinatura ativa)
  return next();
}
