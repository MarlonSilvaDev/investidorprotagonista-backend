import { Request, Response } from 'express';
import { supabase } from '../../database/supabase';
import { WhatsAppService } from '../../../core/utils/WhatsAppService';
import { BrapiService } from '../../../core/utils/BrapiService';
import { BankIntegrationService } from '../../../core/utils/BankIntegrationService';

export class IntegrationController {
  // ─── PLUGGY (OPEN FINANCE) ───
  async getPluggyToken(request: Request, response: Response) {
    try {
      const accessToken = await BankIntegrationService.createConnectToken();
      return response.json({ accessToken });
    } catch (error: any) {
      return response.status(500).json({ message: error.message || 'Failed to create Pluggy token' });
    }
  }

  async syncPluggyAccount(request: Request, response: Response) {
    const { id: userId } = request.user;
    const { itemId } = request.body;

    if (!itemId) {
      return response.status(400).json({ message: 'itemId is required' });
    }

    try {
      const [accounts, investments] = await Promise.all([
        BankIntegrationService.getAccounts(itemId),
        BankIntegrationService.getInvestments(itemId),
      ]);

      for (const account of accounts || []) {
        const transactions = await BankIntegrationService.getTransactions(account.id);

        for (const tx of transactions || []) {
          await supabase.from('transactions').upsert(
            {
              user_id: userId,
              external_id: tx.id,
              title: tx.description || 'Pluggy',
              amount: Math.abs(tx.amount || 0),
              type: (tx.amount || 0) >= 0 ? 'income' : 'expense',
              category: tx.category || 'Open Finance',
              date: tx.date || new Date().toISOString(),
              description: `Sincronizado via Pluggy (${account.name || account.type})`,
            },
            { onConflict: 'external_id' }
          );
        }
      }

      for (const investment of investments || []) {
        await supabase.from('investments').upsert(
          {
            user_id: userId,
            external_id: investment.id,
            ticker: investment.code || investment.name,
            asset_class: investment.type || 'other',
            total_invested: investment.balance || 0,
            current_total: investment.balance || 0,
            quantity: investment.quantity || 0,
          },
          { onConflict: 'external_id' }
        );
      }

      return response.json({
        message: 'Pluggy sync completed',
        accounts: accounts?.length || 0,
        investments: investments?.length || 0,
      });
    } catch (error: any) {
      return response.status(500).json({ message: error.message || 'Failed to sync Pluggy account' });
    }
  }

  // ─── B3 / BRAPI ───
  async updateMarketPrices(request: Request, response: Response) {
    const { id: userId } = request.user;

    try {
      const { data: investments, error } = await supabase
        .from('investments')
        .select('id, ticker, quantity, total_invested')
        .eq('user_id', userId)
        .not('ticker', 'is', null);

      if (error) return response.status(400).json({ message: error.message });
      if (!investments?.length) {
        return response.json({ message: 'No investments to update', updated: 0 });
      }

      const tickers = [...new Set(investments.map((i) => i.ticker).filter(Boolean))];
      const quotes = await BrapiService.getQuote(tickers);
      const quoteMap = new Map(quotes?.map((q: any) => [q.symbol, q]) || []);

      let updated = 0;
      for (const investment of investments) {
        const quote = quoteMap.get(investment.ticker);
        if (!quote?.regularMarketPrice) continue;

        const currentTotal = (investment.quantity || 0) * quote.regularMarketPrice;
        await supabase
          .from('investments')
          .update({
            current_price: quote.regularMarketPrice,
            current_total: currentTotal,
            updated_at: new Date().toISOString(),
          })
          .eq('id', investment.id)
          .eq('user_id', userId);
        updated++;
      }

      return response.json({ message: 'Market prices updated', updated });
    } catch (error: any) {
      return response.status(500).json({ message: error.message || 'Failed to update market prices' });
    }
  }

