import { apiFetch } from "./client";
import type { EventPreview, FeaturedEvent } from "./types";

function isBoundedString(value: unknown, max: number): value is string {
  if (typeof value !== "string" || value.length > max || !value.trim()
    || value !== value.trim()
    || Array.from(value).some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) return false;
  try {
    encodeURIComponent(value);
    return true;
  } catch {
    return false;
  }
}

function isTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 29) return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(?:\.\d{1,3})?(Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return year > 0 && month >= 1 && month <= 12
    && day >= 1 && day <= days[month - 1]
    && Number.isFinite(Date.parse(value));
}

function isCoverUrl(value: unknown): value is NonNullable<EventPreview["cover_url"]> {
  return isBoundedString(value, 512)
    && /^\/images\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*\.(?:jpe?g|png|webp|avif)$/i.test(value)
    && value.startsWith("/images/");
}

function isEventPreview(value: unknown): value is EventPreview {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const event = value as Record<string, unknown>;
  return isBoundedString(event.id, 128)
    && event.id !== "." && event.id !== ".."
    && isBoundedString(event.title, 160)
    && isBoundedString(event.category, 80)
    && isBoundedString(event.venue, 240)
    && isTimestamp(event.starts_at)
    && (event.ends_at === undefined || (isTimestamp(event.ends_at)
      && Date.parse(event.ends_at) > Date.parse(event.starts_at)))
    && (event.cover_url === undefined || isCoverUrl(event.cover_url))
    && typeof event.registration_open === "boolean"
    && (event.featured === undefined || typeof event.featured === "boolean")
    && event.is_demo === undefined;
}

export async function getEventPreviews(): Promise<EventPreview[] | null> {
  try {
    const events = await apiFetch<unknown[]>(`/api/v1/events?preview=true`);
    if (!Array.isArray(events) || !events.every(isEventPreview)
      || new Set(events.map((event) => event.id)).size !== events.length) return null;
    const now = Date.now();
    return events.filter((event) => Date.parse(event.starts_at) > now)
      .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at))
      .slice(0, 3);
  } catch {
    if (process.env.ENABLE_DEMO_EVENTS === "true" && process.env.NODE_ENV === "development") {
      try {
        const { getDevFallbackEvents } = await import("./fallback");
        return getDevFallbackEvents();
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function getFeaturedEvent(): Promise<FeaturedEvent | null> {
  try {
    const event = await apiFetch<unknown>(`/api/v1/events/featured`);
    if (!isEventPreview(event)) return null;
    const now = Date.now();
    return Date.parse(event.starts_at) > now
      || (event.ends_at !== undefined && Date.parse(event.ends_at) > now) ? event : null;
  } catch {
    if (process.env.ENABLE_DEMO_EVENTS === "true" && process.env.NODE_ENV === "development") {
      try {
        const { getDevFallbackEvents } = await import("./fallback");
        return getDevFallbackEvents().find((event) => event.featured) ?? null;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export type EventListItem = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string;
  category: string;
  image_url: string | null;
  max_participants: number | null;
  created_at: string;
  featured: boolean;
  registration_open: boolean;
  ends_at: string | null;
};

export async function getEventsList(params?: { category?: string; q?: string; page?: number; limit?: number }): Promise<EventListItem[]> {
  const qs = new URLSearchParams();
  if (params?.category) qs.set("category", params.category);
  if (params?.q) qs.set("q", params.q);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  const data = await apiFetch<{ data: EventListItem[] }>(`/api/v1/events?${qs.toString()}`);
  return data?.data ?? [];
}

export async function getEventDetail(id: string): Promise<EventListItem | null> {
  const data = await apiFetch<{ data: EventListItem }>(`/api/v1/events/${id}`);
  return data?.data ?? null;
}

export async function getEventCapacity(id: string): Promise<{ registered: number; max: number | null } | null> {
  const data = await apiFetch<{ data: { registered: number; max: number | null } }>(`/api/v1/events/${id}/capacity`);
  return data?.data ?? null;
}

export async function registerForEventApi(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await apiFetch(`/api/v1/events/${id}/register`, { method: "POST" });
    return { ok: true };
  } catch (e: unknown) {
    const msg = (e as { message?: string })?.message ?? "Registration failed";
    return { ok: false, error: msg };
  }
}

export async function cancelEventRegistrationApi(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await apiFetch(`/api/v1/events/${id}/registration`, { method: "DELETE" });
    return { ok: true };
  } catch (e: unknown) {
    const msg = (e as { message?: string })?.message ?? "Cancellation failed";
    return { ok: false, error: msg };
  }
}
