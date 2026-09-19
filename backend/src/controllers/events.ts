import { Router } from '@koa/router';
import { getSupabaseAdmin, requireAdmin, requireUser } from '../services/supabase.js';

function getAdmin() {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('Supabase admin client not configured');
  return admin;
}
import { z } from 'zod';

// Event schema (matches Supabase table)
const eventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  event_date: z.string().datetime(),
  location: z.string(),
  category: z.string(),
  image_url: z.string().nullable(),
  max_participants: z.number().int().nonnegative().nullable(),
  created_at: z.string().datetime(),
  featured: z.boolean().optional(),
  registration_open: z.boolean().optional(),
  ends_at: z.string().datetime().nullable().optional(),
});

// Pagination schema
const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// Create router with prefix
export const eventsRouter = new Router({ prefix: '/api/v1/events' });

// GET /health - already handled in app.ts, but keeping for completeness
eventsRouter.get('/health', async (ctx) => {
  ctx.status = 200;
  ctx.body = { status: 'ok', timestamp: new Date().toISOString() };
});

// GET / - List events with filtering, search, pagination
eventsRouter.get('/', async (ctx) => {
  try {
    // Parse and validate query params
    const queryParams = paginationSchema.parse({
      page: Number(ctx.query.page) || 1,
      limit: Number(ctx.query.limit) || 20,
    });

    const { page, limit } = queryParams;
    const offset = (page - 1) * limit;

    // Build Supabase query
    let query = getAdmin()
      .from('events')
      .select('*', { count: 'exact' })
      .order('event_date', { ascending: true });

    // Apply filters
    if (ctx.query.category) {
      query = query.eq('category', ctx.query.category as string);
    }

    if (ctx.query.q) {
      const searchTerm = (ctx.query.q as string).trim();
      if (searchTerm) {
        query = query.or(
          `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`
        );
      }
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data, error, count } = await query;

    if (error) throw error;

    // Parse and validate events
    const events = eventSchema.array().parse(data);

    // Prepare response
    ctx.body = {
      data: events,
      pagination: {
        page,
        limit,
        total: count ?? 0,
        pages: Math.ceil((count ?? 0) / limit),
      },
      filters: {
        category: ctx.query.category || undefined,
        search: ctx.query.q || undefined,
      },
    };
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      ctx.status = 400;
      ctx.body = { error: 'Validation failed', details: err.errors };
    } else {
      throw err; // Let error middleware handle it
    }
  }
});

// GET /featured - Get featured events (upcoming, limited)
eventsRouter.get('/featured', async (ctx) => {
  try {
    const limit = Number(ctx.query.limit) || 6;

    const { data, error } = await getAdmin()
      .from('events')
      .select('*')
      .gte('event_date', new Date().toISOString())
      .order('event_date', { ascending: true })
      .limit(limit);

    if (error) throw error;

    const events = eventSchema.array().parse(data);
    ctx.body = { data: events };
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      ctx.status = 400;
      ctx.body = { error: 'Validation failed', details: err.errors };
    } else {
      throw err;
    }
  }
});

// GET /:id - Get single event by ID
eventsRouter.get('/:id', async (ctx) => {
  const { id } = ctx.params;

  if (!id) {
    ctx.status = 400;
    ctx.body = { error: 'Bad Request', message: 'Event ID is required' };
    return;
  }

  try {
    const { data, error } = await getAdmin()
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        ctx.status = 404;
        ctx.body = { error: 'Not Found', message: 'Event not found' };
        return;
      }
      throw error;
    }

    if (!data) {
      ctx.status = 404;
      ctx.body = { error: 'Not Found', message: 'Event not found' };
      return;
    }

    const event = eventSchema.parse(data);
    ctx.body = { data: event };
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      ctx.status = 400;
      ctx.body = { error: 'Validation failed', details: err.errors };
    } else {
      throw err;
    }
  }
});

// POST / - Create new event (admin only)
eventsRouter.post('/', requireAdmin(), async (ctx) => {
  try {
    // Validate request body
    const eventData = eventSchema.omit({ id: true, created_at: true }).parse(ctx.request.body);

    const { data, error } = await getAdmin()
      .from('events')
      .insert([eventData])
      .select()
      .single();

    if (error) throw error;

    const event = eventSchema.parse(data);
    ctx.status = 201;
    ctx.body = { data: event };
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      ctx.status = 400;
      ctx.body = { error: 'Validation failed', details: err.errors };
    } else {
      throw err;
    }
  }
});

// PUT /:id - Update event (admin only)
eventsRouter.put('/:id', requireAdmin(), async (ctx) => {
  const { id } = ctx.params;

  if (!id) {
    ctx.status = 400;
    ctx.body = { error: 'Bad Request', message: 'Event ID is required' };
    return;
  }

  try {
    // Validate request body (partial update allowed)
    const eventData = eventSchema.partial().omit({ id: true, created_at: true }).parse(ctx.request.body);

    if (Object.keys(eventData).length === 0) {
      ctx.status = 400;
      ctx.body = { error: 'Bad Request', message: 'No valid fields to update' };
      return;
    }

    const { data, error } = await getAdmin()
      .from('events')
      .update(eventData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        ctx.status = 404;
        ctx.body = { error: 'Not Found', message: 'Event not found' };
        return;
      }
      throw error;
    }

    if (!data) {
      ctx.status = 404;
      ctx.body = { error: 'Not Found', message: 'Event not found' };
      return;
    }

    const event = eventSchema.parse(data);
    ctx.body = { data: event };
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      ctx.status = 400;
      ctx.body = { error: 'Validation failed', details: err.errors };
    } else {
      throw err;
    }
  }
});

