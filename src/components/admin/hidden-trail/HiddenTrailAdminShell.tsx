"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

interface HiddenTrailAdminShellProps {
  children: React.ReactNode;
  adminUser: {
    id: string;
    email: string;
    role: string;
  };
}

export function HiddenTrailAdminShell({ children, adminUser }: HiddenTrailAdminShellProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:left-0 lg:top-0 lg:bottom-0 lg:w-64 lg:z-50 lg:flex lg:flex-col">
        <div className="flex flex-col h-full bg-[var(--surface)] border-r border-white/[0.06]">
          <div className="p-6 flex items-center gap-3">
            <span className="text-xl font-black tracking-wider text-[var(--foreground)] uppercase">
              CHAPTER ONE ADMIN
            </span>
          </div>
          <nav className="flex-1 flex flex-col gap-1 px-3 py-2 overflow-y-auto">
            <div key="Overview">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 px-3 mb-1 mt-3">
                Overview
              </p>
              <Link
                href="/admin/hidden-trail"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  pathname === "/admin/hidden-trail"
                    ? "text-[var(--accent)] bg-[var(--accent-dim)]"
                    : "text-zinc-400 hover:text-[var(--foreground)] hover:bg-white/[0.03]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4">📊</span>
                  Overview
                </span>
              </Link>
            </div>
            <div key="Settings">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 px-3 mb-1 mt-3">
                Settings
              </p>
              <Link
                href="/admin/hidden-trail/settings"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  pathname === "/admin/hidden-trail/settings"
                    ? "text-[var(--accent)] bg-[var(--accent-dim)]"
                    : "text-zinc-400 hover:text-[var(--foreground)] hover:bg-white/[0.03]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4">⚙️</span>
                  Settings
                </span>
              </Link>
            </div>
            <div key="Levels">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 px-3 mb-1 mt-3">
                Levels
              </p>
              <Link
                href="/admin/hidden-trail/levels"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  pathname === "/admin/hidden-trail/levels"
                    ? "text-[var(--accent)] bg-[var(--accent-dim)]"
                    : "text-zinc-400 hover:text-[var(--foreground)] hover:bg-white/[0.03]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4">📐</span>
                  Levels
                </span>
              </Link>
            </div>
            <div key="QR">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 px-3 mb-1 mt-3">
                QR Management
              </p>
              <Link
                href="/admin/hidden-trail/qr"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  pathname === "/admin/hidden-trail/qr"
                    ? "text-[var(--accent)] bg-[var(--accent-dim)]"
                    : "text-zinc-400 hover:text-[var(--foreground)] hover:bg-white/[0.03]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4">📱</span>
                  QR Codes
                </span>
              </Link>
            </div>
            <div key="Participants">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 px-3 mb-1 mt-3">
                Participants
              </p>
              <Link
                href="/admin/hidden-trail/participants"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  pathname === "/admin/hidden-trail/participants"
                    ? "text-[var(--accent)] bg-[var(--accent-dim)]"
                    : "text-zinc-400 hover:text-[var(--foreground)] hover:bg-white/[0.03]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4">👥</span>
                  Participants
                </span>
              </Link>
            </div>
            <div key="Live">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 px-3 mb-1 mt-3">
                Live Monitor
              </p>
              <Link
                href="/admin/hidden-trail/live"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  pathname === "/admin/hidden-trail/live"
                    ? "text-[var(--accent)] bg-[var(--accent-dim)]"
                    : "text-zinc-400 hover:text-[var(--foreground)] hover:bg-white/[0.03]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4">👁️</span>
                  Live Monitor
                </span>
              </Link>
            </div>
            <div key="Analytics">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 px-3 mb-1 mt-3">
                Analytics
              </p>
              <Link
                href="/admin/hidden-trail/analytics"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  pathname === "/admin/hidden-trail/analytics"
                    ? "text-[var(--accent)] bg-[var(--accent-dim)]"
                    : "text-zinc-400 hover:text-[var(--foreground)] hover:bg-white/[0.03]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4">📈</span>
                  Analytics
                </span>
              </Link>
            </div>
            <div key="Audit">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 px-3 mb-1 mt-3">
                Audit Log
              </p>
              <Link
                href="/admin/hidden-trail/audit"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  pathname === "/admin/hidden-trail/audit"
                    ? "text-[var(--accent)] bg-[var(--accent-dim)]"
                    : "text-zinc-400 hover:text-[var(--foreground)] hover:bg-white/[0.03]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4">📋</span>
                  Audit Log
                </span>
              </Link>
            </div>
            <div key="Simulation">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 px-3 mb-1 mt-3">
                Simulation
              </p>
              <Link
                href="/admin/hidden-trail/simulation"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  pathname === "/admin/hidden-trail/simulation"
                    ? "text-[var(--accent)] bg-[var(--accent-dim)]"
                    : "text-zinc-400 hover:text-[var(--foreground)] hover:bg-white/[0.03]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4">🧪</span>
                  Simulation
                </span>
              </Link>
            </div>
          </nav>
          <div className="p-3 border-t border-white/[0.06]">
            <p className="text-xs text-zinc-500 px-3 mb-2">
              Signed in as {adminUser.email}
            </p>
            <a
              href="/login"
              onClick={(e) => {
                e.preventDefault();
                router.push("/login");
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-400/[0.05] transition-colors"
            >
              <span className="h-4 w-4">🚪</span>
              Log Out
            </a>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={`lg:ml-64 min-h-screen`}>
        {children}
      </div>
    </div>
  );
}