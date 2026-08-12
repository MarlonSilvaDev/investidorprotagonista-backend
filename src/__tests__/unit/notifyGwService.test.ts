import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  sendSms,
  sendWhatsApp as notifyGwSendWhatsApp,
  sendTelegram,
  sendEmail as notifyGwSendEmail,
} from '../../core/utils/NotifyGwService';
import { sendVerificationCode, sendVerificationSms } from '../../core/utils/SmsService';
import { WhatsAppService } from '../../core/utils/WhatsAppService';
import {
  sendConfirmationEmail,
  sendPasswordResetEmail,
  sendSharedInviteEmail,
} from '../../core/utils/MailService';

describe('NotifyGwService & Channels Integration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, NOTIFY_GW: 'ngw_test_mock_key_123' };
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('NotifyGwService directly', () => {
    it('should send SMS with proper Authorization header and payload', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 202,
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ outbox_id: 101, status: 'queued' })),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await sendSms('11999998888', 'Test SMS');

      expect(result.ok).toBe(true);
      expect(result.outboxId).toBe(101);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.notifygw.com/api/v1/sms',
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: 'Bearer ngw_test_mock_key_123',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ to: '+11999998888', message: 'Test SMS' }),
        }),
      );
    });

    it('should send WhatsApp with instance if provided', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 202,
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ outbox_id: 102, status: 'queued' })),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await notifyGwSendWhatsApp('+5511999997777', 'Hello WA', 'inst-1');

      expect(result.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.notifygw.com/api/v1/whatsapp',
        expect.objectContaining({
          body: JSON.stringify({
            to: '+5511999997777',
            message: 'Hello WA',
            instance: 'inst-1',
          }),
        }),
      );
    });

    it('should send Telegram message', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 202,
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ outbox_id: 103, status: 'queued' })),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await sendTelegram('chat_12345', 'Hello TG');

      expect(result.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.notifygw.com/api/v1/telegram',
        expect.objectContaining({
          body: JSON.stringify({ to: 'chat_12345', message: 'Hello TG' }),
        }),
      );
    });

    it('should send Email via NotifyGW', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 202,
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ outbox_id: 104, status: 'queued' })),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await notifyGwSendEmail('user@test.com', 'Subject', '<h1>Body</h1>');

      expect(result.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.notifygw.com/api/v1/email',
        expect.objectContaining({
          body: JSON.stringify({ to: 'user@test.com', subject: 'Subject', message: '<h1>Body</h1>' }),
        }),
      );
    });

    it('should handle API errors gracefully', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 401,
        ok: false,
        text: () => Promise.resolve('{"detail": "Invalid API key"}'),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await sendSms('11999998888', 'Fail SMS');

      expect(result.ok).toBe(false);
      expect(result.error).toContain('Invalid API key');
    });

    it('should return error if NOTIFY_GW env is missing', async () => {
      delete process.env.NOTIFY_GW;
      const result = await sendSms('11999998888', 'No Key');

      expect(result.ok).toBe(false);
      expect(result.error).toContain('NOTIFY_GW não está definida');
    });
  });

  describe('SmsService wrapper', () => {
    it('should send verification code via whatsapp by default', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 202,
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ outbox_id: 201 })),
      });
      vi.stubGlobal('fetch', mockFetch);

      const ok = await sendVerificationCode({ to: '11988887777', code: '123456', locale: 'pt' });
      expect(ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.notifygw.com/api/v1/whatsapp',
        expect.anything(),
      );
    });

    it('should send verification code via sms when specified', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 202,
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ outbox_id: 202 })),
      });
      vi.stubGlobal('fetch', mockFetch);

      const ok = await sendVerificationSms({ to: '11988887777', code: '654321', locale: 'en' });
      expect(ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.notifygw.com/api/v1/sms',
        expect.anything(),
      );
    });
  });

  describe('WhatsAppService wrapper', () => {
    it('should send message via NotifyGW without throwing', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 202,
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ outbox_id: 301 })),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(WhatsAppService.sendMessage('11977776666', 'Asset alert')).resolves.not.toThrow();
    });
  });

  describe('MailService wrapper', () => {
    it('should send confirmation email via NotifyGW', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 202,
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ outbox_id: 401 })),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(
        sendConfirmationEmail({
          to: 'test@example.com',
          confirmUrl: 'http://localhost:3000/confirm',
          locale: 'pt',
        }),
      ).resolves.not.toThrow();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.notifygw.com/api/v1/email',
        expect.objectContaining({
          body: expect.stringContaining('http://localhost:3000/confirm'),
        }),
      );
    });

    it('should throw error when NotifyGW fails for mail', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 500,
        ok: false,
        text: () => Promise.resolve('Gateway Error'),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(
        sendPasswordResetEmail({
          to: 'test@example.com',
          resetUrl: 'http://localhost:3000/reset',
        }),
      ).rejects.toThrow('Falha ao enviar e-mail');
    });
  });
});
