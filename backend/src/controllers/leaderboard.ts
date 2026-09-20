import { Router } from '@koa/router';
import { getSupabaseAdmin } from '../services/supabase.js';
import { deriveDisplayName, type DisplayNameMode } from '../utils/trail.js';

type SelectBuilder = {
  eq: (col: string, val: unknown) => SelectBuilder & Promise<{ data: unknown[] | null; error: unknown }>;
  limit: (n: number) => SelectBuilder & Promise<{ data: unknown[] | null; error: unknown }>;
  order: (col: string, opts?: { ascending?: boolean }) => SelectBuilder & Promise<{ data: unknown[] | null; error: unknown }>;
  maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: unknown }>;
  single: () => Promise<{ data: Record<string, unknown> | null; error: unknown }>;
};

type SupabaseClient = {
  from: (table: string) => {
    select: (cols: string) => SelectBuilder & Promise<{ data: unknown[] | null; error: unknown }>;
  };
};

function getAdmin(): SupabaseClient {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('Supabase admin client not configured');
  return admin as unknown as SupabaseClient;
}

export const leaderboardRouter = new Router({ prefix: '/api/v1/leaderboard' });

async function getDisplayName(admin: SupabaseClient, userId: string): Promise<string> {
  const { data } = await admin.from('profiles').select('full_name').eq('id', userId).single();
  return (data as Record<string, unknown>)?.full_name ? String((data as Record<string, unknown>).full_name) : 'Student';
}

/** Public sanitized live snapshot for the big-screen display. */
leaderboardRouter.get('/live', async (ctx) => {
  try {
    const admin = getAdmin();
    const { data: gameRaw, error: gErr } = await admin.from('qr_games').select('*').eq('slug', 'hidden-trail').maybeSingle();
    if (gErr) throw gErr;

    if (!gameRaw) {
      ctx.body = { configured: false, status: 'NOT_CONFIGURED', entries: [], active: 0, completed: 0, recent: [] };
      return;
    }
    const game = gameRaw as Record<string, unknown>;
    const mode = (game.leaderboard_name_mode as DisplayNameMode) ?? 'FIRST_NAME';

    if (game.live_display_enabled === false) {
      ctx.body = { configured: true, status: String(game.status), live_display_enabled: false, entries: [], active: 0, completed: 0, recent: [] };
      return;
    }

    const [participantsRes, recentRes] = await Promise.all([
      admin.from('qr_participants').select('user_id, total_points, status, completed_at').eq('game_id', String(game.id)).order('total_points', { ascending: false }).order('completed_at', { ascending: true }),
      admin.from('qr_completions').select('user_id, level_id, points_awarded, answered_at, qr_levels(level_number)').eq('game_id', String(game.id)).order('answered_at', { ascending: false }).limit(12),
    ]);

    const rows = (participantsRes.data ?? []) as Array<{ user_id: string; total_points: number; status: string; completed_at: string | null }>;
    const recent = (recentRes.data ?? []) as Array<{ user_id: string; points_awarded: number; answered_at: string; qr_levels: Array<{ level_number: number }> | null }>;

    const entries = [];
    for (let i = 0; i < rows.length; i++) {
      const name = await getDisplayName(admin, rows[i].user_id);
      entries.push({
        rank: i + 1,
        display_name: deriveDisplayName(name, mode),
        score: Number(rows[i].total_points || 0),
      });
    }

    const active = rows.filter((r) => r.status === 'active').length;
    const completed = rows.filter((r) => r.status === 'completed').length;

    const recentEvents = [];
    for (const r of recent) {
      const name = await getDisplayName(admin, r.user_id);
      recentEvents.push({
        display_name: deriveDisplayName(name, mode),
        level: r.qr_levels?.[0]?.level_number ?? null,
        points: Number(r.points_awarded || 0),
        occurred_at: r.answered_at,
      });
    }

    ctx.body = {
      configured: true,
      status: String(game.status),
      live_display_enabled: true,
      entries,
      active,
      completed,
      total: entries.length,
      recent: recentEvents,
    };
  } catch {
    ctx.status = 500;
    ctx.body = { error: 'Failed to load live leaderboard' };
  }
});

