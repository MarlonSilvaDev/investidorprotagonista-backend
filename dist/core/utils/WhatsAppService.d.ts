/**
 * Wrapper de compatibilidade — redireciona para NotifyGwService.
 * Mantém a interface estática para não quebrar chamadas existentes
 * em IntegrationController e outros módulos.
 */
export declare class WhatsAppService {
    static sendMessage(to: string, message: string): Promise<void>;
    static sendAssetAlert(to: string, asset: string, price: number, change: number): Promise<void>;
}
//# sourceMappingURL=WhatsAppService.d.ts.map