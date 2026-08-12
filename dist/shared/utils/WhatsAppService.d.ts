export declare class WhatsAppService {
    private static apiUrl;
    private static apiKey;
    static sendMessage(to: String, message: string): Promise<void>;
    static sendAssetAlert(to: string, asset: string, price: number, change: number): Promise<void>;
}
//# sourceMappingURL=WhatsAppService.d.ts.map