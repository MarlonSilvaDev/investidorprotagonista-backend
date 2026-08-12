import axios from 'axios';

export class BrapiService {
  private static baseUrl = 'https://brapi.dev/api';
  private static token = process.env.BRAPI_TOKEN;

  static async getQuote(tickers: string[]) {
    try {
      const symbols = tickers.join(',');
      const response = await axios.get(`${this.baseUrl}/quote/${symbols}`, {
        params: { token: this.token }
      });
      return response.data.results;
    } catch (error) {
      console.error('Brapi Quote Error:', error);
      throw new Error('Failed to fetch B3 quotes');
    }
  }

  static async getDividends(ticker: string) {
    try {
      const response = await axios.get(`${this.baseUrl}/quote/${ticker}`, {
        params: { 
          token: this.token,
          dividends: true
        }
      });
      return response.data.results[0]?.dividendsData || [];
    } catch (error) {
      console.error('Brapi Dividends Error:', error);
      throw new Error('Failed to fetch dividends');
    }
  }
}
