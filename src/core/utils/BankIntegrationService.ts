import axios from 'axios';
import type { AxiosInstance } from 'axios';

export interface PluggyConnectTokenOptions {
  clientUserId?: string;
  webhookUrl?: string;
  itemId?: string;
}

export class BankIntegrationService {
  private static baseUrl = 'https://api.pluggy.ai';
  private static clientId = process.env.PLUGGY_CLIENT_ID;
  private static clientSecret = process.env.PLUGGY_CLIENT_SECRET;

  private static async getApiClient(): Promise<AxiosInstance> {
    const apiKey = await this.getAccessToken();
    return axios.create({
      baseURL: this.baseUrl,
      headers: { 'X-API-KEY': apiKey },
      timeout: 60000,
    });
  }

  private static async getAccessToken() {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('PLUGGY_CLIENT_ID / PLUGGY_CLIENT_SECRET não configurados');
    }
    const response = await axios.post(`${this.baseUrl}/auth`, {
      clientId: this.clientId,
      clientSecret: this.clientSecret,
    });
    return response.data.apiKey as string;
  }

  static async createConnectToken(options: PluggyConnectTokenOptions = {}) {
    const client = await this.getApiClient();
    const body: Record<string, unknown> = {};
    if (options.clientUserId) body.clientUserId = options.clientUserId;
    if (options.webhookUrl) body.webhookUrl = options.webhookUrl;
    if (options.itemId) body.itemId = options.itemId;

    const response = await client.post('/connect_token', body);
    return {
      accessToken: response.data.accessToken as string,
      // Pluggy devolve o connect token em accessToken do connect_token endpoint
      connectToken: (response.data.connectToken ?? response.data.accessToken) as string,
      expiresIn: (response.data.expiresIn as number | undefined) ?? 3600,
    };
  }

  static async getItem(itemId: string) {
    const client = await this.getApiClient();
    const response = await client.get(`/items/${itemId}`);
    return response.data;
  }

  static async refreshItem(itemId: string) {
    const client = await this.getApiClient();
    const response = await client.patch(`/items/${itemId}`, {});
    return response.data;
  }

  static async deleteItem(itemId: string) {
    const client = await this.getApiClient();
    await client.delete(`/items/${itemId}`);
  }

  static async getAccounts(itemId: string) {
    const client = await this.getApiClient();
    const response = await client.get('/accounts', {
      params: { itemId },
    });
    return response.data.results ?? [];
  }

  static async getTransactions(accountId: string, from?: string) {
    const client = await this.getApiClient();
    const params: Record<string, string> = { accountId };
    if (from) params.from = from;
    const response = await client.get('/transactions', { params });
    return response.data.results ?? [];
  }

  static async getInvestments(itemId: string) {
    const client = await this.getApiClient();
    const response = await client.get('/investments', {
      params: { itemId },
    });
    return response.data.results ?? [];
  }

  static async getIdentity(itemId: string) {
    const client = await this.getApiClient();
    try {
      const response = await client.get('/identity', { params: { itemId } });
      return response.data;
    } catch {
      return null;
    }
  }
}
