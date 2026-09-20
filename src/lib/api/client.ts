function resolveApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  const isProduction = process.env.NODE_ENV === "production";

  if (configured) {
    try {
      return new URL(configured).origin.replace(/\/$/, "");
    } catch {
      throw new Error(`NEXT_PUBLIC_API_URL is invalid: "${configured}". Must be a valid URL (e.g. https://api.example.com).`);
    }
  }

  if (isProduction) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is required in production. " +
      "Set it in your deployment environment to your Koa API origin."
    );
  }

  return "http://localhost:3001";
}

let _apiBaseUrl: string | null = null;

export function getApiBaseUrl(): string {
  if (_apiBaseUrl === null) _apiBaseUrl = resolveApiBaseUrl();
  return _apiBaseUrl;
}

async function getClientAuthHeaders(): Promise<Record<string, string>> {
  if (typeof window === "undefined") return {};
  try {
    const { createClient } = await import("@/lib/supabase/client");
    const { data: { session } } = await createClient().auth.getSession();
    return session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {};
  } catch {
    return {};
  }
}

function isBodylessMethod(method?: string) {
  return method === "GET" || method === "HEAD";
}

async function readApiError(res: Response): Promise<string> {
  const raw = await res.text();
  if (!raw) return `Request failed (${res.status})`;
  try {
    const parsed = JSON.parse(raw) as {
      error?: { message?: string } | string;
      message?: string;
    };
    if (typeof parsed.error === "string") return parsed.error;
    if (parsed.error?.message) return parsed.error.message;
    if (parsed.message) return parsed.message;
  } catch {
    // Fall back to plain text.
  }
  return raw.slice(0, 500);
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const authHeaders = await getClientAuthHeaders();
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), 15000);
  const headers = new Headers(init.headers);

  if (!headers.has("Content-Type") && !isBodylessMethod(init.method)) {
    headers.set("Content-Type", "application/json");
  }
  Object.entries(authHeaders).forEach(([key, value]) => headers.set(key, value));

  try {
    const res = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      headers,
      credentials: "include",
      signal: init.signal ?? controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`API ${res.status}: ${await readApiError(res)}`);
    }

    if (res.status === 204) return undefined as T;

    const text = await res.text();
    if (!text) return undefined as T;

    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error("The server returned an invalid response.");
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("The request timed out. Please check your connection and try again.");
    }
    throw error;
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

export const eventsApi = {
  list: (params?: Record<string, string>) => {
    const q = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch<{ data: unknown[]; pagination: unknown }>(`/api/v1/events${q}`);
  },
  featured: (limit = 6) => apiFetch<{ data: unknown[] }>(`/api/v1/events/featured?limit=${limit}`),
  get: (id: string) => apiFetch<{ data: unknown }>(`/api/v1/events/${id}`),
  health: () => apiFetch<{ status: string }>(`/api/v1/events/health`),
};
