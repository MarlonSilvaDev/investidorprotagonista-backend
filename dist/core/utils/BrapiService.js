"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrapiService = void 0;
const axios_1 = __importDefault(require("axios"));
class BrapiService {
    static baseUrl = 'https://brapi.dev/api';
    static token = process.env.BRAPI_TOKEN;
    static async getQuote(tickers) {
        try {
            const symbols = tickers.join(',');
            const response = await axios_1.default.get(`${this.baseUrl}/quote/${symbols}`, {
                params: { token: this.token }
            });
            return response.data.results;
        }
        catch (error) {
            console.error('Brapi Quote Error:', error);
            throw new Error('Failed to fetch B3 quotes');
        }
    }
    static async getDividends(ticker) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/quote/${ticker}`, {
                params: {
                    token: this.token,
                    dividends: true
                }
            });
            return response.data.results[0]?.dividendsData || [];
        }
        catch (error) {
            console.error('Brapi Dividends Error:', error);
            throw new Error('Failed to fetch dividends');
        }
    }
}
exports.BrapiService = BrapiService;
//# sourceMappingURL=BrapiService.js.map