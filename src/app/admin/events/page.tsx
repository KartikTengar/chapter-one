"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getClientAdminUser } from "@/lib/hidden-trail/admin-client";
import { HiddenTrailAdminShell } from "@/components/admin/hidden-trail/HiddenTrailAdminShell";

export default function AdminEventsPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);

  useEffect(() => {
    getClientAdminUser().then((u) => {
      if (!u) router.replace("/admin/login");
      else setAdminUser(u);
    });
  }, [router]);

  if (!adminUser) return null;

  return (
    <HiddenTrailAdminShell adminUser={adminUser}>
      <section className="chapter-admin-overview" aria-labelledby="admin-events-title">
        <header>
          <p className="chapter-admin-nav-group-label" style={{ padding: 0 }}>Workspace</p>
          <h1 id="admin-events-title">Manage Events</h1>
        </header>
        <div className="chapter-admin-empty">
          <h2 className="chapter-admin-empty-title">Event management</h2>
          <p className="chapter-admin-empty-text">The event management interface is not implemented yet.</p>
          <span className="chapter-admin-badge">Coming soon</span>
        </div>
      </section>
    </HiddenTrailAdminShell>
  );
}
