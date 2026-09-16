"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  DashboardShell,
  WelcomeSection,
  StatsGrid,
  UpcomingEvents,
  MyEvents,
  ExperienceGrid,
  ActivityFeed,
  ProfileCompletion,
} from "@/components/dashboard";
import {
  getUpcomingEvents,
  getRegisteredEventIds,
  getProfile,
  getStats,
  getUserActivity,
  getProfileCompletion,
  type Event,
} from "@/lib/supabase/dashboard";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<{
    full_name: string;
    email: string;
    phone: string;
    year: string;
    branch: string;
    college_id: string;
    avatar_url: string | null;
  } | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({ upcomingEvents: 0, registered: 0 });
  const [activities, setActivities] = useState<
    Array<{ id: string; event_id: string; created_at: string; event_title?: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    async function init() {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          if (mounted) {
            router.replace("/login");
          }
          return;
        }

        if (!mounted) return;
        setUser({ id: currentUser.id, email: currentUser.email ?? "" });

        const [profileData, upcomingEvents, regIds, statsData, regActivity] =
          await Promise.all([
            getProfile(currentUser.id),
            getUpcomingEvents(),
            getRegisteredEventIds(currentUser.id),
            getStats(currentUser.id),
            getUserActivity(currentUser.id),
          ]);

        if (!mounted) return;
        setProfile(profileData);
        setEvents(upcomingEvents);
        setRegisteredIds(new Set(regIds));
        setStats(statsData);
setActivities(regActivity as Array<{ id: string; event_id: string; created_at: string; event_title?: string }>);
      } catch {
        if (mounted) setError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();
    return () => { mounted = false; };
  }, [router]);

  const profileCompletion = profile
  ? getProfileCompletion(profile)
  : 0;
  const userName = profile?.full_name ?? user?.email?.split("@")[0] ?? "Student";

  const activitiesWithTitles = activities;

  if (loading) {
    return (
      <DashboardShell>
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-[var(--surface)] rounded-xl w-3/4" />
          <div className="h-6 bg-[var(--surface)] rounded-xl w-1/2" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-[var(--surface)] rounded-2xl" />
            ))}
          </div>
          <div className="h-64 bg-[var(--surface)] rounded-2xl" />
        </div>
      </DashboardShell>
    );
  }

  if (error || !user) {
    return (
      <DashboardShell>
        <div className="bg-[var(--surface)] border border-white/[0.06] rounded-2xl p-12 text-center">
          <h2 className="text-2xl font-black text-[var(--foreground)] uppercase tracking-tight mb-3">
            SOMETHING WENT WRONG
          </h2>
          <p className="text-zinc-500 mb-6">
            We couldn&apos;t load your dashboard right now.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-full px-6 py-3 bg-[var(--accent)] text-[var(--background)] font-bold text-sm hover:bg-opacity-90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            TRY AGAIN
          </button>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <WelcomeSection userName={userName} />
      {profile && profileCompletion < 80 && (
        <div className="mb-8">
          <ProfileCompletion
            completion={profileCompletion}
            isComplete={false}
          />
        </div>
      )}
      <StatsGrid
        upcomingEvents={stats.upcomingEvents}
        registered={stats.registered}
      />
      <UpcomingEvents events={events} registeredIds={registeredIds} />
      <MyEvents events={events.filter((e) => registeredIds.has(e.id))} />
      <ExperienceGrid />
      <ActivityFeed activities={activitiesWithTitles} />
    </DashboardShell>
  );
}