import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { requireUser, getGameConfig, getParticipantStatus } from "@/lib/hidden-trail/game";

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

export function HiddenTrailShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [participant, setParticipant] = useState<ParticipantStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const currentUser = await requireUser();
        if (!currentUser) {
          if (mounted) {
            router.replace("/login");
          }
          return;
        }
        
        if (!mounted) return;
        setUser({ id: currentUser.id, email: currentUser.email ?? "" });
        
        // Get game config
        const config = await getGameConfig();
        if (!config) {
          if (mounted) {
            setError("No active game found");
            setLoading(false);
          }
          return;
        }
        
        if (!mounted) return;
        setGameConfig(config);
        
        // Get participant status
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
    return () => {
      mounted = false;
    };
  }, [router]);

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

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:left-0 lg:top-0 lg:bottom-0 lg:w-64 lg:z-50 lg:flex lg:flex-col">
        <div className="flex flex-col h-full bg-[var(--surface)] border-r border-white/[0.06]">
          <div className="p-6 flex items-center gap-3">
            <span className="text-xl font-black tracking-wider text-[var(--foreground)] uppercase">
              CHAPTER ONE
            </span>
          </div>
          <nav className="flex-1 flex flex-col gap-1 px-3 py-2 overflow-y-auto">
            <div key="Overview">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 px-3 mb-1 mt-3">
                Overview
              </p>
              <Link
                href="/hidden-trail"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  pathname === "/hidden-trail"
                    ? "text-[var(--accent)] bg-[var(--accent-dim)]"
                    : "text-zinc-400 hover:text-[var(--foreground)] hover:bg-white/[0.03]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4">🗺️</span>
                  Hidden Trail
                </span>
              </Link>
            </div>
          </nav>
          <div className="p-3 border-t border-white/[0.06]">
            <Link
              href="/login"
              onClick={() => {
                router.push("/login");
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-400/[0.05] transition-colors"
            >
              <span className="h-4 w-4">🚪</span>
              Log Out
            </Link>
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
