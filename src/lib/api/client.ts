function resolveApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  const isProduction = process.env.NODE_ENV === "production";

  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      throw new Error(`NEXT_PUBLIC_API_URL is invalid: "${configured}". Must be a valid URL (e.g. https://api.example.com).`);
    }
  }

  if (isProduction) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is required in production. " +
      "Set it in your deployment environment (e.g. Vercel Environment Variables) " +
      "to your Koa API origin (e.g. https://api.example.com)."
    );
  }

  // Development fallback only
  return "http://localhost:3001";
}

export const API_BASE_URL = resolveApiBaseUrl();

async function getClientAuthHeaders(): Promise<Record<string, string>> {
  // Attach the Supabase session token to Koa requests when running in the browser.
  if (typeof window === "undefined") return {};
  try {
    const { createClient } = await import("@/lib/supabase/client");
    const {
      data: { session },
    } = await createClient().auth.getSession();
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
  } catch {
    return {};
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const authHeaders = await getClientAuthHeaders();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...(init?.headers || {}),
    },
    credentials: 'include',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export const eventsApi = {
  list: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch<{ data: unknown[]; pagination: unknown }>(`/api/v1/events${q}`);
  },
  featured: (limit = 6) => apiFetch<{ data: unknown[] }>(`/api/v1/events/featured?limit=${limit}`),
  get: (id: string) => apiFetch<{ data: unknown }>(`/api/v1/events/${id}`),
  health: () => apiFetch<{ status: string }>(`/api/v1/events/health`),
};
