import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';

// Mock the Supabase admin client before importing the module
const mockGetUser = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

import { verifySupabaseToken } from '../src/services/supabase';

beforeAll(() => {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'dummy';
});

describe('Supabase token verification', () => {
  beforeEach(() => {
    mockGetUser.mockReset();
  });

  it('verifies a valid token and returns payload', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user123',
          email: 'test@example.com',
          role: 'authenticated',
        },
      },
      error: null,
    });

    const payload = await verifySupabaseToken('valid-token');
    expect(payload.sub).toBe('user123');
    expect(payload.email).toBe('test@example.com');
    expect(payload.role).toBe('authenticated');
  });

  it('returns user data with all fields from Supabase', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user456',
          email: 'another@test.com',
          role: 'authenticated',
        },
      },
      error: null,
    });

    const payload = await verifySupabaseToken('valid-token');
    expect(payload.sub).toBe('user456');
    expect(payload.email).toBe('another@test.com');
    expect(payload.role).toBe('authenticated');
  });

  it('throws when token is invalid (Supabase returns error)', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid JWT' },
    });

    await expect(verifySupabaseToken('invalid-token')).rejects.toThrow('Invalid token');
  });

  it('throws when token is invalid (Supabase returns no user)', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await expect(verifySupabaseToken('invalid-token')).rejects.toThrow('Invalid token');
  });
});
