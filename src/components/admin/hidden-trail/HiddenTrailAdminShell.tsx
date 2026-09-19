"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/auth/LogoutButton";

interface HiddenTrailAdminShellProps {
  children: React.ReactNode;
  adminUser: { id: string; email: string; role: string } | null;
}

export function HiddenTrailAdminShell({ children, adminUser }: HiddenTrailAdminShellProps) {
  const pathname = usePathname();

  const navLinkClass = (active: boolean) =>
    `chapter-admin-nav-link ${active ? "is-active" : ""}`;

  return (
    <div className="chapter-admin-shell">
      <aside className="chapter-admin-sidebar">
        <div className="chapter-admin-sidebar-inner">
          <div className="chapter-admin-sidebar-header">
            <span className="chapter-admin-sidebar-brand">CHAPTER ONE ADMIN</span>
          </div>
          <nav className="chapter-admin-nav">
<div>
               <p className="chapter-admin-nav-group-label">Game Management</p>
               <Link href="/admin/games" className={navLinkClass(pathname.startsWith("/admin/games"))}>
                 <span>🎮</span>
                 Games
               </Link>
             </div>
             <div>
               <p className="chapter-admin-nav-group-label">Overview</p>
              <Link href="/admin/hidden-trail" className={navLinkClass(pathname === "/admin/hidden-trail")}>
                <span>📊</span>
                Overview
              </Link>
            </div>
            <div>
              <p className="chapter-admin-nav-group-label">Settings</p>
              <Link href="/admin/hidden-trail/settings" className={navLinkClass(pathname === "/admin/hidden-trail/settings")}>
                <span>⚙️</span>
                Settings
              </Link>
            </div>
            <div>
              <p className="chapter-admin-nav-group-label">Levels</p>
              <Link href="/admin/hidden-trail/levels" className={navLinkClass(pathname.startsWith("/admin/hidden-trail/levels"))}>
                <span>📐</span>
                Levels
              </Link>
            </div>
            <div>
              <p className="chapter-admin-nav-group-label">QR Management</p>
              <Link href="/admin/hidden-trail/qr" className={navLinkClass(pathname === "/admin/hidden-trail/qr")}>
                <span>📱</span>
                QR Codes
              </Link>
            </div>
            <div>
              <p className="chapter-admin-nav-group-label">Participants</p>
              <Link href="/admin/hidden-trail/participants" className={navLinkClass(pathname.startsWith("/admin/hidden-trail/participants"))}>
                <span>👥</span>
                Participants
              </Link>
            </div>
            <div>
              <p className="chapter-admin-nav-group-label">Photos</p>
              <Link href="/admin/hidden-trail/photos" className={navLinkClass(pathname.startsWith("/admin/hidden-trail/photos"))}>
                <span>📸</span>
                Photos
              </Link>
            </div>
            <div>
              <p className="chapter-admin-nav-group-label">Live Monitor</p>
              <Link href="/admin/hidden-trail/live" className={navLinkClass(pathname === "/admin/hidden-trail/live")}>
                <span>👁️</span>
                Live Monitor
              </Link>
            </div>
            <div>
              <p className="chapter-admin-nav-group-label">Analytics</p>
              <Link href="/admin/hidden-trail/analytics" className={navLinkClass(pathname === "/admin/hidden-trail/analytics")}>
                <span>📈</span>
                Analytics
              </Link>
            </div>
            <div>
              <p className="chapter-admin-nav-group-label">Audit</p>
              <Link href="/admin/hidden-trail/audit" className={navLinkClass(pathname === "/admin/hidden-trail/audit")}>
                <span>📋</span>
                Audit Log
              </Link>
            </div>
            <div>
              <p className="chapter-admin-nav-group-label">Simulation</p>
              <Link href="/admin/hidden-trail/simulation" className={navLinkClass(pathname === "/admin/hidden-trail/simulation")}>
                <span>🧪</span>
                Simulation
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
