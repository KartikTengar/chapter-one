"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  requireUser,
  getGameConfig,
  getParticipantStatus,
  getParticipantCompletions,
  getGameLevels,
  type GameConfig,
  type ParticipantStatus,
  type CompletionWithLevel,
  type LevelWithRelations
} from "@/lib/hidden-trail/game";
import { HiddenTrailShell } from "@/components/hidden-trail/HiddenTrailShell";
import { TrailHero } from "@/components/hidden-trail/TrailHero";
import { TrailProgress } from "@/components/hidden-trail/TrailProgress";
import { GameRules } from "@/components/hidden-trail/GameRules";
import { TrailComplete } from "@/components/hidden-trail/TrailComplete";

export default function HiddenTrailPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [participant, setParticipant] = useState<ParticipantStatus | null>(null);
  const [completions, setCompletions] = useState<CompletionWithLevel[]>([]);
  const [levels, setLevels] = useState<LevelWithRelations[]>([]);
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
            setError("No active game found. Please check back later.");
            setLoading(false);
          }
          return;
        }
        
        if (!mounted) return;
        setGameConfig(config);
        
        // Get levels
        const gameLevels = await getGameLevels(config.id);
        if (!mounted) return;
        setLevels(gameLevels);
        
        // Get participant status
        const participantData = await getParticipantStatus(config.id, currentUser.id);
        if (mounted) setParticipant(participantData);
        
        // Get completions
        const participantCompletions = await getParticipantCompletions(
            config.id,
            currentUser.id
        );
        if (mounted) setCompletions(participantCompletions);
        
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
      <HiddenTrailShell>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-[var(--accent)] text-lg font-bold animate-pulse">
            Loading the Hidden Trail...
          </div>
        </div>
      </HiddenTrailShell>
    );
  }

  if (error || !user || !gameConfig || !participant) {
    return (
      <HiddenTrailShell>
        <div className="min-h-screen flex items-center justify-center">
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
      </HiddenTrailShell>
    );
  }

  // Check if game is completed
  const isCompleted = participant.status === "completed";

  if (isCompleted) {
    return (
      <HiddenTrailShell>
        <TrailComplete
          participant={participant}
          gameConfig={gameConfig}
          completions={completions}
          levels={levels}
        />
      </HiddenTrailShell>
    );
  }

  // Show game rules if not started
  if (participant.status === "not_started") {
    return (
      <HiddenTrailShell>
        <div className="min-h-screen bg-[var(--background)]">
          <TrailHero 
            level={participant.current_level} 
            totalLevels={levels.length}
            totalPoints={participant.total_points}
          />
          <div className="max-container mx-auto py-12">
            <GameRules />
            <div className="mt-8 text-center">
              <button
                onClick={() => {
                  alert("Scan the first QR code to begin your journey!");
                }}
                className="rounded-full px-8 py-4 bg-[var(--accent)] text-[var(--background)] font-bold text-lg hover:bg-opacity-90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                SCAN FIRST MARKER
              </button>
            </div>
          </div>
        </div>
      </HiddenTrailShell>
    );
  }

  // Active game state
  return (
    <HiddenTrailShell>
      <div className="min-h-screen bg-[var(--background)]">
        <TrailHero 
          level={participant.current_level} 
          totalLevels={levels.length}
          totalPoints={participant.total_points}
        />
        <div className="max-container mx-auto py-12">
          <TrailProgress 
            currentLevel={participant.current_level} 
            totalLevels={levels.length}
          />
          <div className="mt-8 text-center">
            <p className="text-xl font-black text-[var(--foreground)] mb-6">
              Ready to continue your journey? Scan the next QR marker to begin.
            </p>
            <button
              onClick={() => {
                const token = prompt("Enter the QR token from your marker:");
                if (token) {
                  router.push(`/hidden-trail/scan/${token}`);
                }
              }}
              className="rounded-full px-8 py-4 bg-[var(--accent)] text-[var(--background)] font-bold text-lg hover:bg-opacity-90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              SCAN NEXT MARKER
            </button>
          </div>
        </div>
      </div>
    </HiddenTrailShell>
  );
}
