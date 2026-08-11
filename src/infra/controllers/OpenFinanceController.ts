import type { Request, Response } from 'express';
import { supabase } from '../database/supabase';
import { BankIntegrationService } from '../../core/utils/BankIntegrationService';

const PROVIDER = 'pluggy';

type ItemStatus = 'pending' | 'connected' | 'error' | 'disconnected';

function paramId(value: string | string[] | undefined): string | null {
  if (typeof value === 'string' && value.length > 0) return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return null;
}

function mapPluggyStatus(status?: string): ItemStatus {
  switch ((status || '').toUpperCase()) {
    case 'UPDATED':
    case 'UPDATING':
      return 'connected';
    case 'LOGIN_ERROR':
    case 'OUTDATED':
    case 'WAITING_USER_INPUT':
    case 'WAITING_USER_ACTION':
      return 'error';
    default:
      return 'pending';
  }
}

function buildWebhookUrl(): string | undefined {
  const explicit = process.env.PLUGGY_WEBHOOK_URL;
  if (explicit) return explicit;

  const base = process.env.API_PUBLIC_URL || process.env.APP_URL;
  if (!base) return undefined;

  const secret = process.env.PLUGGY_WEBHOOK_SECRET;
  const url = `${base.replace(/\/$/, '')}/integrations/open-finance/webhook`;
  return secret ? `${url}?secret=${encodeURIComponent(secret)}` : url;
}

function mapTransaction(tx: any) {
  const amount = Math.abs(Number(tx.amount ?? 0));
  const rawAmount = Number(tx.amount ?? 0);
  return {
    externalId: String(tx.id),
    type: rawAmount >= 0 ? 'income' : 'expense',
    amount,
    category: tx.category || tx.categoryId || 'Open Finance',
    description: tx.description || tx.descriptionRaw || 'Transação',
    date: tx.date || tx.paymentData?.paymentDate || new Date().toISOString(),
  };
}

function dayFromDateLike(value: unknown, fallback = 1): number {
  if (typeof value === 'number' && value >= 1 && value <= 31) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return new Date(parsed).getUTCDate();
    const asNum = Number(value);
    if (asNum >= 1 && asNum <= 31) return asNum;
  }
  return fallback;
}

function mapCreditCard(account: any) {
  const creditData = account.creditData || {};
  const number = account.number || creditData.number || '';
  const last4 = String(number).replace(/\D/g, '').slice(-4) || '0000';
  return {
    externalId: String(account.id),
    name: account.name || account.marketingName || 'Cartão',
    maskedNumber: `**** ${last4}`,
    brand: (creditData.brand || account.subtype || 'card').toString().toLowerCase(),
    limit: Number(creditData.creditLimit ?? account.balance ?? 0),
    availableLimit: Number(
      creditData.availableCreditLimit ?? account.balance ?? 0
    ),
    closingDay: dayFromDateLike(creditData.balanceCloseDate, 1),
    dueDay: dayFromDateLike(creditData.balanceDueDate, 1),
  };
}

function isCreditAccount(account: any): boolean {
  const type = String(account.type || '').toUpperCase();
  const subtype = String(account.subtype || '').toUpperCase();
  return type === 'CREDIT' || subtype.includes('CREDIT_CARD') || !!account.creditData;
}

export class OpenFinanceController {
  async createConnectToken(request: Request, response: Response) {
    const { id: userId } = request.user;
    const { institutionId } = request.body ?? {};

    try {
      const webhookUrl = buildWebhookUrl();
      const options: { clientUserId: string; webhookUrl?: string } = {
        clientUserId: userId,
      };
      if (webhookUrl) options.webhookUrl = webhookUrl;

      const token = await BankIntegrationService.createConnectToken(options);

      return response.json({
        accessToken: token.accessToken,
        connectToken: token.connectToken,
        expiresIn: token.expiresIn,
        institutionId: institutionId ?? null,
      });
    } catch (error: any) {
      return response
        .status(500)
        .json({ message: error.message || 'Failed to create connect token' });
    }
  }

