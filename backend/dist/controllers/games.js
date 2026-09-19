import { Router } from '@koa/router';
import { getSupabaseAdmin } from '../services/supabase.js';
function getAdmin() {
    const admin = getSupabaseAdmin();
    if (!admin)
        throw new Error('Supabase admin client not configured');
    return admin;
}
// gameSchema removed - not used
export const gamesRouter = new Router({ prefix: '/api/v1/games' });
gamesRouter.get('/', async (ctx) => {
    try {
        const { data, error } = await getAdmin()
            .from('games')
            .select('*')
            .eq('is_visible', true)
            .order('starts_at', { ascending: true });
        if (error)
            throw error;
        ctx.body = { data: data ?? [] };
    }
    catch {
        ctx.status = 500;
        ctx.body = { error: 'Failed to fetch games' };
    }
});
gamesRouter.get('/running', async (ctx) => {
    try {
        const now = new Date().toISOString();
        const { data, error } = await getAdmin()
            .from('games')
            .select('*')
            .eq('is_visible', true)
            .eq('status', 'LIVE')
            .lte('starts_at', now)
            .or(`ends_at.is.null,ends_at.gte.${now}`);
        if (error)
            throw error;
        ctx.body = { data: data ?? [] };
    }
    catch {
        ctx.status = 500;
        ctx.body = { error: 'Failed to fetch running games' };
    }
});
gamesRouter.get('/:slug', async (ctx) => {
    const { slug } = ctx.params;
    if (!slug) {
        ctx.status = 400;
        ctx.body = { error: 'Slug required' };
        return;
    }
    try {
        const { data, error } = await getAdmin()
            .from('games')
            .select('*')
            .eq('slug', slug)
            .eq('is_visible', true)
            .single();
        if (error || !data) {
            ctx.status = 404;
            ctx.body = { error: 'Game not found' };
            return;
        }
        ctx.body = { data };
    }
    catch {
        ctx.status = 500;
        ctx.body = { error: 'Failed to fetch game' };
    }
});
//# sourceMappingURL=games.js.map