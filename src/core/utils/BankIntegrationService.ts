import axios from 'axios';

export class BankIntegrationService {
  private static baseUrl = 'https://api.pluggy.ai';
  private static clientId = process.env.PLUGGY_CLIENT_ID;
  private static clientSecret = process.env.PLUGGY_CLIENT_SECRET;

  private static async getAccessToken() {
    const response = await axios.post(`${this.baseUrl}/auth`, {
      clientId: this.clientId,
      clientSecret: this.clientSecret
    });
    return response.data.apiKey;
  }

  static async createConnectToken() {
    const token = await this.getAccessToken();
    const response = await axios.post(`${this.baseUrl}/connect_token`, {}, {
      headers: { 'X-API-KEY': token }
    });
    return response.data.accessToken;
  }

  static async getAccounts(itemId: string) {
    const token = await this.getAccessToken();
    const response = await axios.get(`${this.baseUrl}/accounts`, {
      params: { itemId },
      headers: { 'X-API-KEY': token }
    });
    return response.data.results;
  }

  static async getTransactions(accountId: string) {
    const token = await this.getAccessToken();
    const response = await axios.get(`${this.baseUrl}/transactions`, {
      params: { accountId },
      headers: { 'X-API-KEY': token }
    });
    return response.data.results;
  }

  static async getInvestments(itemId: string) {
    const token = await this.getAccessToken();
    const response = await axios.get(`${this.baseUrl}/investments`, {
      params: { itemId },
      headers: { 'X-API-KEY': token }
    });
    return response.data.results;
  }
}
