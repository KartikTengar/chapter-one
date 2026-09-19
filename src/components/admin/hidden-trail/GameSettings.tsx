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
        
        const config = data.config || {};
        setGameConfig(config);
        setFormData({
          name: config.name || "",
          description: config.description || "",
          status: config.status || "draft",
          start_at: config.start_at ? new Date(config.start_at).toISOString().split("T")[0] : "",
          end_at: config.end_at ? new Date(config.end_at).toISOString().split("T")[0] : "",
          score_start_level: config.score_start_level || 2,
          starting_score: config.starting_score || 100,
          score_floor: config.score_floor || 30,
          final_secret_enabled: config.final_secret_enabled || false,
          final_message: config.final_message || "",
          leaderboard_public: config.leaderboard_public || true,
          leaderboard_name_mode: config.leaderboard_name_mode || "FIRST_NAME"
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

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/hidden-trail/settings/create", { method: "POST" });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to create configuration");
      }
      const data = await response.json();
      if (!mountedRef.current) return;
      setGameConfig(data.config);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create configuration");
    } finally {
      setLoading(false);
    }
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
      <div className="chapter-admin-card">
        <p>Loading Settings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chapter-admin-empty">
        <h2 className="chapter-admin-empty-title">Settings Not Available</h2>
        <p className="chapter-admin-empty-text">{error || "We couldn't load the game settings right now."}</p>
        <Link href="/admin/hidden-trail" className="chapter-admin-btn">RETURN TO OVERVIEW</Link>
      </div>
    );
  }

  if (!gameConfig) {
    return (
      <div className="chapter-admin-empty">
        <h2 className="chapter-admin-empty-title">NO HIDDEN TRAIL CONFIGURATION</h2>
        <p className="chapter-admin-empty-text">A Hidden Trail game has not been configured yet.</p>
        <button onClick={handleCreate} className="chapter-admin-btn" style={{ marginRight: '0.5rem' }}>CREATE HIDDEN TRAIL CONFIGURATION</button>
        <Link href="/admin/hidden-trail" className="chapter-admin-btn">RETURN TO OVERVIEW</Link>
      </div>
    );
  }

  return (
    <div className="chapter-admin-content">
      <form onSubmit={handleSubmit} className="chapter-admin-form">
        <h1 className="chapter-admin-section-title">
          GAME SETTINGS
        </h1>

        <div>
          {success && (
            <div className="chapter-admin-alert chapter-admin-alert-success">
              <p>{success}</p>
            </div>
          )}

          {error && (
            <div className="chapter-admin-alert chapter-admin-alert-error">
              <p>{error}</p>
            </div>
          )}

          <div>
            <div className="chapter-admin-form-group">
              <label className="chapter-admin-label">
                Game Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="chapter-admin-input"
                required
              />
            </div>
            <div className="chapter-admin-form-group">
              <label className="chapter-admin-label">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="chapter-admin-input"
                rows={4}
              />
            </div>

            <div className="chapter-admin-form-grid">
              <div className="chapter-admin-form-group">
                <label className="chapter-admin-label">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="chapter-admin-input"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="ended">Ended</option>
                </select>
              </div>

              <div className="chapter-admin-form-group">
                <label className="chapter-admin-label">
                  Start Date
                </label>
                <input
                  type="date"
                  name="start_at"
                  value={formData.start_at}
                  onChange={handleChange}
                  className="chapter-admin-input"
                />
              </div>

              <div className="chapter-admin-form-group">
                <label className="chapter-admin-label">
                  End Date
                </label>
                <input
                  type="date"
                  name="end_at"
                  value={formData.end_at}
                  onChange={handleChange}
                  className="chapter-admin-input"
                />
              </div>

              <div className="chapter-admin-form-group">
                <label className="chapter-admin-label">
                  Score Start Level
                </label>
                <input
                  type="number"
                  name="score_start_level"
                  value={formData.score_start_level}
                  onChange={handleChange}
                  className="chapter-admin-input"
                  min="1"
                  max="10"
                />
              </div>

              <div className="chapter-admin-form-group">
                <label className="chapter-admin-label">
                  Starting Score
                </label>
                <input
                  type="number"
                  name="starting_score"
                  value={formData.starting_score}
                  onChange={handleChange}
                  className="chapter-admin-input"
                  min="1"
                />
              </div>

              <div className="chapter-admin-form-group">
                <label className="chapter-admin-label">
                  Score Floor
                </label>
                <input
                  type="number"
                  name="score_floor"
                  value={formData.score_floor}
                  onChange={handleChange}
                  className="chapter-admin-input"
                  min="1"
                />
              </div>

              <div className="chapter-admin-form-group">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="final_secret_enabled"
                    checked={formData.final_secret_enabled}
                    onChange={handleChange}
                    className="chapter-admin-checkbox"
                  />
                  <span className="chapter-admin-label">
                    Enable Final Secret
                  </span>
                </label>
              </div>

              <div className="chapter-admin-form-group">
                <label className="chapter-admin-label">
                  Final Message
                </label>
                <textarea
                  name="final_message"
                  value={formData.final_message}
                  onChange={handleChange}
                  className="chapter-admin-input"
                  rows={3}
                  placeholder="Message shown when trail is completed"
                />
              </div>

              <div className="chapter-admin-form-grid">
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="leaderboard_public"
                      checked={formData.leaderboard_public}
                      onChange={handleChange}
                      className="chapter-admin-checkbox"
                    />
                    <span className="chapter-admin-label">
                      Public Leaderboard
                    </span>
                  </label>
                </div>

                <div>
                  <label className="chapter-admin-label">
                    Leaderboard Name Mode
                  </label>
                  <select
                    name="leaderboard_name_mode"
                    value={formData.leaderboard_name_mode}
                    onChange={handleChange}
                    className="chapter-admin-input"
                  >
                    <option value="FIRST_NAME">First Name Only</option>
                    <option value="FULL_NAME">Full Name</option>
                    <option value="INITIALS">Initials</option>
                    <option value="PARTICIPANT_NUMBER">Participant Number</option>
                    <option value="ANONYMOUS">Anonymous</option>
                  </select>
                </div>
              </div>

              <div className="chapter-admin-actions">
                <button
                  type="submit"
                  disabled={loading}
                  className="chapter-admin-btn"
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
