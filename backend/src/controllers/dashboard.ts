import { Router } from '@koa/router';
import { getSupabaseAdmin, requireUser } from '../services/supabase.js';

function getAdmin() {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('Supabase admin client not configured');
  return admin;
}

export const dashboardRouter = new Router({ prefix: '/api/v1/dashboard' });

dashboardRouter.get('/', requireUser(), async (ctx) => {
  const userId = ctx.state.user?.id;
  if (!userId) {
    ctx.status = 401;
    ctx.body = { error: 'Unauthorized' };
    return;
  }

  try {
    const admin = getAdmin();
    const now = new Date().toISOString();

    const [profileRes, registrationsRes, gameRes, participantRes, levelsRes] = await Promise.all([
      admin.from('profiles').select('full_name, branch, year').eq('id', userId).single(),
      admin
        .from('event_registrations')
        .select('event_id, events!inner(id, title, event_date, location, category)')
        .eq('user_id', userId),
      admin.from('qr_games').select('id, name, status').eq('status', 'active').order('start_at', { ascending: false }).limit(1).maybeSingle(),
      admin.from('qr_participants').select('*').eq('user_id', userId).maybeSingle(),
      admin.from('qr_levels').select('id', { count: 'exact' }).eq('is_active', true),
    ]);

    const profile = profileRes.data || null;
    if (profileRes.error && profileRes.error.code !== 'PGRST116') throw profileRes.error;

    // Filter + sort upcoming registrations in JS (embedded ordering is not
    // reliably supported by the current PostgREST version).
    const registrationsRaw = (registrationsRes.data || []) as unknown as Array<{ event_id: string; events: { id: string; title: string; event_date: string; location: string; category: string } | null }>;
    if (registrationsRes.error) throw registrationsRes.error;
    const registrations = registrationsRaw
      .map((r) => ({ ...r, events: r.events ?? null }))
      .filter((r): r is { event_id: string; events: { id: string; title: string; event_date: string; location: string; category: string } } =>
        !!r.events && !!r.events.event_date && new Date(r.events.event_date) >= new Date(now))
      .sort((a, b) => new Date(a.events.event_date).getTime() - new Date(b.events.event_date).getTime())
      .slice(0, 5);

    const upcomingEvent = registrations[0] ? {
      id: registrations[0].events.id,
      title: registrations[0].events.title,
      event_date: registrations[0].events.event_date,
      location: registrations[0].events.location,
      category: registrations[0].events.category,
    } : null;

    const registeredEvents = registrations.map(r => ({
      id: r.events.id,
      title: r.events.title,
      event_date: r.events.event_date,
      location: r.events.location,
      category: r.events.category,
    }));

    const game = gameRes.data || null;
    const participant = participantRes.data || null;

    let hiddenTrail = null;
    if (game) {
      const totalLevels = levelsRes.count ?? 0;
      const status = participant?.status ?? 'not_started';
      hiddenTrail = {
        game_id: game.id,
        game_name: game.name,
        status,
        current_level: participant?.current_level ?? 0,
        completed_levels: Math.max(0, (participant?.current_level ?? 0) - 1),
        total_levels: totalLevels,
        score: participant?.total_points ?? 0,
        started_at: participant?.started_at ?? null,
        completed_at: participant?.completed_at ?? null,
      };
    }

    ctx.body = {
      profile: {
        name: profile?.full_name ?? '',
        branch: profile?.branch ?? '',
        year: profile?.year ?? '',
      },
      upcomingEvent,
      registeredEvents,
      hiddenTrail,
    };
  } catch (err) {
    console.error('Dashboard load error:', err);
    ctx.status = 500;
    ctx.body = { error: 'Failed to load dashboard' };
  }
});
