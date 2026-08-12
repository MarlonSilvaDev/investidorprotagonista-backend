import { Router, Request, Response, NextFunction } from 'express';
import { AnalyticsController } from '../modules/analytics/AnalyticsController';
import { supabase } from '../config/supabase';

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      request.user = { id: data.user.id } as any;
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
