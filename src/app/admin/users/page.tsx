"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getClientAdminUser } from "@/lib/hidden-trail/admin-client";
import { HiddenTrailAdminShell } from "@/components/admin/hidden-trail/HiddenTrailAdminShell";

export default function AdminUsersPage() {
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
      <section className="chapter-admin-overview" aria-labelledby="admin-users-title">
        <header>
          <p className="chapter-admin-nav-group-label" style={{ padding: 0 }}>Workspace</p>
          <h1 id="admin-users-title">Manage Users</h1>
        </header>
        <div className="chapter-admin-empty">
          <h2 className="chapter-admin-empty-title">User management</h2>
          <p className="chapter-admin-empty-text">The user management interface is not implemented yet.</p>
          <span className="chapter-admin-badge">Coming soon</span>
        </div>
      </section>
    </HiddenTrailAdminShell>
  );
}