  async listItems(request: Request, response: Response) {
    const { id: userId } = request.user;

    const { data, error } = await supabase
      .from('open_finance_items')
      .select('*')
      .eq('user_id', userId)
      .neq('status', 'disconnected')
      .order('created_at', { ascending: false });

    if (error) {
      return response.status(400).json({ message: error.message });
    }

    return response.json({
      items: (data ?? []).map((row) => ({
        id: row.id,
        itemId: row.item_id,
        provider: row.provider,
        institutionId: row.institution_id,
        institutionName: row.institution_name,
        status: row.status,
        lastSyncAt: row.last_sync_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    });
  }

  async getSnapshot(request: Request, response: Response) {
    const { id: userId } = request.user;
    const itemId = paramId(request.params.itemId);

    if (!itemId) {
      return response.status(400).json({ message: 'itemId is required' });
    }

    try {
      const ownership = await this.ensureItemOwnedOrLink(userId, itemId);
      if (!ownership.ok) {
        return response.status(ownership.status).json({ message: ownership.message });
      }

      const [item, accounts] = await Promise.all([
        BankIntegrationService.getItem(itemId),
        BankIntegrationService.getAccounts(itemId),
      ]);

      const connector = item?.connector || {};
      const institutionId =
        ownership.row?.institution_id ||
        String(connector.id ?? connector.name ?? 'unknown');
      const institutionName =
        ownership.row?.institution_name ||
        connector.name ||
        'Instituição';

      const bankAccounts = (accounts || []).filter((a: any) => !isCreditAccount(a));
      const creditAccounts = (accounts || []).filter((a: any) => isCreditAccount(a));

      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 90);
      const from = fromDate.toISOString().slice(0, 10);

      const transactions: ReturnType<typeof mapTransaction>[] = [];
      let accountBalance = 0;

      for (const account of bankAccounts) {
        accountBalance += Number(account.balance ?? 0);
        const txs = await BankIntegrationService.getTransactions(account.id, from);
        for (const tx of txs || []) {
          transactions.push(mapTransaction(tx));
        }
      }

      // Também puxa txs de cartão (fatura)
      for (const account of creditAccounts) {
        const txs = await BankIntegrationService.getTransactions(account.id, from);
        for (const tx of txs || []) {
          transactions.push(mapTransaction(tx));
        }
      }

      const cards = creditAccounts.map(mapCreditCard);
      const status = mapPluggyStatus(item?.status);

      await supabase.from('open_finance_items').upsert(
        {
          user_id: userId,
          provider: PROVIDER,
          item_id: itemId,
          institution_id: String(institutionId),
          institution_name: institutionName,
          status,
          last_sync_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'provider,item_id' }
      );

      return response.json({
        itemId,
        institutionId: String(institutionId),
        institutionName,
        status,
        accountBalance,
        accounts: bankAccounts.map((a: any) => ({
          externalId: String(a.id),
          name: a.name,
          type: a.type,
          subtype: a.subtype,
          balance: Number(a.balance ?? 0),
          currencyCode: a.currencyCode || 'BRL',
        })),
        transactions,
        cards,
        // Pluggy não expõe produto de "assinaturas de apps" no Open Finance;
        // contrato estável para o FE: sempre array (vazio quando sem fonte).
        subscriptions: [],
      });
    } catch (error: any) {
      return response
        .status(500)
        .json({ message: error.message || 'Failed to build snapshot' });
    }
  }

  async refreshItem(request: Request, response: Response) {
    const { id: userId } = request.user;
    const itemId = paramId(request.params.itemId);

    if (!itemId) {
      return response.status(400).json({ message: 'itemId is required' });
    }

    try {
      const ownership = await this.ensureItemOwned(userId, itemId);
      if (!ownership.ok) {
        return response.status(ownership.status).json({ message: ownership.message });
      }

      await BankIntegrationService.refreshItem(itemId);

      await supabase
        .from('open_finance_items')
        .update({
          status: 'pending',
          last_sync_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('item_id', itemId);

      return response.json({
        message: 'Refresh triggered',
        itemId,
        status: 'pending',
      });
    } catch (error: any) {
      return response
        .status(500)
        .json({ message: error.message || 'Failed to refresh item' });
    }
  }

  async deleteItem(request: Request, response: Response) {
    const { id: userId } = request.user;
    const itemId = paramId(request.params.itemId);

    if (!itemId) {
      return response.status(400).json({ message: 'itemId is required' });
    }

    try {
      const ownership = await this.ensureItemOwned(userId, itemId);
      if (!ownership.ok) {
        return response.status(ownership.status).json({ message: ownership.message });
      }

      try {
        await BankIntegrationService.deleteItem(itemId);
      } catch (err: any) {
        // Se já foi removido no provedor, ainda marcamos localmente
        if (err?.response?.status !== 404) {
          throw err;
        }
      }

      await supabase
        .from('open_finance_items')
        .update({
          status: 'disconnected',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('item_id', itemId);

      return response.json({ message: 'Item disconnected', itemId });
    } catch (error: any) {
      return response
        .status(500)
        .json({ message: error.message || 'Failed to delete item' });
    }
  }

  /**
   * Webhook público do Pluggy.
   * Valida opcionalmente PLUGGY_WEBHOOK_SECRET via query ?secret= ou header x-webhook-secret.
   */
  async webhook(request: Request, response: Response) {
    const secret = process.env.PLUGGY_WEBHOOK_SECRET;
    if (secret) {
      const provided =
        (request.query.secret as string | undefined) ||
        (request.headers['x-webhook-secret'] as string | undefined);
      if (provided !== secret) {
        return response.status(401).json({ message: 'Invalid webhook secret' });
      }
    }

    const event = request.body?.event as string | undefined;
    const itemId = request.body?.itemId as string | undefined;
    const clientUserId = request.body?.clientUserId as string | undefined;

    // Responde rápido (Pluggy exige 2xx em <5s) e processa em seguida
    response.json({ received: true });

    if (!event || !itemId) return;

    try {
      if (event === 'item/deleted') {
        await supabase
          .from('open_finance_items')
          .update({
            status: 'disconnected',
            updated_at: new Date().toISOString(),
          })
          .eq('provider', PROVIDER)
          .eq('item_id', itemId);
        return;
      }

      if (
        event !== 'item/created' &&
        event !== 'item/updated' &&
        event !== 'item/error' &&
        event !== 'item/login_succeeded'
      ) {
        return;
      }

      let userId = clientUserId;
      let institutionId: string | null = null;
      let institutionName: string | null = null;
      let status: ItemStatus = event === 'item/error' ? 'error' : 'connected';

      try {
        const item = await BankIntegrationService.getItem(itemId);
        institutionId = item?.connector?.id != null ? String(item.connector.id) : null;
        institutionName = item?.connector?.name ?? null;
        status = event === 'item/error' ? 'error' : mapPluggyStatus(item?.status);
        if (!userId && item?.clientUserId) {
          userId = item.clientUserId;
        }
      } catch {
        // Mantém dados mínimos do payload
      }

      if (!userId) {
        // Sem usuário não há como associar — ignora
        return;
      }

      const { data: existing } = await supabase
        .from('open_finance_items')
        .select('id')
        .eq('provider', PROVIDER)
        .eq('item_id', itemId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('open_finance_items')
          .update({
            user_id: userId,
            institution_id: institutionId,
            institution_name: institutionName,
            status,
            last_sync_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        await supabase.from('open_finance_items').insert({
          user_id: userId,
          provider: PROVIDER,
          item_id: itemId,
          institution_id: institutionId,
          institution_name: institutionName,
          status,
          last_sync_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('[OpenFinanceWebhook] processing error', err);
    }
  }

  private async ensureItemOwned(userId: string, itemId: string) {
    const { data, error } = await supabase
      .from('open_finance_items')
      .select('*')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .maybeSingle();

    if (error) {
      return { ok: false as const, status: 400, message: error.message };
    }
    if (!data || data.status === 'disconnected') {
      return { ok: false as const, status: 404, message: 'Item not found' };
    }
    return { ok: true as const, row: data };
  }

  /**
   * Snapshot pode ser chamado logo após o widget (antes do webhook).
   * Nesse caso vinculamos o item ao usuário autenticado.
   */
  private async ensureItemOwnedOrLink(userId: string, itemId: string) {
    const owned = await this.ensureItemOwned(userId, itemId);
    if (owned.ok) return owned;

    try {
      const item = await BankIntegrationService.getItem(itemId);
      const clientUserId = item?.clientUserId as string | undefined;
      if (clientUserId && clientUserId !== userId) {
        return { ok: false as const, status: 403, message: 'Item belongs to another user' };
      }

      const institutionId =
        item?.connector?.id != null ? String(item.connector.id) : null;
      const institutionName = item?.connector?.name ?? null;

      const { data, error } = await supabase
        .from('open_finance_items')
        .upsert(
          {
            user_id: userId,
            provider: PROVIDER,
            item_id: itemId,
            institution_id: institutionId,
            institution_name: institutionName,
            status: mapPluggyStatus(item?.status),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'provider,item_id' }
        )
        .select()
        .single();

      if (error) {
        return { ok: false as const, status: 400, message: error.message };
      }
      return { ok: true as const, row: data };
    } catch (error: any) {
      return {
        ok: false as const,
        status: 404,
        message: error.message || 'Item not found at provider',
      };
    }
  }
}
