"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { requireUser, getGameConfig, getParticipantStatus } from "@/lib/hidden-trail/game";
import { LogoutButton } from "@/components/auth/LogoutButton";
import {
  MapPin,
  Flag,
  BarChart3,
  RotateCw,
  Trophy,
  Images,
  Layers3,
  Menu,
  X,
} from "lucide-react";

interface GameConfig {
  id: string;
  name: string;
  description: string | null;
  status: string;
  start_at: string | null;
  end_at: string | null;
  score_start_level: number;
  starting_score: number;
  score_floor: number;
  final_secret_enabled: boolean;
  final_secret_hash: string | null;
  final_message: string | null;
  leaderboard_public: boolean;
  leaderboard_name_mode: string;
  created_at: string;
  updated_at: string;
}

interface ParticipantStatus {
  game_id: string;
  user_id: string;
  current_level: number;
  total_points: number;
  status: string;
  started_at: string | null;
  last_scan_at: string | null;
  completed_at: string | null;
}

const navItems = [
  { href: "/hidden-trail", label: "Hidden Trail", icon: MapPin },
  { href: "/hidden-trail/result", label: "Result", icon: Flag },
  { href: "/hidden-trail/stats", label: "Stats", icon: BarChart3 },
  { href: "/hidden-trail/replay", label: "Replay", icon: RotateCw },
  { href: "/hidden-trail/achievements", label: "Achievements", icon: Trophy },
  { href: "/hidden-trail/album", label: "Album", icon: Images },
  { href: "/hidden-trail/leaderboard", label: "Leaderboard", icon: Layers3 },
];

export function HiddenTrailShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [participant, setParticipant] = useState<ParticipantStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        setLoading(true);
        setError(null);
        const currentUser = await requireUser();
        if (!currentUser) {
          if (mounted) router.replace("/login");
          return;
        }
        if (!mounted) return;
        setUser({ id: currentUser.id, email: currentUser.email ?? "" });
        const config = await getGameConfig();
        if (!config) {
          if (mounted) { setError("No active game found"); setLoading(false); }
          return;
        }
        if (!mounted) return;
        setGameConfig(config);
        const participantData = await getParticipantStatus(config.id, currentUser.id);
        if (mounted) setParticipant(participantData);
        if (mounted) setLoading(false);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load hidden trail");
          setLoading(false);
        }
      }
    };
    init();
    return () => { mounted = false; };
  }, [router]);

  const isActive = (href: string) => pathname === href;

  const closeMobileMenu = () => setMobileMenuOpen(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-[var(--accent)] text-lg font-bold animate-pulse">
          Loading the Hidden Trail...
        </div>
      </div>
    );
  }

  if (error || !user || !gameConfig || !participant) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="bg-[var(--surface)] border border-white/[0.06] rounded-2xl p-12 text-center">
          <h2 className="text-2xl font-black text-[var(--foreground)] uppercase tracking-tight mb-3">
            Trail Not Found
          </h2>
          <p className="text-zinc-500 mb-6">
            {error || "We couldn't load the Hidden Trail right now."}
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard"
              className="rounded-full px-6 py-3 bg-[var(--accent)] text-[var(--background)] font-bold text-sm hover:bg-opacity-90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              RETURN TO DASHBOARD
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const sidebarNav = (
    <aside className="hidden lg:fixed lg:left-0 lg:top-0 lg:bottom-0 lg:w-60 lg:z-50 lg:flex lg:flex-col">
      <div className="flex flex-col h-full bg-[var(--surface)] border-r border-white/[0.06]">
        <div className="p-5 flex items-center gap-3 border-b border-white/[0.06]">
          <span className="text-lg font-black tracking-wider text-[var(--foreground)] uppercase">
            CHAPTER ONE
          </span>
        </div>
        <nav className="flex-1 flex flex-col gap-0.5 px-2 py-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "text-[var(--accent)] bg-[var(--accent-dim)]"
                    : "text-zinc-400 hover:text-[var(--foreground)] hover:bg-white/[0.03]"
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/[0.06]">
          <LogoutButton />
        </div>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {sidebarNav}

      {/* Mobile topbar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[var(--surface)] border-b border-white/[0.06]">
        <Link href="/hidden-trail" className="text-lg font-black tracking-wider text-[var(--foreground)] uppercase">
          CHAPTER ONE
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--background)] border border-white/[0.06] text-[var(--foreground)] hover:bg-white/[0.03] transition-colors"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[var(--surface)] border-b border-white/[0.06]">
          <nav className="flex flex-col py-2 px-3 gap-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? "text-[var(--accent)] bg-[var(--accent-dim)]"
                      : "text-zinc-400 hover:text-[var(--foreground)] hover:bg-white/[0.03]"
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* Main content */}
      <div className="lg:ml-60 min-h-screen">
        {children}
      </div>
    </div>
  );
}