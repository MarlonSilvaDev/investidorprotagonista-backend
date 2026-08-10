export interface PluggyConnectTokenOptions {
    clientUserId?: string;
    webhookUrl?: string;
    itemId?: string;
}
export declare class BankIntegrationService {
    private static baseUrl;
    private static clientId;
    private static clientSecret;
    private static getApiClient;
    private static getAccessToken;
    static createConnectToken(options?: PluggyConnectTokenOptions): Promise<{
        accessToken: string;
        connectToken: string;
        expiresIn: number;
    }>;
    static getItem(itemId: string): Promise<any>;
    static refreshItem(itemId: string): Promise<any>;
    static deleteItem(itemId: string): Promise<void>;
    static getAccounts(itemId: string): Promise<any>;
    static getTransactions(accountId: string, from?: string): Promise<any>;
    static getInvestments(itemId: string): Promise<any>;
    static getIdentity(itemId: string): Promise<any>;
}
//# sourceMappingURL=BankIntegrationService.d.ts.map