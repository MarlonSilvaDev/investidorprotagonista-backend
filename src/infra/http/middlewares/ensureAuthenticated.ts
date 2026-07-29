import { Request, Response, NextFunction } from 'express';
import { supabase } from '../../database/supabase';

export async function ensureAuthenticated(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    return response.status(401).json({ message: 'Token missing' });
  }

  const [, token] = authHeader.split(' ');

  if (!token) {
    return response.status(401).json({ message: 'Token missing' });
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return response.status(401).json({ message: 'Invalid token' });
    }

    request.user = {
      id: data.user.id,
    };

    return next();
  } catch {
    return response.status(401).json({ message: 'Invalid token' });
  }
}