// GET /:id/capacity - Get event capacity
eventsRouter.get('/:id/capacity', async (ctx) => {
  const { id } = ctx.params;
  if (!id) {
    ctx.status = 400;
    ctx.body = { error: 'Bad Request', message: 'Event ID is required' };
    return;
  }
  try {
    const [{ count }, { data: event, error }] = await Promise.all([
      getAdmin().from('event_registrations').select('*', { count: 'exact', head: true }).eq('event_id', id),
      getAdmin().from('events').select('max_participants').eq('id', id).single(),
    ]);
    if (error) throw error;
    ctx.body = { data: { registered: count ?? 0, max: event?.max_participants ?? null } };
  } catch {
    ctx.status = 500;
    ctx.body = { error: 'Failed to fetch capacity' };
  }
});

// POST /:id/register - Register for event
eventsRouter.post('/:id/register', requireUser(), async (ctx) => {
  const { id } = ctx.params;
  const user = ctx.state.user;
  if (!id || !user?.id) {
    ctx.status = 400;
    ctx.body = { error: 'Bad Request', message: 'Event ID and user required' };
    return;
  }
  try {
    const { data: event, error: eventError } = await getAdmin().from('events').select('*').eq('id', id).single();
    if (eventError || !event) {
      ctx.status = 404;
      ctx.body = { error: 'Not Found', message: 'Event not found' };
      return;
    }
    const now = new Date();
    const eventDate = new Date(event.event_date);
    if (event.ends_at && new Date(event.ends_at) < now) {
      ctx.status = 403;
      ctx.body = { error: 'Forbidden', message: 'Event has ended' };
      return;
    }
    if (eventDate < now) {
      ctx.status = 403;
      ctx.body = { error: 'Forbidden', message: 'Event has ended' };
      return;
    }
    if (event.registration_open === false) {
      ctx.status = 403;
      ctx.body = { error: 'Forbidden', message: 'Registration closed' };
      return;
    }
    // Check existing registration
    const { data: existing } = await getAdmin().from('event_registrations').select('id').eq('event_id', id).eq('user_id', user.id).maybeSingle();
    if (existing) {
      ctx.status = 409;
      ctx.body = { error: 'Conflict', message: 'Already registered' };
      return;
    }
    // Check capacity
    if (event.max_participants != null) {
      const { count } = await getAdmin().from('event_registrations').select('*', { count: 'exact', head: true }).eq('event_id', id);
      if ((count ?? 0) >= event.max_participants) {
        ctx.status = 403;
        ctx.body = { error: 'Forbidden', message: 'Event full' };
        return;
      }
    }
    const { error: insertError } = await getAdmin().from('event_registrations').insert({ user_id: user.id, event_id: id });
    if (insertError) {
      if (insertError.code === '23505') {
        ctx.status = 409;
        ctx.body = { error: 'Conflict', message: 'Already registered' };
        return;
      }
      throw insertError;
    }
    ctx.status = 201;
    ctx.body = { data: { registered: true } };
  } catch (err: unknown) {
    const e = err as { status?: number };
    if (e?.status) throw err;
    ctx.status = 500;
    ctx.body = { error: 'Registration failed' };
  }
});

// DELETE /:id/registration - Cancel registration
eventsRouter.delete('/:id/registration', requireUser(), async (ctx) => {
  const { id } = ctx.params;
  const user = ctx.state.user;
  if (!id || !user?.id) {
    ctx.status = 400;
    ctx.body = { error: 'Bad Request', message: 'Event ID and user required' };
    return;
  }
  try {
    const { error } = await getAdmin().from('event_registrations').delete().eq('event_id', id).eq('user_id', user.id);
    if (error) throw error;
    ctx.status = 204;
    ctx.body = null;
  } catch {
    ctx.status = 500;
    ctx.body = { error: 'Failed to cancel registration' };
  }
});

// DELETE /:id - Delete event (admin only)
eventsRouter.delete('/:id', requireAdmin(), async (ctx) => {
  const { id } = ctx.params;

  if (!id) {
    ctx.status = 400;
    ctx.body = { error: 'Bad Request', message: 'Event ID is required' };
    return;
  }

  try {
    const { error } = await getAdmin()
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === 'PGRST116') {
        ctx.status = 404;
        ctx.body = { error: 'Not Found', message: 'Event not found' };
        return;
      }
      throw error;
    }

    ctx.status = 204;
    ctx.body = null;
  } catch (err: unknown) {
    throw err; // Let error middleware handle it
  }
});