leaderboardRouter.get('/master', async (ctx) => {
  try {
    const admin = getAdmin();
    const { data: gameResultsRaw, error: grErr } = await admin.from('game_results').select('user_id, master_points, completed_at');
    if (grErr) throw grErr;
    const { data: hiddenResultsRaw, error: htErr } = await admin.from('hidden_trail_results').select('user_id, master_points, completed_at');
    if (htErr) throw htErr;

    type ResultRow = { user_id: string; master_points: number | null; completed_at: string | null };
    const gameResults = (gameResultsRaw ?? []) as ResultRow[];
    const hiddenResults = (hiddenResultsRaw ?? []) as ResultRow[];

    const pointsMap = new Map<string, { master_points: number, completed_at: string | null }>();
    for (const r of gameResults) {
      const cur = pointsMap.get(r.user_id) ?? { master_points: 0, completed_at: null };
      cur.master_points += Number(r.master_points || 0);
      pointsMap.set(r.user_id, cur);
    }
    for (const r of hiddenResults) {
      const cur = pointsMap.get(r.user_id) ?? { master_points: 0, completed_at: null };
      cur.master_points += Number(r.master_points || 0);
      pointsMap.set(r.user_id, cur);
    }

    const entries = Array.from(pointsMap.entries()).map(([user_id, v]) => ({ user_id, ...v }));
    entries.sort((a, b) => b.master_points - a.master_points || (a.completed_at ? +new Date(a.completed_at) : 0) - (b.completed_at ? +new Date(b.completed_at) : 0));

    const userId = ctx.state.user?.id;
    let meRank = null;
    let mePoints = 0;
    if (userId) {
      const idx = entries.findIndex(e => e.user_id === userId);
      if (idx >= 0) {
        meRank = idx + 1;
        mePoints = entries[idx].master_points;
      }
    }

    // Build display entries with names
    const displayEntries = [];
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      const name = await getDisplayName(admin, e.user_id);
      displayEntries.push({ rank: i + 1, display_name: name, master_points: e.master_points });
    }

    ctx.body = {
      entries: displayEntries,
      me: userId ? { rank: meRank, master_points: mePoints } : null,
      total: entries.length
    };
  } catch {
    ctx.status = 500;
    ctx.body = { error: 'Failed to load master leaderboard' };
  }
});

leaderboardRouter.get('/games/:slug', async (ctx) => {
  const { slug } = ctx.params;
  try {
    const admin = getAdmin();

    type GameEntry = { user_id: string; game_score: number; completed_at: string | null };
    let gameName = slug;
    let entries: GameEntry[] = [];

    if (slug === 'hidden-trail') {
      // Hidden Trail is managed in qr_games, not the legacy games table.
      // Resolve by slug/current game instead of requiring the old "active" status.
      const { data: gameRaw, error: gErr } = await admin
        .from('qr_games')
        .select('id, slug, name, status, is_current, leaderboard_public')
        .eq('slug', 'hidden-trail')
        .eq('is_current', true)
        .maybeSingle();

      if (gErr || !gameRaw) {
        ctx.status = 404;
        ctx.body = { error: 'Game not found' };
        return;
      }

      const game = gameRaw as Record<string, unknown>;
      gameName = String(game.name ?? 'Hidden Trail');

      if (game.leaderboard_public === false) {
        ctx.status = 403;
        ctx.body = { error: 'Leaderboard is private' };
        return;
      }

      const { data, error } = await admin
        .from('qr_participants')
        .select('user_id, total_points, completed_at')
        .eq('game_id', String(game.id))
        .order('total_points', { ascending: false })
        .order('completed_at', { ascending: true });

      if (error) throw error;

      const rows = (data ?? []) as Array<{
        user_id: string;
        total_points: number | null;
        completed_at: string | null;
      }>;

      entries = rows.map((row) => ({
        user_id: row.user_id,
        game_score: Number(row.total_points || 0),
        completed_at: row.completed_at,
      }));
    } else {
      // Other games still use the legacy games/game_results tables.
      const { data: gameRaw, error: gErr } = await admin
        .from('games')
        .select('*')
        .eq('slug', slug)
        .eq('is_visible', true)
        .single();

      if (gErr || !gameRaw) {
        ctx.status = 404;
        ctx.body = { error: 'Game not found' };
        return;
      }

      const game = gameRaw as Record<string, unknown>;
      gameName = String(game.name ?? slug);

      const gameId = String(game.id);
      const { data, error } = await admin
        .from('game_results')
        .select('user_id, game_score, completed_at')
        .eq('game_id', gameId);

      if (error) throw error;

      const rows = (data ?? []) as Array<{
        user_id: string;
        game_score: number | null;
        completed_at: string | null;
      }>;

      entries = rows.map((row) => ({
        user_id: row.user_id,
        game_score: Number(row.game_score || 0),
        completed_at: row.completed_at,
      }));
    }

    entries.sort(
      (a, b) =>
        b.game_score - a.game_score ||
        (a.completed_at ? +new Date(a.completed_at) : Number.MAX_SAFE_INTEGER) -
          (b.completed_at ? +new Date(b.completed_at) : Number.MAX_SAFE_INTEGER)
    );

    const userId = ctx.state.user?.id;
    let meRank: number | null = null;
    let meScore = 0;

    if (userId) {
      const idx = entries.findIndex((entry) => entry.user_id === userId);
      if (idx >= 0) {
        meRank = idx + 1;
        meScore = entries[idx].game_score;
      }
    }

    const displayEntries = [];
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const name = await getDisplayName(admin, entry.user_id);
      displayEntries.push({
        rank: i + 1,
        display_name: name,
        score: entry.game_score,
      });
    }

    ctx.body = {
      game: { slug: String(slug), name: gameName },
      entries: displayEntries,
      me: userId ? { rank: meRank, score: meScore } : null,
      total: entries.length,
    };
  } catch {
    ctx.status = 500;
    ctx.body = { error: 'Failed to load game leaderboard' };
  }
});
