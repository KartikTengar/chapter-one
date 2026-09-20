import type { GameInstance } from "@/lib/hidden-trail/games-admin";

const BASE = "/api/admin/games";

interface ApiResponse<T> {
  data: T;
  error?: string;
}

async function api<T>(path: string, opts: RequestInit = {}): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...opts.headers },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data as ApiResponse<T>;
}

export const gamesClient = {
  list: () => api<GameInstance[]>("/"),
  get: (id: string) => api<GameInstance>(`/${id}`),
  create: (body: Record<string, unknown>) => api<GameInstance>("/", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Record<string, unknown>) => api<GameInstance>(`/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (id: string) => api<{ game_id: string; name: string; storage_cleaned: boolean }>(`/${id}`, { method: "DELETE" }),
  // Explicit lifecycle methods
  ready: (id: string) => api<GameInstance>(`/${id}/lifecycle`, { method: "POST", body: JSON.stringify({ action: "ready" }) }),
  start: (id: string) => api<GameInstance>(`/${id}/lifecycle`, { method: "POST", body: JSON.stringify({ action: "start" }) }),
  pause: (id: string) => api<GameInstance>(`/${id}/lifecycle`, { method: "POST", body: JSON.stringify({ action: "pause" }) }),
  resume: (id: string) => api<GameInstance>(`/${id}/lifecycle`, { method: "POST", body: JSON.stringify({ action: "resume" }) }),
  end: (id: string) => api<GameInstance>(`/${id}/lifecycle`, { method: "POST", body: JSON.stringify({ action: "end" }) }),
  archive: (id: string) => api<GameInstance>(`/${id}/lifecycle`, { method: "POST", body: JSON.stringify({ action: "archive" }) }),
  setCurrent: (id: string) => api<GameInstance>(`/${id}/lifecycle`, { method: "POST", body: JSON.stringify({ action: "setCurrent" }) }),
  readiness: (id: string) => api<{ passed: boolean; checks: unknown[]; level_count: number }>(`/${id}/lifecycle`, { method: "POST", body: JSON.stringify({ action: "readiness" }) }),
  duplicate: (id: string, name: string, slug: string) => api<GameInstance>(`/${id}/lifecycle`, { method: "POST", body: JSON.stringify({ action: "duplicate", name, slug }) }),
  // Generic action handler (fallback)
  action: (id: string, action: string, body?: Record<string, unknown>) =>
    api<GameInstance>(`/${id}/lifecycle`, { method: "POST", body: JSON.stringify({ action, ...body }) }),
};
