import { createServerClient } from "@supabase/ssr";
import { authenticatedDestination, safeRedirectPath } from "@/lib/auth/redirects";
import { assertSupabaseEnv, authCookieOptions, getSupabaseConfig } from "@/lib/supabase/env-check";
import { NextResponse, type NextRequest } from "next/server";

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function noStore(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

function createMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, key } = getSupabaseConfig();
  const supabase = createServerClient(url, key, {
    cookieOptions: authCookieOptions(),
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        const previous = response;
        response = NextResponse.next({ request });
        previous.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
        previous.headers.forEach((value, name) => {
          if (!name.startsWith("x-middleware-") && name !== "set-cookie") response.headers.set(name, value);
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, { ...options, ...authCookieOptions() })
        );
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });

  return {
    supabase,
    finish(destination?: NextResponse) {
      if (!destination) return noStore(response);
      response.cookies.getAll().forEach((cookie) => destination.cookies.set(cookie));
      response.headers.forEach((value, name) => {
        if (!name.startsWith("x-middleware-") && name !== "set-cookie") destination.headers.set(name, value);
      });
      return noStore(destination);
    },
  };
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname.replace(/\/$/, "") || "/";

  if (matchesPrefix(pathname, "/_dev")) {
    return process.env.NODE_ENV === "production"
      ? new NextResponse(null, { status: 404 })
      : NextResponse.next();
  }

  if (pathname === "/auth/callback") {
    const url = request.nextUrl.clone();
    url.pathname = "/api/auth/callback";
    return noStore(NextResponse.rewrite(url));
  }

  if (matchesPrefix(pathname, "/api")) return noStore(NextResponse.next());

  const authEntry = ["/login", "/signup", "/admin/login"].includes(pathname);
  const recoveryPage = pathname === "/reset-password" || pathname === "/forgot-password";
  const adminPage = matchesPrefix(pathname, "/admin") && pathname !== "/admin/login";
  const protectedPage = adminPage || matchesPrefix(pathname, "/dashboard") || matchesPrefix(pathname, "/profile") || (
      matchesPrefix(pathname, "/hidden-trail") && pathname !== "/hidden-trail/leaderboard"
    );

  if (!authEntry && !recoveryPage && !protectedPage) return NextResponse.next();

  const redirect = (path: string) => NextResponse.redirect(new URL(path, request.nextUrl.origin));
  const login = (configError = false) => {
    const url = new URL("/login", request.nextUrl.origin);
    url.searchParams.set("redirect", safeRedirectPath(`${pathname}${request.nextUrl.search}`, safeRedirectPath(pathname)));
    if (configError) url.searchParams.set("error", "AUTH_CONFIG");
    return NextResponse.redirect(url);
  };
  const adminLogin = () => {
    const url = new URL("/login", request.nextUrl.origin);
    url.searchParams.set("redirect", safeRedirectPath(
      request.nextUrl.searchParams.get("redirect") ?? request.nextUrl.searchParams.get("next"),
      "/admin/hidden-trail",
    ));
    return NextResponse.redirect(url);
  };

  if (!assertSupabaseEnv().ok) {
    if (protectedPage) return noStore(login(true));
    return noStore(pathname === "/admin/login" ? adminLogin() : NextResponse.next());
  }

  const adapter = createMiddlewareClient(request);
  try {
    const { data: { user }, error } = await adapter.supabase.auth.getUser();
    if (error || !user) {
      if (protectedPage) return adapter.finish(login());
      return adapter.finish(pathname === "/admin/login" ? adminLogin() : undefined);
    }

    const needsRole = adminPage || authEntry || matchesPrefix(pathname, "/dashboard");
    let role: string | null = null;
    if (needsRole) {
      const { data: profile, error: profileError } = await adapter.supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      role = profileError ? null : profile?.role ?? null;
    }

    if (adminPage && role !== "admin") return adapter.finish(redirect("/dashboard?denied=admin"));
    if (matchesPrefix(pathname, "/dashboard") && role === "admin") {
      return adapter.finish(redirect("/admin/hidden-trail"));
    }
    if (authEntry) {
      const requested = request.nextUrl.searchParams.get("redirect") ?? request.nextUrl.searchParams.get("next") ??
        (pathname === "/admin/login" ? "/admin/hidden-trail" : undefined);
      return adapter.finish(redirect(authenticatedDestination(role, requested)));
    }
    return adapter.finish();
  } catch {
    if (protectedPage) return adapter.finish(login());
    return adapter.finish(pathname === "/admin/login" ? adminLogin() : undefined);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
