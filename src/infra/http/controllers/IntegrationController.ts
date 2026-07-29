import { Request, Response } from 'express';
import { supabase } from '../../database/supabase';
import { WhatsAppService } from '../../../core/utils/WhatsAppService';
import { BrapiService } from '../../../core/utils/BrapiService';

export class IntegrationController {
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
          // Chamar resumo da carteira
          reply = "Buscando dados da sua carteira...";
          nextState = 'idle';
          // Trigger async summary
        } else {
          reply = "Opção inválida. Escolha 1, 2 ou 3.";
          nextState = 'waiting_type';
        }
        break;

      case 'waiting_amount_income':
      case 'waiting_amount_expense':
        const amount = parseFloat(text.replace(',', '.'));
        if (!isNaN(amount)) {
          const type = profile.whatsapp_session_state.includes('income') ? 'income' : 'expense';
          
          // Salvar transação temporária ou pedir descrição
          reply = `Valor de R$ ${amount.toFixed(2)} recebido. Qual a categoria/descrição?`;
          nextState = `waiting_description_${type}_${amount}`;
        } else {
          reply = "Valor inválido. Digite um número (Ex: 50.00)";
          nextState = profile.whatsapp_session_state;
        }
        break;

      case text.startsWith('waiting_description') ? profile.whatsapp_session_state : '':
        const parts = profile.whatsapp_session_state.split('_');
        const finalType = parts[2];
        const finalAmount = parseFloat(parts[3]);

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
        break;
    }

    // 3. Atualizar estado e responder
    await supabase.from('profiles').update({ whatsapp_session_state: nextState }).eq('id', profile.id);
    await WhatsAppService.sendMessage(sender, reply);

    return response.json({ status: 'processed' });
  }
}
