import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PaymentController } from '../../modules/payment/PaymentController';

function createMockReqRes(overrides: any = {}) {
  const req: any = {
    user: overrides.user || { id: 'user-1', userType: 'usuario' },
    body: overrides.body || {},
    headers: overrides.headers || {},
  };
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
  };
  return { req, res };
}

const mockUpdate = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockSelect = vi.fn().mockReturnThis();
const mockSingle = vi.fn();

vi.mock('../../config/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      update: mockUpdate,
      eq: mockEq,
      single: mockSingle,
    })),
  },
}));

describe('PaymentController Plan Upgrades', () => {
  let paymentController: PaymentController;

  beforeEach(() => {
    vi.clearAllMocks();
    paymentController = new PaymentController();
  });

  it('should update plan, origin and status in Supabase on updatePlan', async () => {
    mockSingle.mockResolvedValue({
      data: {
        id: 'user-1',
        plan: 'pro_usuario',
        subscription_origin: 'stripe',
        subscription_status: 'active',
      },
      error: null,
    });

    const { req, res } = createMockReqRes({
      user: { id: 'user-1', userType: 'usuario' },
      body: { plan: 'pro_usuario', origin: 'stripe' },
    });

    await paymentController.updatePlan(req, res);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        plan: 'pro_usuario',
        subscription_origin: 'stripe',
        subscription_status: 'active',
      })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringMatching(/sucesso/i),
      })
    );
  });

  it('should set origin to app_store or google_play on verifyPurchase', async () => {
    mockSingle.mockResolvedValue({
      data: {
        id: 'user-1',
        plan: 'pro_usuario',
        subscription_origin: 'app_store',
        subscription_status: 'active',
      },
      error: null,
    });

    const { req, res } = createMockReqRes({
      user: { id: 'user-1', userType: 'usuario' },
      body: { plan: 'pro_usuario', platform: 'ios' },
    });

    await paymentController.verifyPurchase(req, res);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        plan: 'pro_usuario',
        subscription_origin: 'app_store',
        subscription_status: 'active',
      })
    );
  });

  it('should enforce pro_empresa for empresa userType on upgrade', async () => {
    mockSingle.mockResolvedValue({
      data: {
        id: 'user-2',
        plan: 'pro_empresa',
        subscription_origin: 'stripe',
        subscription_status: 'active',
      },
      error: null,
    });

    const { req, res } = createMockReqRes({
      user: { id: 'user-2', userType: 'empresa' },
      body: { plan: 'free' },
    });

    await paymentController.updatePlan(req, res);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        plan: 'pro_empresa',
      })
    );
  });
});
