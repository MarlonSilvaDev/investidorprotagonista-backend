"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankIntegrationService = void 0;
const axios_1 = __importDefault(require("axios"));
class BankIntegrationService {
    static baseUrl = 'https://api.pluggy.ai';
    static clientId = process.env.PLUGGY_CLIENT_ID;
    static clientSecret = process.env.PLUGGY_CLIENT_SECRET;
    static async getApiClient() {
        const apiKey = await this.getAccessToken();
        return axios_1.default.create({
            baseURL: this.baseUrl,
            headers: { 'X-API-KEY': apiKey },
            timeout: 60000,
        });
    }
    static async getAccessToken() {
        if (!this.clientId || !this.clientSecret) {
            throw new Error('PLUGGY_CLIENT_ID / PLUGGY_CLIENT_SECRET não configurados');
        }
        const response = await axios_1.default.post(`${this.baseUrl}/auth`, {
            clientId: this.clientId,
            clientSecret: this.clientSecret,
        });
        return response.data.apiKey;
    }
    static async createConnectToken(options = {}) {
        const client = await this.getApiClient();
        const body = {};
        if (options.clientUserId)
            body.clientUserId = options.clientUserId;
        if (options.webhookUrl)
            body.webhookUrl = options.webhookUrl;
        if (options.itemId)
            body.itemId = options.itemId;
        const response = await client.post('/connect_token', body);
        return {
            accessToken: response.data.accessToken,
            // Pluggy devolve o connect token em accessToken do connect_token endpoint
            connectToken: (response.data.connectToken ?? response.data.accessToken),
            expiresIn: response.data.expiresIn ?? 3600,
        };
    }
    static async getItem(itemId) {
        const client = await this.getApiClient();
        const response = await client.get(`/items/${itemId}`);
        return response.data;
    }
    static async refreshItem(itemId) {
        const client = await this.getApiClient();
        const response = await client.patch(`/items/${itemId}`, {});
        return response.data;
    }
    static async deleteItem(itemId) {
        const client = await this.getApiClient();
        await client.delete(`/items/${itemId}`);
    }
    static async getAccounts(itemId) {
        const client = await this.getApiClient();
        const response = await client.get('/accounts', {
            params: { itemId },
        });
        return response.data.results ?? [];
    }
    static async getTransactions(accountId, from) {
        const client = await this.getApiClient();
        const params = { accountId };
        if (from)
            params.from = from;
        const response = await client.get('/transactions', { params });
        return response.data.results ?? [];
    }
    static async getInvestments(itemId) {
        const client = await this.getApiClient();
        const response = await client.get('/investments', {
            params: { itemId },
        });
        return response.data.results ?? [];
    }
    static async getIdentity(itemId) {
        const client = await this.getApiClient();
        try {
            const response = await client.get('/identity', { params: { itemId } });
            return response.data;
        }
        catch {
            return null;
        }
    }
}
exports.BankIntegrationService = BankIntegrationService;
//# sourceMappingURL=BankIntegrationService.js.map