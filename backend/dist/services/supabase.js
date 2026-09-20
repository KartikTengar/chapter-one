import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
// Load backend environment variables for development
if (process.env.NODE_ENV !== 'production') {
    config({ path: resolve(process.cwd(), '.env') });
    config({ path: resolve(process.cwd(), 'backend', '.env') });
}
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Service role client for backend operations (bypasses RLS)
// Lazy create a Service‑role client
export function getSupabaseAdmin() {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        return null;
    }
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        }
    });
}
/**
 * Verify JWT token from Supabase and extract user payload
 * @param token The JWT token from Authorization header
 * @returns Promise resolving to user payload or throwing error
 */
export async function verifySupabaseToken(token) {
    const admin = getSupabaseAdmin();
    if (!admin)
        throw new Error('Supabase admin client not configured');
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user)
        throw new Error('Invalid token');
    return {
        sub: data.user.id,
        email: data.user.email ?? '',
        role: data.user.role ?? 'authenticated',
    };
}
/**
 * Extract and verify user from request headers
 * @param ctx Koa context
 * @returns Promise resolving to user object or null
 */
export async function getUserFromRequest(ctx) {
    const authHeader = ctx.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    try {
        const payload = await verifySupabaseToken(token);
        return {
            ...payload,
            id: payload.sub,
            email: payload.email,
            role: payload.role,
        };
    }
    catch {
        return null;
    }
}
/**
 * Middleware to require authenticated user
 */
export function requireUser() {
    return async (ctx, next) => {
        const user = await getUserFromRequest(ctx);
        if (!user) {
            ctx.status = 401;
            ctx.body = { error: 'Unauthorized', message: 'Valid authentication required' };
            return;
        }
        ctx.state.user = user;
        await next();
    };
}
/**
 * Middleware to require admin role
 *
 * The admin role is derived from the trusted profiles table (server-side),
 * never from JWT claims or browser state.
 */
export function requireAdmin() {
    return async (ctx, next) => {
        const user = ctx.state.user;
        if (!user) {
            ctx.status = 401;
            ctx.body = { error: 'Unauthorized', message: 'Authentication required' };
            return;
        }
        try {
            const admin = getSupabaseAdmin();
            const { data: profile } = await admin
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .maybeSingle();
            if (profile?.role !== 'admin') {
                ctx.status = 403;
                ctx.body = { error: 'Forbidden', message: 'Admin access required' };
                return;
            }
        }
        catch {
            ctx.status = 403;
            ctx.body = { error: 'Forbidden', message: 'Admin access required' };
            return;
        }
        await next();
    };
}
//# sourceMappingURL=supabase.js.map