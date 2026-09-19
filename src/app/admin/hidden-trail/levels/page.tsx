"use client";

import { useEffect, useState } from "react";
import { HiddenTrailAdminShell } from "@/components/admin/hidden-trail/HiddenTrailAdminShell";
import { getClientAdminUser } from "@/lib/hidden-trail/admin-client";
import { useRouter } from "next/navigation";

interface Level {
  id: string;
  game_id: string;
  level_number: number;
  token: string;
  title: string;
  location_riddle: string;
  answer_riddle: string;
  answer_hash: string;
  case_sensitive: boolean;
  admin_location: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function LevelsPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<
    | { id: string; email: string; role: string }
    | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [hasGame, setHasGame] = useState<boolean | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
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

  const startEdit = (level: Level) => {
    setEditingLevelId(level.id);
    setEditForm({
      title: level.title,
      location_riddle: level.location_riddle,
      answer_riddle: level.answer_riddle,
      correct_answer: "", // Never pre-fill the correct answer for security
      case_sensitive: level.case_sensitive,
      admin_location: level.admin_location ?? "",
      is_active: level.is_active,
    });
  };

  const cancelEdit = () => {
    setEditingLevelId(null);
  };

  const saveEdit = async (levelId: string) => {
    setSaving(levelId);
    try {
      await fetch(`/api/admin/hidden-trail/levels/${levelId}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      router.refresh();
    } catch {
      alert("Failed to save level");
    } finally {
      setSaving(null);
    }
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

  if (loading) return null;

  const renderLevelRow = (level: Level) => {
    if (editingLevelId === level.id) {
      return (
        <tr key={level.id}>
          <td>{String(level.level_number).padStart(2, "0")}</td>
          <td>
            <input
              type="text"
              value={editForm.title}
              onChange={e => setEditForm({ ...editForm, title: e.target.value })}
              className="chapter-admin-input"
              style={{ width: "100%" }}
            />
          </td>
          <td>
            <textarea
              value={editForm.location_riddle}
              onChange={e => setEditForm({ ...editForm, location_riddle: e.target.value })}
              className="chapter-admin-input"
              rows={2}
              style={{ width: "100%" }}
            />
          </td>
          <td>
            <textarea
              value={editForm.answer_riddle}
              onChange={e => setEditForm({ ...editForm, answer_riddle: e.target.value })}
              className="chapter-admin-input"
              rows={2}
              style={{ width: "100%" }}
            />
          </td>
          <td>
            <input
              type="password"
              value={editForm.correct_answer}
              onChange={e => setEditForm({ ...editForm, correct_answer: e.target.value })}
              className="chapter-admin-input"
              style={{ width: "100%" }}
              placeholder="Enter correct answer (will be hashed)"
            />
          </td>
          <td>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editForm.is_active}
                onChange={e => setEditForm({ ...editForm, is_active: e.target.checked })}
                className="chapter-admin-checkbox"
              />
              <span>Active</span>
            </label>
          </td>
          <td>—</td>
          <td>{level.token ? "••••••••••••••••••••" : "—"}</td>
          <td>
            <button
              className="chapter-admin-btn"
              onClick={() => saveEdit(level.id)}
              disabled={saving === level.id}
            >
              {saving === level.id ? "Saving..." : "Save"}
            </button>
            <button
              className="chapter-admin-btn"
              onClick={cancelEdit}
              style={{ marginLeft: "0.5rem" }}
            >
              Cancel
            </button>
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
          {level.is_active ? "ACTIVE" : <span>PAUSED</span>}
        </td>
        <td>{level.points ?? "—"}</td>
        <td>
          {level.token ? "••••••••••••••••••••" : "—"}
        </td>
        <td>
          <button
            className="chapter-admin-btn"
            onClick={() => startEdit(level)}
          >
            Edit
          </button>
          <button
            className="chapter-admin-btn"
            onClick={() => toggle(level.id, level.is_active)}
            style={{ marginLeft: "0.5rem" }}
          >
            {level.is_active ? "Deactivate" : "Activate"}
          </button>
        </td>
      </tr>
    );
  };

  if (!adminUser) return null;

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

  if (loading) return null;

  return (
    <HiddenTrailAdminShell adminUser={adminUser}>
      <div className="chapter-admin-content">
        <h1 className="chapter-admin-section-title">LEVELS</h1>

        <div className="chapter-admin-card">
          {levels.length === 0 ? (
            <p>No levels configured yet.</p>
          ) : (
            <table className="chapter-admin-table">
              <thead>
                <tr>
                  <th>LEVEL</th>
                  <th>TITLE</th>
                  <th>LOCATION RIDDLE</th>
                  <th>ANSWER RIDDLE</th>
                  <th>STATUS</th>
                  <th>POINTS</th>
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
          )}
          <div>
            <button
              className="chapter-admin-btn"
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