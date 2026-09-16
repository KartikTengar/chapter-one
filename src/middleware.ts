import { assertSupabaseEnv } from "@/lib/supabase/env-check";
import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const envCheck = assertSupabaseEnv();
  if (!envCheck.ok) {
    console.error("[DEV] Supabase env error:", envCheck.message);
    return new NextResponse(JSON.stringify({ error: envCheck.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Create a single supabase client for the entire middleware
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Allow API routes
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Redirect /auth/callback to /api/auth/callback
  if (pathname === "/auth/callback") {
    const url = request.nextUrl.clone();
    url.pathname = "/api/auth/callback";
    return NextResponse.rewrite(url);
  }

  // Protect dashboard and profile routes
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/profile")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Protect hidden-trail routes (leaderboard is public)
  if (pathname.startsWith("/hidden-trail") && pathname !== "/hidden-trail/leaderboard") {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    // Separate admin login page: redirect unauth admin users to admin login
    if (pathname === "/admin/login") {
      if (user) {
        // Already logged in — redirect admin users to /admin, students to /dashboard
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        const redirectPath = profile?.role === "admin" ? "/admin" : "/dashboard";
        const url = request.nextUrl.clone();
        url.pathname = redirectPath;
        return NextResponse.redirect(url);
      }
      // Unauthenticated users allowed to access /admin/login
      return NextResponse.next();
    }

    // All other /admin routes protected
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    // Check admin role using the same supabase client
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  // Redirect authenticated users away from auth pages
  if (pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password" || pathname === "/admin/login") {
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const redirectPath = profile?.role === "admin" ? "/admin" : "/dashboard";
      const url = request.nextUrl.clone();
      url.pathname = redirectPath;
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
