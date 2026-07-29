import { Router, Request, Response, NextFunction } from 'express';
import { AnalyticsController } from '../controllers/AnalyticsController';
import { supabase } from '../../database/supabase';

const analyticsRoutes = Router();
const analyticsController = new AnalyticsController();

/** Auth opcional: se houver Bearer válido, preenche request.user. */
async function optionalAuth(request: Request, _response: Response, next: NextFunction) {
  const authHeader = request.headers.authorization;
  if (!authHeader) return next();

  const [, token] = authHeader.split(' ');
  if (!token) return next();

  try {
    const { data } = await supabase.auth.getUser(token);
    if (data.user) {
      request.user = { id: data.user.id };
    }
  } catch {
    // Ignora token inválido em analytics.
  }

  return next();
}

analyticsRoutes.post('/events', optionalAuth, (request, response) =>
  analyticsController.track(request, response)
);

export { analyticsRoutes };
