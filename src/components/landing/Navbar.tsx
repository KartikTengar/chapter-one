"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export function Navbar() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<{ role: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()
          .then(({ data: profile }) => {
            setUser(profile ? { role: profile.role } : null);
          });
      }
    });
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      
      if (response.ok || response.redirected) {
        if (response.redirected) {
          window.location.href = response.url;
        } else {
          setUser(null);
          router.replace("/login");
          router.refresh();
        }
      } else {
        // Fallback to client-side signOut
        const supabase = createClient();
        await supabase.auth.signOut();
        setUser(null);
        router.replace("/login");
        router.refresh();
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback to client-side signOut
      const supabase = createClient();
      await supabase.auth.signOut();
      setUser(null);
      router.replace("/login");
      router.refresh();
    }
  };

  const isAdmin = user?.role === "admin";
  const isAuthenticated = user !== null;

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-[background-color] dur-300"
        aria-label="Main navigation"
      >
        <div className="max-container h-16 lg:h-20 flex items-center justify-between px-0">
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <h1 className="text-lg lg:text-xl font-bold tracking-wider text-[var(--foreground)] uppercase">
              CHAPTER ONE
            </h1>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {!isAuthenticated ? (
              <>
                <Link
                  href="/login"
                  className="relative text-sm text-zinc-400 hover:text-[var(--accent)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="relative text-sm text-zinc-400 hover:text-[var(--accent)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                >
                  Sign Up
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 bg-[var(--accent)] text-[var(--background)] font-medium text-sm transition-colors hover:bg-opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                >
                  ENTER THE EXPERIENCE
                  <svg
                    className="h-4 w-4 -mr-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </>
            ) : isAdmin ? (
              <>
                <Link
                  href="/dashboard"
                  className="relative text-sm text-zinc-400 hover:text-[var(--accent)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin"
                  className="relative text-sm text-zinc-400 hover:text-[var(--accent)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                >
                  Admin
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-full px-5 py-2.5 border border-white/[0.12] text-[var(--foreground)] text-sm font-medium hover:bg-white/[0.04] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>Log Out</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard"
                  className="relative text-sm text-zinc-400 hover:text-[var(--accent)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                >
                  Dashboard
                </Link>
                <Link
                  href="/events"
                  className="relative text-sm text-zinc-400 hover:text-[var(--accent)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                >
                  Events
                </Link>
                <Link
                  href="/profile"
                  className="relative text-sm text-zinc-400 hover:text-[var(--accent)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-full px-5 py-2.5 border border-white/[0.12] text-[var(--foreground)] text-sm font-medium hover:bg-white/[0.04] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>Log Out</span>
                </button>
              </>
            )}
          </div>

          <AnimatePresence mode="wait">
            {isMenuOpen && (
              <div
                className="fixed inset-0 bg-[var(--background)]/95 backdrop-blur-[30px] z-40 flex flex-col items-center justify-center gap-6 pointer-events-auto max-h-[90vh] overflow-y-auto"
                role="menu"
                aria-label="Mobile navigation menu"
              >
                <button
                  aria-label="Close menu"
                  className="absolute top-6 right-6 text-3xl text-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <X className="h-8 w-8" />
                </button>

                <nav className="flex flex-col gap-6 text-lg font-medium">
                  {!isAuthenticated ? (
                    <>
                      <Link
                        href="/login"
                        className="relative text-zinc-400 hover:text-[var(--accent)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Login
                      </Link>
                      <Link
                        href="/signup"
                        className="relative text-zinc-400 hover:text-[var(--accent)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Sign Up
                      </Link>
                      <Link
                        href="/login"
                        className="w-full rounded-full px-8 py-4 bg-[var(--accent)] text-[var(--background)] font-medium text-base transition-colors hover:bg-opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        ENTER THE EXPERIENCE
                      </Link>
                    </>
                  ) : isAdmin ? (
                    <>
                      <Link
                        href="/dashboard"
                        className="relative text-zinc-400 hover:text-[var(--accent)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/admin"
                        className="relative text-zinc-400 hover:text-[var(--accent)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Admin
                      </Link>
                      <button
                        onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                        className="w-full rounded-full px-8 py-4 border border-white/[0.12] text-[var(--foreground)] font-medium text-base transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                      >
                        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        <span>Log Out</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/dashboard"
                        className="relative text-zinc-400 hover:text-[var(--accent)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/events"
                        className="relative text-zinc-400 hover:text-[var(--accent)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Events
                      </Link>
                      <Link
                        href="/profile"
                        className="relative text-zinc-400 hover:text-[var(--accent)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      <button
                        onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                        className="w-full rounded-full px-8 py-4 border border-white/[0.12] text-[var(--foreground)] font-medium text-base transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                      >
                        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        <span>Log Out</span>
                      </button>
                    </>
                  )}
                </nav>
              </div>
            )}
          </AnimatePresence>
        </div>
      </nav>
    </>
  );
}
