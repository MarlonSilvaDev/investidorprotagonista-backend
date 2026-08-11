import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../../database/supabase';

/**
 * Exige que o usuário autenticado tenha profiles.role = 'administrador'.
 * Deve ser usado após ensureAuthenticated.
 */
export async function ensureAdmin(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const userId = request.user?.id;
    if (!userId) {
      return response.status(401).json({ message: 'Token missing' });
    }

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      return response.status(500).json({ message: error.message });
    }

    if (!profile || profile.role !== 'administrador') {
      return response.status(403).json({ message: 'Acesso restrito a administradores' });
    }

    if (request.user) {
      request.user.role = 'administrador';
    }
    return next();
  } catch {
    return response.status(500).json({ message: 'Erro ao verificar permissões' });
  }
}
