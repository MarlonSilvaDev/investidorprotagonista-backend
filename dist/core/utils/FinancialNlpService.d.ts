export interface ParsedTransaction {
    type: 'income' | 'expense';
    amount: number;
    category: string;
    title: string;
    description?: string;
    date?: Date;
}
export interface ParsedSummaryRequest {
    period: 'today' | 'week' | 'month' | 'last_month' | 'category';
    categoryFilter?: string;
}
export type NlpIntent = {
    kind: 'transaction';
    data: ParsedTransaction;
} | {
    kind: 'summary';
    data: ParsedSummaryRequest;
} | {
    kind: 'help';
} | {
    kind: 'unknown';
    rawText: string;
};
/**
 * Serviço de Inteligência e Processamento de Linguagem Natural (NLP) Financeiro.
 * Analisa transcrições de voz ou mensagens de texto para extrair transações e pedidos de resumos.
 */
export declare class FinancialNlpService {
    private static categoryKeywords;
    /**
     * Identifica a intenção do usuário a partir do texto transcrito ou digitado.
     */
    static parseIntent(rawInput: string): NlpIntent;
    /**
     * Extrai dados estruturados de uma transação a partir de texto livre.
     */
    private static extractTransaction;
    /**
     * Extrai o valor monetário numérico do texto.
     */
    private static extractAmount;
    /**
     * Detecta categoria mais provável baseada em palavras-chave.
     */
    private static detectCategory;
    /**
     * Limpa o texto para formar um título limpo para a transação.
     */
    private static cleanTitle;
}
//# sourceMappingURL=FinancialNlpService.d.ts.map