  // ─── WHATSAPP ───
  async sendDailySummary(request: Request, response: Response) {
    const { id: userId } = request.user;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone_number, name')
        .eq('id', userId)
        .single();

      if (!profile?.phone_number) {
        return response.status(400).json({ message: 'User has no phone number configured' });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('user_id', userId)
        .gte('date', today.toISOString());

      const income = transactions?.filter((t) => t.type === 'income').reduce((acc, t) => acc + t.amount, 0) || 0;
      const expense = transactions?.filter((t) => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0) || 0;

      const { data: investments } = await supabase
        .from('investments')
        .select('current_total')
        .eq('user_id', userId);

      const totalInvested = investments?.reduce((acc, i) => acc + (i.current_total || 0), 0) || 0;

      const message =
        `📋 *Resumo diário — ${profile.name || 'Investidor'}*\n\n` +
        `Entradas hoje: R$ ${income.toFixed(2)}\n` +
        `Saídas hoje: R$ ${expense.toFixed(2)}\n` +
        `Saldo do dia: R$ ${(income - expense).toFixed(2)}\n` +
        `Carteira: R$ ${totalInvested.toFixed(2)}`;

      await WhatsAppService.sendMessage(profile.phone_number, message);
      return response.json({ message: 'Daily summary sent' });
    } catch (error: any) {
      return response.status(500).json({ message: error.message || 'Failed to send daily summary' });
    }
  }

  // ─── CONFIGURAÇÕES DE NOTIFICAÇÃO ───
  async updateNotificationPrefs(request: Request, response: Response) {
    const { id: userId } = request.user;
    const { channel, time } = request.body;

    const { data, error } = await supabase
      .from('profiles')
      .update({
        notification_channel: channel,
        notification_time: time,
        updated_at: new Date()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) return response.status(400).json({ message: error.message });
    return response.json(data);
  }

  // ─── WHATSAPP CHATBOT (FLUXO INTERATIVO) ───
  async whatsappWebhook(request: Request, response: Response) {
    const { message, sender } = request.body;
    const text = message.trim().toLowerCase();

    // 1. Identificar usuário e estado da sessão
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, whatsapp_session_state, name')
      .eq('phone_number', sender)
      .single();

    if (!profile) return response.json({ status: 'ignored' });

    let nextState = 'idle';
    let reply = '';

    // 2. Máquina de Estados do Chatbot
    switch (profile.whatsapp_session_state) {
      case 'idle':
        if (text === 'usar whatsapp' || text === 'oi' || text === 'menu') {
          reply = `Olá ${profile.name}! Como posso ajudar hoje?\n\n1 - Registrar Entrada\n2 - Registrar Saída\n3 - Resumo da Carteira`;
          nextState = 'waiting_type';
        } else {
          reply = "Desculpe, não entendi. Digite 'menu' para ver as opções.";
        }
        break;

      case 'waiting_type':
        if (text === '1' || text === '2') {
          const type = text === '1' ? 'Entrada' : 'Saída';
          reply = `Ótimo! Qual o valor da ${type}? (Ex: 50.00)`;
          nextState = `waiting_amount_${text === '1' ? 'income' : 'expense'}`;
        } else if (text === '3') {
          reply = 'Buscando dados da sua carteira...';
          nextState = 'idle';
        } else {
          reply = 'Opção inválida. Escolha 1, 2 ou 3.';
          nextState = 'waiting_type';
        }
        break;

      case 'waiting_amount_income':
      case 'waiting_amount_expense': {
        const amount = parseFloat(text.replace(',', '.'));
        if (!isNaN(amount)) {
          const type = profile.whatsapp_session_state.includes('income') ? 'income' : 'expense';
          reply = `Valor de R$ ${amount.toFixed(2)} recebido. Qual a categoria/descrição?`;
          nextState = `waiting_description_${type}_${amount}`;
        } else {
          reply = 'Valor inválido. Digite um número (Ex: 50.00)';
          nextState = profile.whatsapp_session_state;
        }
        break;
      }

      default:
        if (profile.whatsapp_session_state?.startsWith('waiting_description')) {
          const parts = profile.whatsapp_session_state.split('_');
          const finalType = parts[2];
          const finalAmount = parseFloat(parts[3] || '0');

          await supabase.from('transactions').insert([{
            user_id: profile.id,
            title: text,
            amount: finalAmount,
            type: finalType,
            category: 'WhatsApp',
            date: new Date(),
            description: 'Registrado via Chatbot WhatsApp'
          }]);

          reply = `✅ *Sucesso!* ${finalType === 'income' ? 'Entrada' : 'Saída'} de R$ ${finalAmount.toFixed(2)} registrada como "${text}".`;
          nextState = 'idle';
        }
        break;
    }

    // 3. Atualizar estado e responder
    await supabase.from('profiles').update({ whatsapp_session_state: nextState }).eq('id', profile.id);
    await WhatsAppService.sendMessage(sender, reply);

    return response.json({ status: 'processed' });
  }
}
