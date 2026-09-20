"use client";

import { useEffect, useState, useCallback } from "react";
import { HiddenTrailAdminShell } from "@/components/admin/hidden-trail/HiddenTrailAdminShell";
import { getClientAdminUser } from "@/lib/hidden-trail/admin-client";
import { useRouter } from "next/navigation";
import { GameLevel } from "@/lib/hidden-trail/game";

export default function LevelsPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<
    | { id: string; email: string; role: string }
    | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [hasGame, setHasGame] = useState<boolean | null>(null);
  const [levels, setLevels] = useState<GameLevel[]>([]);
  const [editingLevelId, setEditingLevelId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string;
    location_riddle: string;
    answer_riddle: string;
    correct_answer: string;
    case_sensitive: boolean;
    admin_location: string;
    is_active: boolean;
  }>({
    title: "",
    location_riddle: "",
    answer_riddle: "",
    correct_answer: "",
    case_sensitive: false,
    admin_location: "",
    is_active: true,
  });
  const [saving, setSaving] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    getClientAdminUser().then(u => {
      if (!u) router.replace("/login");
      else {
        setAdminUser(u);
        setLoading(false);
      }
    });
  }, [router]);

  useEffect(() => {
    fetch("/api/admin/hidden-trail/overview")
      .then(r => r.json())
      .then(d => setHasGame(!!d.gameConfig))
      .catch(() => setHasGame(false));
  }, []);

  useEffect(() => {
    if (!hasGame) return;
    fetch("/api/admin/hidden-trail/levels")
      .then(r => r.json())
      .then(d => {
        setLevels(d.levels ?? []);
        setLoading(false);
      })
      .catch(() => {
        setLevels([]);
        setLoading(false);
      });
  }, [hasGame]);

  const toggle = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/admin/hidden-trail/levels/${id}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      router.refresh();
    } catch {
      // ignore transient errors
    }
  };

  const startEdit = useCallback((level: GameLevel) => {
    setEditingLevelId(level.id);
    setEditForm({
      title: level.title ?? "",
      location_riddle: level.location_riddle ?? "",
      answer_riddle: level.answer_riddle ?? "",
      correct_answer: "",
      case_sensitive: level.case_sensitive ?? false,
      admin_location: level.admin_location ?? "",
      is_active: level.is_active ?? true,
    });
    setSaveError(null);
    setSaveSuccess(null);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingLevelId(null);
    setSaveError(null);
    setSaveSuccess(null);
  }, []);

  const saveEdit = async (levelId: string) => {
    setSaving(levelId);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      const response = await fetch(`/api/admin/hidden-trail/levels/${levelId}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save level");
      }
      setSaveSuccess("Level updated.");
      setEditingLevelId(null);
      await new Promise(r => setTimeout(r, 800));
      router.refresh();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save level. Please try again.");
    } finally {
      setSaving(null);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  if (loading || !adminUser) return null;

  if (!hasGame) {
    return (
      <HiddenTrailAdminShell adminUser={adminUser}>
        <div className="chapter-admin-empty">
          <h2 className="chapter-admin-empty-title">CREATE A GAME FIRST</h2>
          <p className="chapter-admin-empty-text">
            Configure Hidden Trail before managing levels.
          </p>
          <a href="/admin/hidden-trail/settings" className="chapter-admin-btn">
            CONFIGURE GAME
          </a>
        </div>
      </HiddenTrailAdminShell>
    );
  }

  const renderLevelRow = (level: GameLevel) => {
    if (editingLevelId === level.id) {
      return (
        <tr key={level.id} className="chapter-admin-edit-row">
          <td colSpan={7}>
            <div className="chapter-admin-edit-form">
              <div className="chapter-admin-edit-header">
                <h3>EDIT LEVEL {String(level.level_number).padStart(2, "0")}</h3>
                <div className="chapter-admin-edit-actions">
                  <button
                    className="chapter-admin-btn chapter-admin-btn--secondary"
                    onClick={cancelEdit}
                    disabled={saving === level.id}
                  >
                    Cancel
                  </button>
                  <button
                    className="chapter-admin-btn"
                    onClick={() => saveEdit(level.id)}
                    disabled={saving === level.id}
                  >
                    {saving === level.id ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>

              {saveError && (
                <div className="chapter-admin-alert chapter-admin-alert--error">
                  {saveError}
                </div>
              )}
              {saveSuccess && (
                <div className="chapter-admin-alert chapter-admin-alert--success">
                  {saveSuccess}
                </div>
              )}

              <div className="chapter-admin-edit-sections">
                {/* SECTION A — BASIC */}
                <fieldset className="chapter-admin-edit-section">
                  <legend>LEVEL DETAILS</legend>
                  <div className="chapter-admin-form-field">
                    <label htmlFor={`edit-title-${level.id}`}>Title</label>
                    <input
                      id={`edit-title-${level.id}`}
                      type="text"
                      value={editForm.title}
                      onChange={e => handleInputChange("title", e.target.value)}
                      className="chapter-admin-input"
                      placeholder="Level title"
                      required
                    />
                  </div>
                </fieldset>

                {/* SECTION B — FIND THE NEXT MARKER */}
                <fieldset className="chapter-admin-edit-section">
                  <legend>FIND THE NEXT MARKER</legend>
                  <div className="chapter-admin-form-field">
                    <label htmlFor={`edit-location-riddle-${level.id}`}>
                      LOCATION RIDDLE
                    </label>
                    <p className="chapter-admin-help-text">
                      This clue tells the player where to find the next QR marker.
                    </p>
                    <textarea
                      id={`edit-location-riddle-${level.id}`}
                      value={editForm.location_riddle}
                      onChange={e => handleInputChange("location_riddle", e.target.value)}
                      className="chapter-admin-input chapter-admin-textarea"
                      rows={3}
                      placeholder="e.g., Where students gather when lectures end, where footsteps echo but classrooms are gone..."
                    />
                  </div>
                </fieldset>

                {/* SECTION C — SOLVE THE MARKER */}
                <fieldset className="chapter-admin-edit-section">
                  <legend>SOLVE THE MARKER</legend>
                  <div className="chapter-admin-form-field">
                    <label htmlFor={`edit-answer-riddle-${level.id}`}>
                      ANSWER RIDDLE
                    </label>
                    <p className="chapter-admin-help-text">
                      This riddle is revealed after the player scans the correct marker.
                    </p>
                    <textarea
                      id={`edit-answer-riddle-${level.id}`}
                      value={editForm.answer_riddle}
                      onChange={e => handleInputChange("answer_riddle", e.target.value)}
                      className="chapter-admin-input chapter-admin-textarea"
                      rows={3}
                      placeholder="e.g., I have pages but I am not a book. I carry knowledge but cannot speak. What am I?"
                    />
                  </div>
                </fieldset>

                {/* SECTION D — CORRECT ANSWER */}
                <fieldset className="chapter-admin-edit-section">
                  <legend>CORRECT ANSWER</legend>
                  <div className="chapter-admin-form-field">
                    <label htmlFor={`edit-correct-answer-${level.id}`}>
                      CORRECT ANSWER
                    </label>
                    <p className="chapter-admin-help-text">
                      The answer the player must submit. This value is never shown back after saving.
                    </p>
                    <input
                      id={`edit-correct-answer-${level.id}`}
                      type="password"
                      value={editForm.correct_answer}
                      onChange={e => handleInputChange("correct_answer", e.target.value)}
                      className="chapter-admin-input"
                      placeholder="Enter correct answer"
                      autoComplete="off"
                    />
                    <p className="chapter-admin-help-text chapter-admin-help-text--warning">
                      Leave blank to keep the existing answer. Enter a new answer to replace it.
                    </p>
                  </div>
                </fieldset>

                {/* SECTION E — ANSWER MATCHING */}
                <fieldset className="chapter-admin-edit-section">
                  <legend>ANSWER MATCHING</legend>
                  <div className="chapter-admin-form-field chapter-admin-form-field--checkbox">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.case_sensitive}
                        onChange={e => handleInputChange("case_sensitive", e.target.checked)}
                        className="chapter-admin-checkbox"
                      />
                      <span>CASE SENSITIVE</span>
                    </label>
                    <p className="chapter-admin-help-text">
                      Off = answers are matched case-insensitively after trimming.<br />
                      On = capitalization must match.
                    </p>
                  </div>
                </fieldset>

                {/* SECTION F — ADMIN LOCATION */}
                <fieldset className="chapter-admin-edit-section">
                  <legend>ADMIN PLACEMENT</legend>
                  <div className="chapter-admin-form-field">
                    <label htmlFor={`edit-admin-location-${level.id}`}>
                      ADMIN LOCATION / PLACEMENT NOTES
                    </label>
                    <p className="chapter-admin-help-text">
                      Internal notes for admin reference only. Never shown to students.
                    </p>
                    <textarea
                      id={`edit-admin-location-${level.id}`}
                      value={editForm.admin_location}
                      onChange={e => handleInputChange("admin_location", e.target.value)}
                      className="chapter-admin-input chapter-admin-textarea"
                      rows={2}
                      placeholder="e.g., North entrance, beside notice board"
                    />
                  </div>
                </fieldset>

                {/* SECTION G — STATUS */}
                <fieldset className="chapter-admin-edit-section">
                  <legend>STATUS</legend>
                  <div className="chapter-admin-form-field chapter-admin-form-field--checkbox">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.is_active}
                        onChange={e => handleInputChange("is_active", e.target.checked)}
                        className="chapter-admin-checkbox"
                      />
                      <span>ACTIVE</span>
                    </label>
                    <p className="chapter-admin-help-text">
                      Inactive levels are hidden from gameplay.
                    </p>
                  </div>
                </fieldset>
              </div>
            </div>
          </td>
        </tr>
      );
    }

    return (
      <tr key={level.id}>
        <td>{String(level.level_number).padStart(2, "0")}</td>
        <td>{level.title ?? "Unnamed"}</td>
        <td>{level.location_riddle || "—"}</td>
        <td>{level.answer_riddle || "—"}</td>
        <td>
          {level.is_active ? (
            <span className="chapter-admin-badge chapter-admin-badge--active">ACTIVE</span>
          ) : (
            <span className="chapter-admin-badge chapter-admin-badge--paused">PAUSED</span>
          )}
        </td>
        <td>
          {level.token ? "••••••••••••••••••••" : "—"}
        </td>
        <td>
          <div className="chapter-admin-actions">
            <button
              className="chapter-admin-btn chapter-admin-btn--edit"
              onClick={() => startEdit(level)}
            >
              EDIT
            </button>
            <button
              className={`chapter-admin-btn ${level.is_active ? "chapter-admin-btn--danger" : ""}`}
              onClick={() => toggle(level.id, level.is_active)}
              style={{ marginLeft: "0.5rem" }}
            >
              {level.is_active ? "DEACTIVATE" : "ACTIVATE"}
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <HiddenTrailAdminShell adminUser={adminUser}>
      <div className="chapter-admin-content">
        <h1 className="chapter-admin-section-title">LEVELS</h1>

        <div className="chapter-admin-card">
          {levels.length === 0 ? (
            <p>No levels configured yet.</p>
          ) : (
            <div className="chapter-admin-table-wrapper">
              <table className="chapter-admin-table">
                <thead>
                  <tr>
                    <th>LEVEL</th>
                    <th>TITLE</th>
                    <th>LOCATION RIDDLE</th>
                    <th>ANSWER RIDDLE</th>
                    <th>STATUS</th>
                    <th>QR TOKEN</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {levels.map((level) => (
                    renderLevelRow(level)
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="chapter-admin-card-footer">
            <button
              className="chapter-admin-btn chapter-admin-btn--secondary"
              onClick={() => router.refresh()}
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    </HiddenTrailAdminShell>
  );
}