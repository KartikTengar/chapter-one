"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getClientAdminUser } from "@/lib/hidden-trail/admin-client";
import { HiddenTrailAdminShell } from "@/components/admin/hidden-trail/HiddenTrailAdminShell";

type AdminUser = { id: string; email: string; role: string };

export default function AdminPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [stats, setStats] = useState({
    students: 0,
    events: 0,
    registrations: 0,
    upcomingEvents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const user = await getClientAdminUser();
      if (!user) {
        router.replace("/admin/login");
        return;
      }
      if (!mounted) return;
      setAdminUser(user);

      try {
        const supabase = createClient();
        const [{ count: students }, { count: events }, { count: registrations }, { count: upcomingEvents }] =
          await Promise.all([
            supabase.from("profiles").select("id", { count: "exact", head: true }),
            supabase.from("events").select("id", { count: "exact", head: true }),
            supabase.from("event_registrations").select("id", { count: "exact", head: true }),
            supabase.from("events").select("id", { count: "exact", head: true }).gte("event_date", new Date().toISOString()),
          ]);

        if (mounted) {
          setStats({
            students: students ?? 0,
            events: events ?? 0,
            registrations: registrations ?? 0,
            upcomingEvents: upcomingEvents ?? 0,
          });
        }
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : "Could not load dashboard statistics.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [router]);

  if (!adminUser) return null;

  const adminStats = [
    { label: "Total Students", value: stats.students },
    { label: "Total Events", value: stats.events },
    { label: "Registrations", value: stats.registrations },
    { label: "Upcoming Events", value: stats.upcomingEvents },
  ];

  return (
    <HiddenTrailAdminShell adminUser={adminUser}>
      <section className="chapter-admin-overview" aria-labelledby="admin-dashboard-title">
        <header>
          <p className="chapter-admin-nav-group-label" style={{ padding: 0, marginBottom: "0.5rem" }}>Workspace</p>
          <h1 id="admin-dashboard-title">Admin Dashboard</h1>
          <p className="chapter-admin-help-text">Manage Chapter One content, users, registrations, and live game operations.</p>
        </header>

        {error && <div className="chapter-admin-alert chapter-admin-alert--error" role="alert">{error}</div>}

        {loading ? (
          <div className="chapter-admin-card" role="status" aria-live="polite">
            <p className="chapter-admin-help-text">Loading dashboard statistics…</p>
          </div>
        ) : (
          <div className="chapter-admin-stat-grid">
            {adminStats.map((stat) => (
              <article key={stat.label} className="chapter-admin-stat-card">
                <p className="chapter-admin-stat-label">{stat.label}</p>
                <p className="chapter-admin-stat-value">{stat.value}</p>
              </article>
            ))}
          </div>
        )}

        <section aria-labelledby="admin-quick-actions">
          <h2 id="admin-quick-actions" className="chapter-admin-section-title">Quick actions</h2>
          <div className="chapter-admin-stat-grid">
            <a href="/admin/users" className="chapter-admin-card" style={{ textDecoration: "none", marginBottom: 0 }}>
              <h3>Manage Users</h3>
              <p className="chapter-admin-help-text">View and manage student profiles.</p>
            </a>
            <a href="/admin/events" className="chapter-admin-card" style={{ textDecoration: "none", marginBottom: 0 }}>
              <h3>Manage Events</h3>
              <p className="chapter-admin-help-text">Create, edit, and publish events.</p>
            </a>
            <a href="/admin/registrations" className="chapter-admin-card" style={{ textDecoration: "none", marginBottom: 0 }}>
              <h3>Registrations</h3>
              <p className="chapter-admin-help-text">Review event registrations.</p>
            </a>
            <a href="/admin/games" className="chapter-admin-card" style={{ textDecoration: "none", marginBottom: 0 }}>
              <h3>Game Management</h3>
              <p className="chapter-admin-help-text">Configure Hidden Trail game instances.</p>
            </a>
          </div>
        </section>
      </section>
    </HiddenTrailAdminShell>
  );
}
