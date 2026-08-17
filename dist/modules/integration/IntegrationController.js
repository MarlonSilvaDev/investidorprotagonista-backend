"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationController = void 0;
const supabase_1 = require("../../config/supabase");
const WhatsAppService_1 = require("../../core/utils/WhatsAppService");
const BrapiService_1 = require("../../core/utils/BrapiService");
const BankIntegrationService_1 = require("../../core/utils/BankIntegrationService");
const AudioTranscriptionService_1 = require("../../core/utils/AudioTranscriptionService");
const FinancialNlpService_1 = require("../../core/utils/FinancialNlpService");
class IntegrationController {
    // ─── PLUGGY (OPEN FINANCE) ───
    async getPluggyToken(request, response) {
        try {
            const { id: userId } = request.user;
            const token = await BankIntegrationService_1.BankIntegrationService.createConnectToken({
                clientUserId: userId,
            });
            return response.json({
                accessToken: token.accessToken,
                connectToken: token.connectToken,
                expiresIn: token.expiresIn,
            });
        }
        catch (error) {
            return response.status(500).json({ message: error.message || 'Failed to create Pluggy token' });
        }
    }
    async syncPluggyAccount(_request, response) {
        return response.status(410).json({
            message: 'POST /integrations/pluggy/sync foi desativado. Use /integrations/open-finance/* (snapshot local no app).',
            code: 'PLUGGY_SYNC_GONE',
        });
    }
    // ─── B3 / BRAPI ───
    async updateMarketPrices(request, response) {
        const { id: userId } = request.user;
        try {
            const { data: investments, error } = await supabase_1.supabase
                .from('investments')
                .select('id, ticker, quantity, total_invested')
                .eq('user_id', userId)
                .not('ticker', 'is', null);
            if (error)
                return response.status(400).json({ message: error.message });
            if (!investments?.length) {
                return response.json({ message: 'No investments to update', updated: 0 });
            }
            const tickers = [...new Set(investments.map((i) => i.ticker).filter(Boolean))];
            const quotes = await BrapiService_1.BrapiService.getQuote(tickers);
            const quoteMap = new Map(quotes?.map((q) => [q.symbol, q]) || []);
            let updated = 0;
            for (const investment of investments) {
                const quote = quoteMap.get(investment.ticker);
                if (!quote?.regularMarketPrice)
                    continue;
                const currentTotal = (investment.quantity || 0) * quote.regularMarketPrice;
                await supabase_1.supabase
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
        }
        catch (error) {
            return response.status(500).json({ message: error.message || 'Failed to update market prices' });
        }
    }
    // ─── WHATSAPP STATUS & CONFIGURAÇÃO (FLUTTER APP) ───
    async getWhatsAppStatus(request, response) {
        const { id: userId } = request.user;
        try {
            const { data: profile } = await supabase_1.supabase
                .from('profiles')
                .select('phone_number, name, notification_channel, notification_time, plan, user_type, subscription_status')
                .eq('id', userId)
                .single();
            const isPaidPlan = profile?.user_type === 'empresa' ||
                (profile?.plan && profile.plan !== 'free' && profile.plan !== 'padrao');
            const botPhoneNumber = process.env.WHATSAPP_BOT_NUMBER || '+5511999999999';
            return response.json({
                isPaidPlan,
                isConnected: !!profile?.phone_number && isPaidPlan,
                phoneNumber: profile?.phone_number || null,
                botPhoneNumber,
                notificationChannel: profile?.notification_channel || 'whatsapp',
                notificationTime: profile?.notification_time || '09:00',
                features: {
                    audioToTransaction: isPaidPlan,
                    onDemandSummary: isPaidPlan,
                    dailyReports: isPaidPlan && profile?.notification_channel === 'whatsapp',
                },
            });
        }
        catch (error) {
            return response.status(500).json({ message: error.message || 'Failed to get WhatsApp status' });
        }
    }
    async linkWhatsApp(request, response) {
        const { id: userId } = request.user;
        const { phoneNumber } = request.body;
        if (!phoneNumber) {
            return response.status(400).json({ message: 'Informe o número de telefone' });
        }
        try {
            const { data: profile } = await supabase_1.supabase
                .from('profiles')
                .select('id, name, plan, user_type')
                .eq('id', userId)
                .single();
            const isPaidPlan = profile?.user_type === 'empresa' ||
                (profile?.plan && profile.plan !== 'free' && profile.plan !== 'padrao');
            if (!isPaidPlan) {
                return response.status(403).json({
                    code: 'PAID_PLAN_REQUIRED',
                    message: 'O Bot Inteligente do WhatsApp é exclusivo para assinantes dos planos Pro ou Empresa. Atualize seu plano para concluir a integração.',
                });
            }
            const cleanPhone = phoneNumber.replace(/\D/g, '');
            const formatted = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;
            const { data, error } = await supabase_1.supabase
                .from('profiles')
                .update({
                phone_number: formatted,
                updated_at: new Date().toISOString(),
            })
                .eq('id', userId)
                .select()
                .single();
            if (error)
                return response.status(400).json({ message: error.message });
            // Envia mensagem de boas-vindas no WhatsApp
            const welcomeMsg = `👋 *Olá ${data.name || 'Investidor'}!*\n\n` +
                `Seu WhatsApp foi vinculado com sucesso ao *Investidor Protagonista*! 🚀\n\n` +
                `🎙️ *Envie um áudio* ou digite seus gastos para registrar transações na hora.\n` +
                `_Exemplo: "Gastei 45 reais no almoço"_ ou _"Recebi pix de 200 reais"_.\n\n` +
                `📊 Digite *resumo* a qualquer momento para ver seus gastos!`;
            await WhatsAppService_1.WhatsAppService.sendMessage(formatted, welcomeMsg);
            return response.json({
                success: true,
                phoneNumber: formatted,
                message: 'WhatsApp vinculado com sucesso!',
            });
        }
        catch (error) {
            return response.status(500).json({ message: error.message || 'Falha ao vincular WhatsApp' });
        }
    }
    async sendDailySummary(request, response) {
        const { id: userId } = request.user;
        try {
            const { data: profile } = await supabase_1.supabase
                .from('profiles')
                .select('phone_number, name, plan, user_type')
                .eq('id', userId)
                .single();
            if (!profile?.phone_number) {
                return response.status(400).json({ message: 'User has no phone number configured' });
            }
            const isPaidPlan = profile?.user_type === 'empresa' ||
                (profile?.plan && profile.plan !== 'free' && profile.plan !== 'padrao');
            if (!isPaidPlan) {
                return response.status(403).json({
                    code: 'PAID_PLAN_REQUIRED',
                    message: 'Atualize seu plano para enviar resumos diários no WhatsApp.',
                });
            }
            const summaryText = await this.generateFinancialSummary(userId, profile.name, 'today');
            await WhatsAppService_1.WhatsAppService.sendMessage(profile.phone_number, summaryText);
            return response.json({ message: 'Daily summary sent' });
        }
        catch (error) {
            return response.status(500).json({ message: error.message || 'Failed to send daily summary' });
        }
    }
    async updateNotificationPrefs(request, response) {
        const { id: userId } = request.user;
        const { channel, time } = request.body;
        const { data, error } = await supabase_1.supabase
            .from('profiles')
            .update({
            notification_channel: channel,
            notification_time: time,
            updated_at: new Date(),
        })
            .eq('id', userId)
            .select()
            .single();
        if (error)
            return response.status(400).json({ message: error.message });
        return response.json(data);
    }
    // ─── WHATSAPP CHATBOT & WEBHOOK INTELIGENTE (ÁUDIO + TEXTO) ───
    async whatsappWebhook(request, response) {
        const { message, sender, media_url, audio_url, audio_base64, mime_type } = request.body;
        if (!sender) {
            return response.status(400).json({ message: 'Remetente não informado' });
        }
        const cleanSender = sender.replace(/\D/g, '');
        const formattedSender = cleanSender.startsWith('+') ? cleanSender : `+${cleanSender}`;
        // 1. Identificar usuário cadastrado pelo número
        const { data: profile } = await supabase_1.supabase
            .from('profiles')
            .select('id, name, phone_number, plan, user_type, subscription_status')
            .or(`phone_number.eq.${formattedSender},phone_number.eq.${cleanSender}`)
            .single();
        if (!profile) {
            const notRegisteredMsg = `👋 Olá! Este número ainda não está vinculado ao *Investidor Protagonista*.\n\n` +
                `Para vincular sua conta, acesse o app no menu *Integrações > WhatsApp* e insira este número.`;
            await WhatsAppService_1.WhatsAppService.sendMessage(formattedSender, notRegisteredMsg);
            return response.json({ status: 'unregistered_user' });
        }
        // 2. Validar se o plano do usuário é Pro/Empresa
        const isPaidPlan = profile.user_type === 'empresa' ||
            (profile.plan && profile.plan !== 'free' && profile.plan !== 'padrao');
        if (!isPaidPlan) {
            const upgradeMsg = `🔒 *Recurso Exclusivo dos Planos Pro / Empresa*\n\n` +
                `Olá ${profile.name || 'Investidor'}! O Bot Inteligente do WhatsApp com transcrição de voz e relatórios é exclusivo para assinantes.\n\n` +
                `Acesse o aplicativo *Investidor Protagonista* e atualize seu plano para concluir a integração e liberar o lançamento de transações por voz! 🚀`;
            await WhatsAppService_1.WhatsAppService.sendMessage(formattedSender, upgradeMsg);
            return response.json({ status: 'upgrade_required' });
        }
        let processedText = (message || '').trim();
        // 2. Se for mensagem de áudio, processa a transcrição via IA
        const targetAudioUrl = audio_url || (mime_type?.startsWith('audio') ? media_url : undefined);
        if (targetAudioUrl || audio_base64) {
            const transcribed = await AudioTranscriptionService_1.AudioTranscriptionService.transcribeAudio({
                audioUrl: targetAudioUrl,
                audioBase64: audio_base64,
                mimeType: mime_type,
            });
            if (transcribed && transcribed.length > 0) {
                processedText = transcribed;
            }
            else {
                await WhatsAppService_1.WhatsAppService.sendMessage(formattedSender, '🎙️ Recebi seu áudio, mas não consegui compreender com clareza. Pode digitar ou gravar novamente informando o valor e o gasto?');
                return response.json({ status: 'transcription_failed' });
            }
        }
        if (!processedText) {
            return response.json({ status: 'empty_message' });
        }
        // 3. Processa a intenção via IA / NLP
        const intent = FinancialNlpService_1.FinancialNlpService.parseIntent(processedText);
        switch (intent.kind) {
            case 'transaction': {
                const tx = intent.data;
                const now = new Date();
                const { error } = await supabase_1.supabase.from('transactions').insert([
                    {
                        user_id: profile.id,
                        title: tx.title,
                        amount: tx.amount,
                        type: tx.type,
                        category: tx.category,
                        date: tx.date ? tx.date.toISOString() : now.toISOString(),
                        description: `${tx.description} (Original: "${processedText}")`,
                        data_origin: 'whatsapp',
                        is_synced: true,
                    },
                ]);
                if (error) {
                    console.error('[WhatsAppBot] Erro ao salvar transação:', error);
                    await WhatsAppService_1.WhatsAppService.sendMessage(formattedSender, '❌ Ocorreu um erro ao registrar sua transação. Tente novamente em instantes.');
                    return response.status(500).json({ error: error.message });
                }
                const isIncome = tx.type === 'income';
                const confirmationMsg = `✅ *Transação Registrada com Sucesso!*\n\n` +
                    `🏷️ *Item:* ${tx.title}\n` +
                    `💵 *Valor:* R$ ${tx.amount.toFixed(2)} (${isIncome ? 'Receita 📈' : 'Despesa 📉'})\n` +
                    `📁 *Categoria:* ${tx.category}\n` +
                    `📅 *Data:* ${now.toLocaleDateString('pt-BR')}\n\n` +
                    `_Registrado no Investidor Protagonista via ${targetAudioUrl || audio_base64 ? 'Áudio' : 'WhatsApp'}._`;
                await WhatsAppService_1.WhatsAppService.sendMessage(formattedSender, confirmationMsg);
                return response.json({ status: 'transaction_saved', transaction: tx });
            }
            case 'summary': {
                const summaryMsg = await this.generateFinancialSummary(profile.id, profile.name, intent.data.period, intent.data.categoryFilter);
                await WhatsAppService_1.WhatsAppService.sendMessage(formattedSender, summaryMsg);
                return response.json({ status: 'summary_sent' });
            }
            case 'help': {
                const helpMsg = `🤖 *Assistente Financeiro Investidor Protagonista*\n\n` +
                    `Você pode falar comigo por *áudio* 🎙️ ou *texto* 💬:\n\n` +
                    `📌 *Como lançar gastos e receitas:*\n` +
                    `• _"Gastei 54 reais no almoço"_\n` +
                    `• _"Paguei 120 de luz"_\n` +
                    `• _"Recebi pix de 350 reais de freela"_\n` +
                    `• _"Uber 23 reais"_\n\n` +
                    `📊 *Como pedir resumos:*\n` +
                    `• Digite *resumo* (resumo do mês)\n` +
                    `• Digite *quanto gastei hoje*\n` +
                    `• Digite *gastos da semana*\n` +
                    `• Digite *gastos com alimentação*`;
                await WhatsAppService_1.WhatsAppService.sendMessage(formattedSender, helpMsg);
                return response.json({ status: 'help_sent' });
            }
            case 'unknown':
            default: {
                const unknownReply = `🤔 Não consegui identificar um valor ou comando na mensagem: _"${processedText}"_\n\n` +
                    `💡 *Dica:* Para registrar um gasto, mencione o valor e o que foi comprado. Exemplo:\n` +
                    `• _"Gastei 40 reais na padaria"_ (ou envie um áudio falando isso!)`;
                await WhatsAppService_1.WhatsAppService.sendMessage(formattedSender, unknownReply);
                return response.json({ status: 'unknown_intent' });
            }
        }
    }
    /**
     * Helper para gerar resumo financeiro consolidado.
     */
    async generateFinancialSummary(userId, userName, period, categoryFilter) {
        const startDate = new Date();
        if (period === 'today') {
            startDate.setHours(0, 0, 0, 0);
        }
        else if (period === 'week') {
            startDate.setDate(startDate.getDate() - 7);
        }
        else if (period === 'last_month') {
            startDate.setMonth(startDate.getMonth() - 1);
            startDate.setDate(1);
        }
        else {
            // Month
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
        }
        const { data: allTxs } = await supabase_1.supabase
            .from('transactions')
            .select('title, amount, type, category, date')
            .eq('user_id', userId)
            .gte('date', startDate.toISOString());
        const txs = categoryFilter
            ? allTxs?.filter((t) => (t.category || '').toLowerCase().includes(categoryFilter.toLowerCase()))
            : allTxs;
        const income = txs?.filter((t) => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0) || 0;
        const expense = txs?.filter((t) => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0) || 0;
        const balance = income - expense;
        const periodLabel = period === 'today'
            ? 'de Hoje'
            : period === 'week'
                ? 'dos Últimos 7 Dias'
                : period === 'last_month'
                    ? 'do Mês Passado'
                    : categoryFilter
                        ? `na Categoria ${categoryFilter}`
                        : 'deste Mês';
        return (`📊 *Resumo Financeiro ${periodLabel}*\n` +
            `👤 *${userName || 'Investidor'}*\n\n` +
            `🟢 *Entradas:* R$ ${income.toFixed(2)}\n` +
            `🔴 *Saídas:* R$ ${expense.toFixed(2)}\n` +
            `💰 *Saldo:* R$ ${balance.toFixed(2)}\n` +
            `📝 *Total de Lançamentos:* ${txs?.length || 0}\n\n` +
            `_Acompanhe seus gráficos completos no aplicativo!_`);
    }
}
exports.IntegrationController = IntegrationController;
//# sourceMappingURL=IntegrationController.js.map