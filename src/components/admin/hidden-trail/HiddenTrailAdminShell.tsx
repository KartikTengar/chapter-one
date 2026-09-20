"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { LogoutButton } from "@/components/auth/LogoutButton";

interface HiddenTrailAdminShellProps {
  children: React.ReactNode;
  adminUser: { id: string; email: string; role: string } | null;
}

export function HiddenTrailAdminShell({ children, adminUser }: HiddenTrailAdminShellProps) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const active = navRef.current?.querySelector<HTMLElement>(".chapter-admin-nav-link.is-active");
    active?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [pathname]);

  const navLinkClass = (active: boolean) =>
    `chapter-admin-nav-link ${active ? "is-active" : ""}`;

  return (
    <div className="chapter-admin-shell">
      <aside className="chapter-admin-sidebar">
        <div className="chapter-admin-sidebar-inner">
          <div className="chapter-admin-sidebar-header">
            <span className="chapter-admin-sidebar-brand">CHAPTER ONE ADMIN</span>
          </div>
          <nav ref={navRef} className="chapter-admin-nav" aria-label="Admin navigation">
            <div>
              <p className="chapter-admin-nav-group-label">Workspace</p>
              <Link href="/admin" aria-current={pathname === "/admin" ? "page" : undefined} className={navLinkClass(pathname === "/admin")}>
                <span aria-hidden="true">⌂</span> Dashboard
              </Link>
              <Link href="/admin/users" aria-current={pathname.startsWith("/admin/users") ? "page" : undefined} className={navLinkClass(pathname.startsWith("/admin/users"))}>
                <span aria-hidden="true">👥</span> Users
              </Link>
              <Link href="/admin/events" aria-current={pathname.startsWith("/admin/events") ? "page" : undefined} className={navLinkClass(pathname.startsWith("/admin/events"))}>
                <span aria-hidden="true">📅</span> Events
              </Link>
              <Link href="/admin/registrations" aria-current={pathname.startsWith("/admin/registrations") ? "page" : undefined} className={navLinkClass(pathname.startsWith("/admin/registrations"))}>
                <span aria-hidden="true">📝</span> Registrations
              </Link>
              <Link href="/admin/games" aria-current={pathname.startsWith("/admin/games") ? "page" : undefined} className={navLinkClass(pathname.startsWith("/admin/games"))}>
                <span aria-hidden="true">🎮</span> Games
              </Link>
            </div>

            <div>
              <p className="chapter-admin-nav-group-label">Hidden Trail</p>
              <Link href="/admin/hidden-trail" aria-current={pathname === "/admin/hidden-trail" ? "page" : undefined} className={navLinkClass(pathname === "/admin/hidden-trail")}>
                <span aria-hidden="true">📊</span> Overview
              </Link>
              <Link href="/admin/hidden-trail/settings" aria-current={pathname.startsWith("/admin/hidden-trail/settings") ? "page" : undefined} className={navLinkClass(pathname.startsWith("/admin/hidden-trail/settings"))}>
                <span aria-hidden="true">⚙️</span> Settings
              </Link>
              <Link href="/admin/hidden-trail/levels" aria-current={pathname.startsWith("/admin/hidden-trail/levels") ? "page" : undefined} className={navLinkClass(pathname.startsWith("/admin/hidden-trail/levels"))}>
                <span aria-hidden="true">📐</span> Levels
              </Link>
              <Link href="/admin/hidden-trail/qr" aria-current={pathname.startsWith("/admin/hidden-trail/qr") ? "page" : undefined} className={navLinkClass(pathname.startsWith("/admin/hidden-trail/qr"))}>
                <span aria-hidden="true">📱</span> QR Codes
              </Link>
              <Link href="/admin/hidden-trail/leaderboard" aria-current={pathname.startsWith("/admin/hidden-trail/leaderboard") ? "page" : undefined} className={navLinkClass(pathname.startsWith("/admin/hidden-trail/leaderboard"))}>
                <span aria-hidden="true">🏆</span> Leaderboard
              </Link>
              <Link href="/admin/hidden-trail/participants" aria-current={pathname.startsWith("/admin/hidden-trail/participants") ? "page" : undefined} className={navLinkClass(pathname.startsWith("/admin/hidden-trail/participants"))}>
                <span aria-hidden="true">👤</span> Participants
              </Link>
              <Link href="/admin/hidden-trail/photos" aria-current={pathname.startsWith("/admin/hidden-trail/photos") ? "page" : undefined} className={navLinkClass(pathname.startsWith("/admin/hidden-trail/photos"))}>
                <span aria-hidden="true">📸</span> Photos
              </Link>
              <Link href="/admin/hidden-trail/live" aria-current={pathname.startsWith("/admin/hidden-trail/live") ? "page" : undefined} className={navLinkClass(pathname.startsWith("/admin/hidden-trail/live"))}>
                <span aria-hidden="true">👁️</span> Live Monitor
              </Link>
              <Link href="/admin/hidden-trail/analytics" aria-current={pathname.startsWith("/admin/hidden-trail/analytics") ? "page" : undefined} className={navLinkClass(pathname.startsWith("/admin/hidden-trail/analytics"))}>
                <span aria-hidden="true">📈</span> Analytics
              </Link>
              <Link href="/admin/hidden-trail/audit" aria-current={pathname.startsWith("/admin/hidden-trail/audit") ? "page" : undefined} className={navLinkClass(pathname.startsWith("/admin/hidden-trail/audit"))}>
                <span aria-hidden="true">📋</span> Audit Log
              </Link>
              <Link href="/admin/hidden-trail/simulation" aria-current={pathname.startsWith("/admin/hidden-trail/simulation") ? "page" : undefined} className={navLinkClass(pathname.startsWith("/admin/hidden-trail/simulation"))}>
                <span aria-hidden="true">🧪</span> Simulation
              </Link>
            </div>
          </nav>
          <div className="chapter-admin-sidebar-footer">
            <p>Signed in as {adminUser?.email}</p>
            <LogoutButton />
          </div>
        </div>
      </aside>

      <div className="chapter-admin-content">
        {children}
      </div>
    </div>
  );
}
