import { Request, Response, NextFunction } from 'express';
import { supabase } from '../../database/supabase';

export async function checkLicensing(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const { id: userId } = request.user;

  // Buscar status da licença no Supabase
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('subscription_status, subscription_expires_at, trial_started_at')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    return response.status(403).json({
      message: 'User profile not found or licensing check failed',
    });
  }

  const now = new Date();
  const expiresAt = new Date(profile.subscription_expires_at);

  // 1. Verificar se a licença expirou (seja trial ou ativa)
  if (now > expiresAt) {
    // Atualizar status para expired se ainda não estiver
    if (profile.subscription_status !== 'expired') {
      await supabase
        .from('profiles')
        .update({ subscription_status: 'expired' })
        .eq('id', userId);
    }

    return response.status(402).json({
      code: 'LICENSE_EXPIRED',
      message: 'Sua licença ou período de avaliação expirou. Por favor, renove sua assinatura.',
      expires_at: profile.subscription_expires_at,
    });
  }

  // 2. Verificar status da assinatura
  if (profile.subscription_status === 'canceled') {
    return response.status(402).json({
      code: 'SUBSCRIPTION_CANCELED',
      message: 'Sua assinatura foi cancelada. Por favor, reative para continuar.',
    });
  }

  // Se chegou aqui, a licença é válida (trial ativo ou assinatura ativa)
  return next();
}
