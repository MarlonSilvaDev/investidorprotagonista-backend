import { Request, Response } from 'express';

/**
 * Recebe eventos do app (espelho do Firebase Analytics).
 * Mantém telemetria de negócio no backend sem o front falar com GA direto
 * além do SDK Firebase no device.
 */
export class AnalyticsController {
  async track(request: Request, response: Response) {
    const userId = (request as Request & { user?: { id: string } }).user?.id ?? null;
    const { name, parameters, platform, timestamp } = request.body ?? {};

    if (!name || typeof name !== 'string') {
      return response.status(400).json({ message: 'name is required' });
    }

    // Log estruturado — pode evoluir para tabela analytics_events no Supabase.
    console.info('[analytics]', {
      userId,
      name,
      parameters: parameters ?? {},
      platform: platform ?? 'unknown',
      timestamp: timestamp ?? new Date().toISOString(),
    });

    return response.status(202).json({ accepted: true });
  }
}
