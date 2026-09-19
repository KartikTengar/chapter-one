import { describe, it, expect, beforeAll } from 'vitest';
import { SignJWT } from 'jose';
import { verifySupabaseToken } from '../src/services/supabase';

const TEST_SECRET = 'testsecret';
const testSecretKey = new TextEncoder().encode(TEST_SECRET);

beforeAll(() => {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'dummy';
  process.env.SUPABASE_JWT_SECRET = TEST_SECRET;
});

describe('Supabase token verification', () => {
  it('verifies a valid token and returns payload', async () => {
    const token = await new SignJWT({
      sub: 'user123',
      email: 'test@example.com',
      role: 'admin',
      foo: 'bar'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer('supabase')
      .setAudience('authenticated')
      .setExpirationTime('1h')
      .sign(testSecretKey);

    const payload = await verifySupabaseToken(token);
    expect(payload.sub).toBe('user123');
    expect(payload.email).toBe('test@example.com');
    expect(payload.role).toBe('admin');
    expect(payload.foo).toBe('bar');
  });

  it('throws when token is invalid', async () => {
    const badToken = 'invalid.token.value';
    await expect(verifySupabaseToken(badToken)).rejects.toThrow('Invalid token');
  });
});
