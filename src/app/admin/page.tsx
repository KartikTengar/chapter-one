"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    students: 0,
    events: 0,
    registrations: 0,
    upcomingEvents: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      const [{ data: profiles }, { data: events }, { data: regs }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("events").select("*", { count: "exact", head: true }),
        supabase.from("event_registrations").select("*", { count: "exact", head: true }),
      ]);

      const now = new Date().toISOString();
      const { data: upcoming } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .gte("event_date", now);

      setStats({
        students: profiles ? parseInt(String(profiles.length)) : 0,
        events: events ? parseInt(String(events.length)) : 0,
        registrations: regs ? parseInt(String(regs.length)) : 0,
        upcomingEvents: upcoming ? parseInt(String(upcoming.length)) : 0,
      });
      setLoading(false);
    }).catch(() => {
      router.replace("/login");
    });
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-[var(--accent)] text-lg font-bold animate-pulse">
          Loading admin dashboard...
        </div>
      </main>
    );
  }

  const adminStats = [
    { label: "Total Students", value: stats.students },
    { label: "Total Events", value: stats.events },
    { label: "Registrations", value: stats.registrations },
    { label: "Upcoming Events", value: stats.upcomingEvents },
  ];

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="max-container max-w-6xl mx-auto py-8">
        <h1 className="text-3xl font-black text-[var(--foreground)] uppercase tracking-tight mb-8">
          Admin Dashboard
        </h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {adminStats.map((stat) => (
            <div
              key={stat.label}
              className="bg-[var(--surface)] border border-white/[0.06] rounded-2xl p-5"
            >
              <p className="text-xs text-zinc-400 uppercase tracking-wider mb-2">
                {stat.label}
              </p>
              <p className="text-3xl font-bold text-[var(--foreground)]">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a
            href="/admin/users"
            className="bg-[var(--surface)] border border-white/[0.06] rounded-2xl p-6 hover:border-[var(--accent)]/30 transition-colors"
          >
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">
              Manage Users
            </h3>
            <p className="text-sm text-zinc-400">View and manage student profiles.</p>
          </a>
          <a
            href="/admin/events"
            className="bg-[var(--surface)] border border-white/[0.06] rounded-2xl p-6 hover:border-[var(--accent)]/30 transition-colors"
          >
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">
              Manage Events
            </h3>
            <p className="text-sm text-zinc-400">Create, edit, and publish events.</p>
          </a>
          <a
            href="/admin/registrations"
            className="bg-[var(--surface)] border border-white/[0.06] rounded-2xl p-6 hover:border-[var(--accent)]/30 transition-colors"
          >
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">
              Registrations
            </h3>
            <p className="text-sm text-zinc-400">View and manage event registrations.</p>
          </a>
        </div>
      </div>
    </main>
  );
}
