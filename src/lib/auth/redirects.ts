const localBase = "https://local.invalid";
const queryKeys = new Set(["page", "search", "q", "category", "filter", "sort", "tab", "denied"]);

function hasUnsafeCharacters(value: string): boolean {
  return [...value].some((character) => {
    const code = character.charCodeAt(0);
    return code <= 32 || (code >= 127 && code <= 159) || character === "\\";
  });
}

function validatedPath(input: unknown): string | null {
  if (typeof input !== "string" || !input.startsWith("/") || input.startsWith("//")) return null;
  if (input.length > 2048 || hasUnsafeCharacters(input)) return null;

  try {
    let decoded = input;
    for (let depth = 0; depth < 4 && decoded.includes("%"); depth += 1) {
      decoded = decodeURIComponent(decoded);
      if (hasUnsafeCharacters(decoded) || decoded.startsWith("//")) return null;
    }
    if (decoded.includes("%")) return null;

    const url = new URL(input, localBase);
    if (url.origin !== localBase || url.hash) return null;
    const pathname = url.pathname;
    if (pathname !== input.split("?")[0] || pathname.includes("%") || pathname.includes("//")) return null;

    const allowed = [
      "/", "/dashboard", "/dashboard/leaderboard", "/profile", "/events",
      "/hidden-trail", "/hidden-trail/leaderboard", "/admin", "/admin/hidden-trail",
      "/admin/hidden-trail/settings", "/admin/events", "/admin/registrations", "/admin/users",
    ].includes(pathname) || /^\/events\/[A-Za-z0-9_-]+$/.test(pathname) ||
      /^\/hidden-trail\/scan\/[A-Za-z0-9_-]+$/.test(pathname) ||
      /^\/admin\/hidden-trail\/qr\/print\/[A-Za-z0-9_-]+$/.test(pathname);
    if (!allowed) return null;

    const seen = new Set<string>();
    for (const [key, value] of url.searchParams) {
      if (!queryKeys.has(key) || seen.has(key) || value.length > 256) return null;
      seen.add(key);
    }
    return `${pathname}${url.search}`;
  } catch {
    return null;
  }
}

export function safeRedirectPath(input: unknown, fallback = "/dashboard"): string {
  return validatedPath(input) ?? validatedPath(fallback) ?? "/dashboard";
}

export function authenticatedDestination(role: unknown, requested?: unknown): string {
  const fallback = role === "admin" ? "/admin/hidden-trail" : "/dashboard";
  const destination = safeRedirectPath(requested, fallback);
  const pathname = destination.split("?")[0];
  if (role !== "admin" && (pathname === "/admin" || pathname.startsWith("/admin/"))) {
    return "/dashboard?denied=admin";
  }
  return destination;
}
