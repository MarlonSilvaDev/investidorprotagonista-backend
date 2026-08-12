"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const NotifyGwService_1 = require("../../core/utils/NotifyGwService");
const SmsService_1 = require("../../core/utils/SmsService");
const WhatsAppService_1 = require("../../core/utils/WhatsAppService");
const MailService_1 = require("../../core/utils/MailService");
(0, vitest_1.describe)('NotifyGwService & Channels Integration', () => {
    const originalEnv = process.env;
    (0, vitest_1.beforeEach)(() => {
        process.env = { ...originalEnv, NOTIFY_GW: 'ngw_test_mock_key_123' };
        vitest_1.vi.stubGlobal('fetch', vitest_1.vi.fn());
    });
    (0, vitest_1.afterEach)(() => {
        process.env = originalEnv;
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.describe)('NotifyGwService directly', () => {
        (0, vitest_1.it)('should send SMS with proper Authorization header and payload', async () => {
            const mockFetch = vitest_1.vi.fn().mockResolvedValue({
                status: 202,
                ok: true,
                text: () => Promise.resolve(JSON.stringify({ outbox_id: 101, status: 'queued' })),
            });
            vitest_1.vi.stubGlobal('fetch', mockFetch);
            const result = await (0, NotifyGwService_1.sendSms)('11999998888', 'Test SMS');
            (0, vitest_1.expect)(result.ok).toBe(true);
            (0, vitest_1.expect)(result.outboxId).toBe(101);
            (0, vitest_1.expect)(mockFetch).toHaveBeenCalledWith('https://api.notifygw.com/api/v1/sms', vitest_1.expect.objectContaining({
                method: 'POST',
                headers: {
                    Authorization: 'Bearer ngw_test_mock_key_123',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ to: '+11999998888', message: 'Test SMS' }),
            }));
        });
        (0, vitest_1.it)('should send WhatsApp with instance if provided', async () => {
            const mockFetch = vitest_1.vi.fn().mockResolvedValue({
                status: 202,
                ok: true,
                text: () => Promise.resolve(JSON.stringify({ outbox_id: 102, status: 'queued' })),
            });
            vitest_1.vi.stubGlobal('fetch', mockFetch);
            const result = await (0, NotifyGwService_1.sendWhatsApp)('+5511999997777', 'Hello WA', 'inst-1');
            (0, vitest_1.expect)(result.ok).toBe(true);
            (0, vitest_1.expect)(mockFetch).toHaveBeenCalledWith('https://api.notifygw.com/api/v1/whatsapp', vitest_1.expect.objectContaining({
                body: JSON.stringify({
                    to: '+5511999997777',
                    message: 'Hello WA',
                    instance: 'inst-1',
                }),
            }));
        });
        (0, vitest_1.it)('should send Telegram message', async () => {
            const mockFetch = vitest_1.vi.fn().mockResolvedValue({
                status: 202,
                ok: true,
                text: () => Promise.resolve(JSON.stringify({ outbox_id: 103, status: 'queued' })),
            });
            vitest_1.vi.stubGlobal('fetch', mockFetch);
            const result = await (0, NotifyGwService_1.sendTelegram)('chat_12345', 'Hello TG');
            (0, vitest_1.expect)(result.ok).toBe(true);
            (0, vitest_1.expect)(mockFetch).toHaveBeenCalledWith('https://api.notifygw.com/api/v1/telegram', vitest_1.expect.objectContaining({
                body: JSON.stringify({ to: 'chat_12345', message: 'Hello TG' }),
            }));
        });
        (0, vitest_1.it)('should send Email via NotifyGW', async () => {
            const mockFetch = vitest_1.vi.fn().mockResolvedValue({
                status: 202,
                ok: true,
                text: () => Promise.resolve(JSON.stringify({ outbox_id: 104, status: 'queued' })),
            });
            vitest_1.vi.stubGlobal('fetch', mockFetch);
            const result = await (0, NotifyGwService_1.sendEmail)('user@test.com', 'Subject', '<h1>Body</h1>');
            (0, vitest_1.expect)(result.ok).toBe(true);
            (0, vitest_1.expect)(mockFetch).toHaveBeenCalledWith('https://api.notifygw.com/api/v1/email', vitest_1.expect.objectContaining({
                body: JSON.stringify({ to: 'user@test.com', subject: 'Subject', message: '<h1>Body</h1>' }),
            }));
        });
        (0, vitest_1.it)('should handle API errors gracefully', async () => {
            const mockFetch = vitest_1.vi.fn().mockResolvedValue({
                status: 401,
                ok: false,
                text: () => Promise.resolve('{"detail": "Invalid API key"}'),
            });
            vitest_1.vi.stubGlobal('fetch', mockFetch);
            const result = await (0, NotifyGwService_1.sendSms)('11999998888', 'Fail SMS');
            (0, vitest_1.expect)(result.ok).toBe(false);
            (0, vitest_1.expect)(result.error).toContain('Invalid API key');
        });
        (0, vitest_1.it)('should return error if NOTIFY_GW env is missing', async () => {
            delete process.env.NOTIFY_GW;
            const result = await (0, NotifyGwService_1.sendSms)('11999998888', 'No Key');
            (0, vitest_1.expect)(result.ok).toBe(false);
            (0, vitest_1.expect)(result.error).toContain('NOTIFY_GW não está definida');
        });
    });
    (0, vitest_1.describe)('SmsService wrapper', () => {
        (0, vitest_1.it)('should send verification code via whatsapp by default', async () => {
            const mockFetch = vitest_1.vi.fn().mockResolvedValue({
                status: 202,
                ok: true,
                text: () => Promise.resolve(JSON.stringify({ outbox_id: 201 })),
            });
            vitest_1.vi.stubGlobal('fetch', mockFetch);
            const ok = await (0, SmsService_1.sendVerificationCode)({ to: '11988887777', code: '123456', locale: 'pt' });
            (0, vitest_1.expect)(ok).toBe(true);
            (0, vitest_1.expect)(mockFetch).toHaveBeenCalledWith('https://api.notifygw.com/api/v1/whatsapp', vitest_1.expect.anything());
        });
        (0, vitest_1.it)('should send verification code via sms when specified', async () => {
            const mockFetch = vitest_1.vi.fn().mockResolvedValue({
                status: 202,
                ok: true,
                text: () => Promise.resolve(JSON.stringify({ outbox_id: 202 })),
            });
            vitest_1.vi.stubGlobal('fetch', mockFetch);
            const ok = await (0, SmsService_1.sendVerificationSms)({ to: '11988887777', code: '654321', locale: 'en' });
            (0, vitest_1.expect)(ok).toBe(true);
            (0, vitest_1.expect)(mockFetch).toHaveBeenCalledWith('https://api.notifygw.com/api/v1/sms', vitest_1.expect.anything());
        });
    });
    (0, vitest_1.describe)('WhatsAppService wrapper', () => {
        (0, vitest_1.it)('should send message via NotifyGW without throwing', async () => {
            const mockFetch = vitest_1.vi.fn().mockResolvedValue({
                status: 202,
                ok: true,
                text: () => Promise.resolve(JSON.stringify({ outbox_id: 301 })),
            });
            vitest_1.vi.stubGlobal('fetch', mockFetch);
            await (0, vitest_1.expect)(WhatsAppService_1.WhatsAppService.sendMessage('11977776666', 'Asset alert')).resolves.not.toThrow();
        });
    });
    (0, vitest_1.describe)('MailService wrapper', () => {
        (0, vitest_1.it)('should send confirmation email via NotifyGW', async () => {
            const mockFetch = vitest_1.vi.fn().mockResolvedValue({
                status: 202,
                ok: true,
                text: () => Promise.resolve(JSON.stringify({ outbox_id: 401 })),
            });
            vitest_1.vi.stubGlobal('fetch', mockFetch);
            await (0, vitest_1.expect)((0, MailService_1.sendConfirmationEmail)({
                to: 'test@example.com',
                confirmUrl: 'http://localhost:3000/confirm',
                locale: 'pt',
            })).resolves.not.toThrow();
            (0, vitest_1.expect)(mockFetch).toHaveBeenCalledWith('https://api.notifygw.com/api/v1/email', vitest_1.expect.objectContaining({
                body: vitest_1.expect.stringContaining('http://localhost:3000/confirm'),
            }));
        });
        (0, vitest_1.it)('should throw error when NotifyGW fails for mail', async () => {
            const mockFetch = vitest_1.vi.fn().mockResolvedValue({
                status: 500,
                ok: false,
                text: () => Promise.resolve('Gateway Error'),
            });
            vitest_1.vi.stubGlobal('fetch', mockFetch);
            await (0, vitest_1.expect)((0, MailService_1.sendPasswordResetEmail)({
                to: 'test@example.com',
                resetUrl: 'http://localhost:3000/reset',
            })).rejects.toThrow('Falha ao enviar e-mail');
        });
    });
});
//# sourceMappingURL=notifyGwService.test.js.map