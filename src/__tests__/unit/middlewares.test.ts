import { describe, it, expect, beforeEach, vi } from 'vitest';

// ─── MOCK SUPABASE MODULE ───
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock('../../database/supabase', () => ({
  supabase: mockSupabase,
}));

// ─── ensureAuthenticated ───

import { ensureAuthenticated } from '../../infra/http/middlewares/ensureAuthenticated';
import { Request, Response, NextFunction } from 'express';

function createMockRequestAndResponse(overrides: Partial<Request & Response> = {}) {
  const mockReq = {
    headers: {},
    user: undefined as any,
    ...overrides,
  } as unknown as Request;

  const mockRes = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;

  const mockNext = vi.fn() as unknown as NextFunction;

  return { mockReq, mockRes, mockNext };
}

describe('ensureAuthenticated Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when no Authorization header', async () => {
    const { mockReq, mockRes, mockNext } = createMockRequestAndResponse({
      headers: {},
    });

    await ensureAuthenticated(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Token missing' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when Authorization header is "Bearer" only', async () => {
    const { mockReq, mockRes, mockNext } = createMockRequestAndResponse({
      headers: { authorization: 'Bearer ' },
    });

    await ensureAuthenticated(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Token missing' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when Supabase getUser returns error', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: null,
      error: { message: 'Invalid token' },
    });

    const { mockReq, mockRes, mockNext } = createMockRequestAndResponse({
      headers: { authorization: 'Bearer valid-token' },
    });

    await ensureAuthenticated(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid token' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when Supabase getUser returns no user', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const { mockReq, mockRes, mockNext } = createMockRequestAndResponse({
      headers: { authorization: 'Bearer valid-token' },
    });

    await ensureAuthenticated(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid token' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should call next() with user id when token is valid', async () => {
    const userId = 'user-123-abc';
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });

    const { mockReq, mockRes, mockNext } = createMockRequestAndResponse({
      headers: { authorization: 'Bearer valid-jwt-token' },
    });

    await ensureAuthenticated(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect((mockReq as any).user?.id).toBe(userId);
  });

  it('should handle exception in getUser', async () => {
    mockSupabase.auth.getUser.mockRejectedValue(new Error('Network error'));

    const { mockReq, mockRes, mockNext } = createMockRequestAndResponse({
      headers: { authorization: 'Bearer token' },
    });

    await ensureAuthenticated(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid token' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should extract token from "Bearer token" format', async () => {
    const userId = 'user-456';
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });

    const { mockReq, mockRes, mockNext } = createMockRequestAndResponse({
      headers: { authorization: 'Bearer my-token-here' },
    });

    await ensureAuthenticated(mockReq, mockRes, mockNext);

    expect(mockSupabase.auth.getUser).toHaveBeenCalledWith('my-token-here');
    expect(mockNext).toHaveBeenCalled();
  });
});

// ─── checkLicensing ───

import { checkLicensing } from '../../infra/http/middlewares/checkLicensing';

describe('checkLicensing Middleware', () => {
  const mockProfile = {
    subscription_status: 'active',
    subscription_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    trial_started_at: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 403 when profile not found', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
    });

    const { mockReq, mockRes, mockNext } = createMockRequestAndResponse({
      headers: {},
      user: { id: 'user-123' },
    } as any);

    await checkLicensing(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('profile not found') })
    );
  });

  it('should return 402 when license expired', async () => {
    const expiredProfile = {
      subscription_status: 'active',
      subscription_expires_at: new Date(Date.now() - 1000).toISOString(),
      trial_started_at: new Date().toISOString(),
    };

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: expiredProfile, error: null }),
    });

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: expiredProfile, error: null }),
    });

    // Mock the update call for expired status
    const mockUpdate = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: expiredProfile, error: null }),
      update: mockUpdate,
    });

    const { mockReq, mockRes, mockNext } = createMockRequestAndResponse({
      headers: {},
      user: { id: 'user-123' },
    } as any);

    await checkLicensing(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(402);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'LICENSE_EXPIRED' })
    );
  });

  it('should return 402 when subscription is canceled', async () => {
    const canceledProfile = {
      subscription_status: 'canceled',
      subscription_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      trial_started_at: new Date().toISOString(),
    };

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: canceledProfile, error: null }),
    });

    const { mockReq, mockRes, mockNext } = createMockRequestAndResponse({
      headers: {},
      user: { id: 'user-123' },
    } as any);

    await checkLicensing(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(402);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'SUBSCRIPTION_CANCELED' })
    );
  });

  it('should call next() when license is valid', async () => {
    const validProfile = {
      subscription_status: 'active',
      subscription_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      trial_started_at: new Date().toISOString(),
    };

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: validProfile, error: null }),
    });

    const { mockReq, mockRes, mockNext } = createMockRequestAndResponse({
      headers: {},
      user: { id: 'user-123' },
    } as any);

    await checkLicensing(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });
});
