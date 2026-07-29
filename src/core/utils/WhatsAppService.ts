import axios from 'axios';

export class WhatsAppService {
  private static apiUrl = process.env.WHATSAPP_API_URL;
  private static apiKey = process.env.WHATSAPP_API_KEY;

  static async sendMessage(to: String, message: string) {
    try {
      // Exemplo usando Evolution API ou Twilio
      await axios.post(`${this.apiUrl}/message/sendText`, {
        number: to,
        text: message
      }, {
        headers: { 'apikey': this.apiKey }
      });
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error);
    }
  }

  static async sendAssetAlert(to: string, asset: string, price: number, change: number) {
    const message = `📊 *Informativo de Ativo*\n\nO ativo *${asset}* está cotado a *R$ ${price.toFixed(2)}* (${change > 0 ? '📈' : '📉'} ${change.toFixed(2)}%).`;
    await this.sendMessage(to, message);
  }
}
