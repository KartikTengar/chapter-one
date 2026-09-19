const BASE = "/api/admin/games";

async function api(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...opts.headers },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

export const gamesClient = {
  list: () => api("/"),
  get: (id: string) => api(`/${id}`),
  create: (body: Record<string, unknown>) => api("/", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Record<string, unknown>) => api(`/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (id: string) => api(`/${id}`, { method: "DELETE" }),
  // Explicit lifecycle methods
  ready: (id: string) => api(`/${id}/lifecycle`, { method: "POST", body: JSON.stringify({ action: "ready" }) }),
  start: (id: string) => api(`/${id}/lifecycle`, { method: "POST", body: JSON.stringify({ action: "start" }) }),
  pause: (id: string) => api(`/${id}/lifecycle`, { method: "POST", body: JSON.stringify({ action: "pause" }) }),
  resume: (id: string) => api(`/${id}/lifecycle`, { method: "POST", body: JSON.stringify({ action: "resume" }) }),
  end: (id: string) => api(`/${id}/lifecycle`, { method: "POST", body: JSON.stringify({ action: "end" }) }),
  archive: (id: string) => api(`/${id}/lifecycle`, { method: "POST", body: JSON.stringify({ action: "archive" }) }),
  setCurrent: (id: string) => api(`/${id}/lifecycle`, { method: "POST", body: JSON.stringify({ action: "setCurrent" }) }),
  readiness: (id: string) => api(`/${id}/lifecycle`, { method: "POST", body: JSON.stringify({ action: "readiness" }) }),
  duplicate: (id: string, name: string, slug: string) => api(`/${id}/lifecycle`, { method: "POST", body: JSON.stringify({ action: "duplicate", name, slug }) }),
  // Generic action handler (fallback)
  action: (id: string, action: string, body?: Record<string, unknown>) =>
    api(`/${id}/lifecycle`, { method: "POST", body: JSON.stringify({ action, ...body }) }),
};
