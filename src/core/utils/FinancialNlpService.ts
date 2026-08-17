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

export type NlpIntent =
  | { kind: 'transaction'; data: ParsedTransaction }
  | { kind: 'summary'; data: ParsedSummaryRequest }
  | { kind: 'help' }
  | { kind: 'unknown'; rawText: string };

/**
 * Serviço de Inteligência e Processamento de Linguagem Natural (NLP) Financeiro.
 * Analisa transcrições de voz ou mensagens de texto para extrair transações e pedidos de resumos.
 */
export class FinancialNlpService {
  private static categoryKeywords: Record<string, string[]> = {
    Alimentação: [
      'almoço', 'jantar', 'café', 'padaria', 'restaurante', 'lanche', 'pizza', 'hamburguer',
      'mercado', 'supermercado', 'açougue', 'feira', 'ifood', 'comida', 'refeição', 'bar', 'churrasco'
    ],
    Transporte: [
      'uber', 'gasolina', 'combustível', 'posto', 'etanol', 'estacionamento', 'ônibus', 'metro',
      'metrô', 'pedágio', 'táxi', '99', 'passagem', 'lavagem', 'ipva'
    ],
    Moradia: [
      'aluguel', 'condomínio', 'energia', 'luz', 'água', 'gás', 'internet', 'iptu', 'faxina',
      'manutenção', 'reforma', 'móveis'
    ],
    Saúde: [
      'farmácia', 'remédio', 'médico', 'consulta', 'dentista', 'hospital', 'exame', 'plano de saúde',
      'psicólogo', 'terapia'
    ],
    Lazer: [
      'cinema', 'show', 'viagem', 'hotel', 'passeio', 'jogo', 'streaming', 'netflix', 'spotify',
      'clube', 'praia'
    ],
    Educação: [
      'curso', 'faculdade', 'escola', 'livro', 'mensalidade', 'material', 'treinamento'
    ],
    Renda: [
      'salário', 'salario', 'pagamento', 'pix recebido', 'rendimento', 'dividendo', 'proventos',
      'freela', 'freelance', 'comissão', 'bônus', 'reembolso', 'venda'
    ],
  };

  /**
   * Identifica a intenção do usuário a partir do texto transcrito ou digitado.
   */
  static parseIntent(rawInput: string): NlpIntent {
    const text = rawInput.trim().toLowerCase();

    // 1. Verificação de pedido de ajuda ou menu
    if (
      text === 'menu' ||
      text === 'oi' ||
      text === 'olá' ||
      text === 'ola' ||
      text === 'ajuda' ||
      text === 'comandos' ||
      text === 'help' ||
      text === 'iniciar'
    ) {
      return { kind: 'help' };
    }

    // 2. Verificação de pedidos de resumo / consulta
    if (
      text.includes('resumo') ||
      text.includes('saldo') ||
      text.includes('quanto gastei') ||
      text.includes('gastos') ||
      text.includes('extrato') ||
      text.includes('relatório') ||
      text.includes('relatorio') ||
      text.includes('total')
    ) {
      let period: 'today' | 'week' | 'month' | 'last_month' | 'category' = 'month';

      if (text.includes('hoje') || text.includes('dia')) {
        period = 'today';
      } else if (text.includes('semana')) {
        period = 'week';
      } else if (text.includes('mês passado') || text.includes('mes passado')) {
        period = 'last_month';
      } else {
        // Verifica se é pergunta sobre categoria específica (ex: "quanto gastei com uber?")
        const matchedCategory = this.detectCategory(text);
        if (matchedCategory !== 'Outros') {
          return {
            kind: 'summary',
            data: { period: 'category', categoryFilter: matchedCategory },
          };
        }
      }

      return {
        kind: 'summary',
        data: { period },
      };
    }

    // 3. Tentativa de extração de Transação (receita ou despesa)
    const transaction = this.extractTransaction(rawInput);
    if (transaction) {
      return { kind: 'transaction', data: transaction };
    }

    return { kind: 'unknown', rawText: rawInput };
  }

  /**
   * Extrai dados estruturados de uma transação a partir de texto livre.
   */
  private static extractTransaction(text: string): ParsedTransaction | null {
    const lower = text.toLowerCase();

    // Extrair Valor monetário (ex: "R$ 45,50", "45.50", "45 reais", "cinquenta reais", "120,00")
    const amount = this.extractAmount(lower);
    if (!amount || amount <= 0) return null;

    // Detectar Tipo (receita vs despesa)
    const isIncome =
      lower.includes('recebi') ||
      lower.includes('ganhei') ||
      lower.includes('salário') ||
      lower.includes('salario') ||
      lower.includes('depósito') ||
      lower.includes('pix recebido') ||
      lower.includes('receita') ||
      lower.includes('vendi') ||
      lower.includes('entrada') ||
      lower.includes('recebimento');

    const type: 'income' | 'expense' = isIncome ? 'income' : 'expense';

    // Detectar Categoria
    const category = isIncome ? 'Renda' : this.detectCategory(lower);

    // Gerar Título descritivo amigável
    const title = this.cleanTitle(text, amount);

    return {
      type,
      amount,
      category,
      title: title.length > 0 ? title : (isIncome ? 'Receita via WhatsApp' : 'Despesa via WhatsApp'),
      description: `Registrado automaticamente via áudio/mensagem do WhatsApp`,
      date: new Date(),
    };
  }

  /**
   * Extrai o valor monetário numérico do texto.
   */
  private static extractAmount(text: string): number | null {
    // 1. Padrão R$ 100,50 ou 100.50 ou 100,50
    const moneyRegex = /(?:r\$\s*|reais\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:reais|real)?/i;
    const match = text.match(/(?:r\$\s*)?(\d{1,6}(?:[.,]\d{1,2})?)\s*(?:reais|real|\b)/i);

    if (match && match[1]) {
      const numStr = match[1].replace(',', '.');
      const val = parseFloat(numStr);
      if (!isNaN(val) && val > 0) return val;
    }

    // Busca apenas números com decimais ou inteiros
    const fallbackNumbers = text.match(/\b\d+(?:[.,]\d{1,2})?\b/);
    if (fallbackNumbers) {
      const val = parseFloat(fallbackNumbers[0].replace(',', '.'));
      if (!isNaN(val) && val > 0) return val;
    }

    return null;
  }

  /**
   * Detecta categoria mais provável baseada em palavras-chave.
   */
  private static detectCategory(text: string): string {
    for (const [cat, keywords] of Object.entries(this.categoryKeywords)) {
      for (const kw of keywords) {
        if (text.includes(kw)) {
          return cat;
        }
      }
    }
    return 'Outros';
  }

  /**
   * Limpa o texto para formar um título limpo para a transação.
   */
  private static cleanTitle(raw: string, _amount: number): string {
    let clean = raw
      .replace(/gastei|paguei|comprei|recebi|ganhei|dei|fiz um pix de|pix de/gi, '')
      .replace(/r\$\s*\d+([.,]\d+)?/gi, '')
      .replace(/\d+([.,]\d+)?\s*(reais|real)/gi, '')
      .replace(/\b\d+([.,]\d+)?\b/gi, '')
      .replace(/hoje|ontem|no|na|em|de|para|com|o|a/gi, ' ')
      .trim();

    clean = clean.replace(/\s+/g, ' ');
    if (clean.length > 0) {
      return clean.charAt(0).toUpperCase() + clean.slice(1);
    }
    return '';
  }
}
