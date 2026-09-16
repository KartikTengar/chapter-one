"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { GameConfig } from "@/lib/hidden-trail/game";

export function GameSettings() {
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "",
    start_at: "",
    end_at: "",
    score_start_level: 2,
    starting_score: 100,
    score_floor: 30,
    final_secret_enabled: false,
    final_message: "",
    leaderboard_public: true,
    leaderboard_name_mode: "FIRST_NAME" as "FIRST_NAME" | "FULL_NAME" | "ANONYMOUS"
  });

  const router = useRouter();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const init = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch("/api/admin/hidden-trail/settings");
        
        if (!response.ok) {
          if (response.status === 401) {
            if (mountedRef.current) {
              router.replace("/login");
            }
            return;
          }
          throw new Error("Failed to load game settings");
        }
        
        const data = await response.json();
        
        if (!mountedRef.current) return;
        
        setGameConfig(data.config);
        setFormData({
          name: data.config.name || "",
          description: data.config.description || "",
          status: data.config.status || "draft",
          start_at: data.config.start_at ? new Date(data.config.start_at).toISOString().split("T")[0] : "",
          end_at: data.config.end_at ? new Date(data.config.end_at).toISOString().split("T")[0] : "",
          score_start_level: data.config.score_start_level || 2,
          starting_score: data.config.starting_score || 100,
          score_floor: data.config.score_floor || 30,
          final_secret_enabled: data.config.final_secret_enabled || false,
          final_message: data.config.final_message || "",
          leaderboard_public: data.config.leaderboard_public || true,
          leaderboard_name_mode: data.config.leaderboard_name_mode || "FIRST_NAME"
        });
        setLoading(false);
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : "Failed to load game settings");
          setLoading(false);
        }
      }
    };

    init();
    return () => {
      mountedRef.current = false;
    };
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updates = {
        ...formData,
        score_start_level: Number(formData.score_start_level),
        starting_score: Number(formData.starting_score),
        score_floor: Number(formData.score_floor),
        final_secret_enabled: Boolean(formData.final_secret_enabled),
        leaderboard_public: Boolean(formData.leaderboard_public),
        start_at: formData.start_at || null,
        end_at: formData.end_at || null,
      };

      const response = await fetch("/api/admin/hidden-trail/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        if (response.status === 401) {
          if (mountedRef.current) {
            router.replace("/login");
          }
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update settings");
      }

      const data = await response.json();
      
      if (data.config) {
        setSuccess("Settings updated successfully!");
        setGameConfig(data.config);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-[var(--accent)] text-lg font-bold animate-pulse">
            Loading Settings...
          </div>
        </div>
      </div>
    );
  }

  if (error || !gameConfig) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-[var(--surface)] border border-white/[0.06] rounded-2xl p-12 text-center">
            <h2 className="text-2xl font-black text-[var(--foreground)] uppercase tracking-tight mb-3">
              Settings Not Available
            </h2>
            <p className="text-zinc-500 mb-6">
              {error || "We couldn't load the game settings right now."}
            </p>
            <div className="mt-6">
              <Link
                href="/admin/hidden-trail"
                className="rounded-full px-6 py-3 bg-[var(--accent)] text-[var(--background)] font-bold text-sm hover:bg-opacity-90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                RETURN TO OVERVIEW
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <form onSubmit={handleSubmit} className="max-container max-w-4xl mx-auto py-8">
        <h1 className="text-3xl font-black text-[var(--foreground)] uppercase tracking-tight mb-6">
          GAME SETTINGS
        </h1>

        <div>
          {success && (
            <div className="bg-[var(--accent)]/20 border border-[var(--accent)]/30 rounded-xl p-4 mb-6">
              <p className="text-sm font-medium text-[var(--accent)]">{success}</p>
            </div>
          )}

          {error && (
            <div className="bg-[var(--surface)]/30 border border-[var(--accent)]/20 rounded-xl p-4 mb-6">
              <p className="text-sm text-[var(--accent)]">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Game Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="block w-full rounded-xl border border-white/[0.06] bg-[var(--surface)]/20 px-4 py-3 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]/30"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="block w-full rounded-xl border border-white/[0.06] bg-[var(--surface)]/20 px-4 py-3 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]/30"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="block w-full rounded-xl border border-white/[0.06] bg-[var(--surface)]/20 px-4 py-3 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]/30"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="ended">Ended</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  name="start_at"
                  value={formData.start_at}
                  onChange={handleChange}
                  className="block w-full rounded-xl border border-white/[0.06] bg-[var(--surface)]/20 px-4 py-3 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  name="end_at"
                  value={formData.end_at}
                  onChange={handleChange}
                  className="block w-full rounded-xl border border-white/[0.06] bg-[var(--surface)]/20 px-4 py-3 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Score Start Level
                </label>
                <input
                  type="number"
                  name="score_start_level"
                  value={formData.score_start_level}
                  onChange={handleChange}
                  className="block w-full rounded-xl border border-white/[0.06] bg-[var(--surface)]/20 px-4 py-3 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]/30"
                  min="1"
                  max="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Starting Score
                </label>
                <input
                  type="number"
                  name="starting_score"
                  value={formData.starting_score}
                  onChange={handleChange}
                  className="block w-full rounded-xl border border-white/[0.06] bg-[var(--surface)]/20 px-4 py-3 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]/30"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Score Floor
                </label>
                <input
                  type="number"
                  name="score_floor"
                  value={formData.score_floor}
                  onChange={handleChange}
                  className="block w-full rounded-xl border border-white/[0.06] bg-[var(--surface)]/20 px-4 py-3 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]/30"
                  min="1"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="final_secret_enabled"
                    checked={formData.final_secret_enabled}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-white/[0.06] bg-[var(--surface)]/20 text-[var(--accent)] focus:ring-[var(--accent)] focus:ring-2"
                  />
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    Enable Final Secret
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Final Message
                </label>
                <textarea
                  name="final_message"
                  value={formData.final_message}
                  onChange={handleChange}
                  className="block w-full rounded-xl border border-white/[0.06] bg-[var(--surface)]/20 px-4 py-3 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]/30"
                  rows={3}
                  placeholder="Message shown when trail is completed"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="leaderboard_public"
                      checked={formData.leaderboard_public}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-white/[0.06] bg-[var(--surface)]/20 text-[var(--accent)] focus:ring-[var(--accent)] focus:ring-2"
                    />
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      Public Leaderboard
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Leaderboard Name Mode
                  </label>
                  <select
                    name="leaderboard_name_mode"
                    value={formData.leaderboard_name_mode}
                    onChange={handleChange}
                    className="block w-full rounded-xl border border-white/[0.06] bg-[var(--surface)]/20 px-4 py-3 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]/30"
                  >
                    <option value="FIRST_NAME">First Name Only</option>
                    <option value="FULL_NAME">Full Name</option>
                    <option value="INITIALS">Initials</option>
                    <option value="PARTICIPANT_NUMBER">Participant Number</option>
                    <option value="ANONYMOUS">Anonymous</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 border-t border-white/[0.06]">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-[var(--accent)] text-[var(--background)] font-bold py-4 text-base transition-all hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                >
                  {loading ? "Saving..." : "SAVE SETTINGS"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
      </div>
    );
  }
