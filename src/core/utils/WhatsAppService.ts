import { sendWhatsApp } from './NotifyGwService';

/**
 * Wrapper de compatibilidade — redireciona para NotifyGwService.
 * Mantém a interface estática para não quebrar chamadas existentes
 * em IntegrationController e outros módulos.
 */
export class WhatsAppService {
  static async sendMessage(to: string, message: string): Promise<void> {
    const result = await sendWhatsApp(to, message);
    if (!result.ok) {
      console.error('[WhatsAppService] Falha ao enviar via NotifyGW:', result.error);
    }
  }

  static async sendAssetAlert(to: string, asset: string, price: number, change: number): Promise<void> {
    const message =
      `📊 *Informativo de Ativo*\n\n` +
      `O ativo *${asset}* está cotado a *R$ ${price.toFixed(2)}* ` +
      `(${change > 0 ? '📈' : '📉'} ${change.toFixed(2)}%).`;
    await this.sendMessage(to, message);
  }
}
