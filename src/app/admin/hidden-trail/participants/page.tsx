"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HiddenTrailAdminShell } from "@/components/admin/hidden-trail/HiddenTrailAdminShell";
import { getClientAdminUser } from "@/lib/hidden-trail/admin-client";
import { adminGetParticipants, type AdminParticipant } from "@/lib/api/trail";
import { BRANCH_OPTIONS, BRANCH_LABELS } from "@/lib/profile/branches";

export default function ParticipantsPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<
    { id: string; email: string; role: string } | null
  >(null);

  const [authLoading, setAuthLoading] = useState(true);
  const [gameLoading, setGameLoading] = useState(true);
  const [hasGame, setHasGame] = useState<boolean | null>(null);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [participants, setParticipants] = useState<AdminParticipant[]>([]);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    getClientAdminUser()
      .then((user) => {
        if (!mounted) return;

        if (!user) {
          router.replace("/admin/login");
          return;
        }

        setAdminUser(user);
      })
      .finally(() => {
        if (mounted) setAuthLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [router]);

  useEffect(() => {
    if (!adminUser) return;

    let mounted = true;
    setGameLoading(true);
    setError(null);

    fetch("/api/admin/hidden-trail/overview", {
      cache: "no-store",
      credentials: "include",
    })
      .then(async (response) => {
        const data = (await response.json().catch(() => null)) as
          | { gameConfig?: unknown; error?: string }
          | null;

        if (!response.ok) {
          throw new Error(data?.error || "Failed to load game configuration");
        }

        if (!mounted) return;
        setHasGame(Boolean(data?.gameConfig));
      })
      .catch((err) => {
        if (!mounted) return;
        setHasGame(false);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load game configuration"
        );
      })
      .finally(() => {
        if (mounted) setGameLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [adminUser]);

  const loadParticipants = useCallback(async () => {
    setParticipantsLoading(true);
    setError(null);

    try {
      const data = await adminGetParticipants(1, 100, selectedBranch || undefined);
      setParticipants(data.participants ?? []);
      setTotalParticipants(
        data.pagination?.total ?? data.participants?.length ?? 0
      );
    } catch (err) {
      setParticipants([]);
      setTotalParticipants(0);
      setError(
        err instanceof Error ? err.message : "Failed to load participants"
      );
    } finally {
      setParticipantsLoading(false);
    }
  }, [selectedBranch]);


  useEffect(() => {
    if (hasGame) {
      void loadParticipants();
    }
  }, [hasGame, loadParticipants]);

  if (authLoading || !adminUser) {
    return null;
  }

  if (gameLoading) {
    return (
      <HiddenTrailAdminShell adminUser={adminUser}>
        <div className="chapter-admin-content">
          <div className="chapter-admin-empty">
            <p className="chapter-admin-empty-text">Loading game configuration…</p>
          </div>
        </div>
      </HiddenTrailAdminShell>
    );
  }

  if (!hasGame) {
    return (
      <HiddenTrailAdminShell adminUser={adminUser}>
        <div className="chapter-admin-content">
          <div className="chapter-admin-empty">
            <h2 className="chapter-admin-empty-title">CREATE A GAME FIRST</h2>
            <p className="chapter-admin-empty-text">
              Configure Hidden Trail before viewing participants.
            </p>
            <a
              href="/admin/hidden-trail/settings"
              className="chapter-admin-btn"
            >
              CONFIGURE GAME
            </a>
          </div>
        </div>
      </HiddenTrailAdminShell>
    );
  }

  return (
    <HiddenTrailAdminShell adminUser={adminUser}>
      <div className="chapter-admin-content">
        <div className="chapter-admin-section-heading">
          <div>
            <h1 className="chapter-admin-section-title">PARTICIPANTS</h1>
            <p className="chapter-admin-muted">
              {totalParticipants} participant
              {totalParticipants === 1 ? "" : "s"} in the current Hidden Trail game.
            </p>
          </div>

          <div className="chapter-admin-actions">
            <label className="chapter-admin-field">
              <span className="chapter-admin-field-label">BRANCH</span>
              <select
                value={selectedBranch}
                onChange={(event) => setSelectedBranch(event.target.value)}
                disabled={participantsLoading}
                className="chapter-admin-input"
                aria-label="Filter participants by branch"
              >
                <option value="">All branches</option>
                {BRANCH_OPTIONS.map((branch) => (
                  <option key={branch.value} value={branch.value}>
                    {BRANCH_LABELS[branch.value]}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="chapter-admin-btn"
              onClick={() => void loadParticipants()}
              disabled={participantsLoading}
              aria-busy={participantsLoading}
            >
              {participantsLoading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>

        {error && (
          <div className="chapter-admin-empty" role="alert">
            <h2 className="chapter-admin-empty-title">COULD NOT LOAD PARTICIPANTS</h2>
            <p className="chapter-admin-empty-text">{error}</p>
            <button
              type="button"
              className="chapter-admin-btn"
              onClick={() => void loadParticipants()}
              disabled={participantsLoading}
            >
              TRY AGAIN
            </button>
          </div>
        )}

        {!error && participantsLoading && participants.length === 0 && (
          <div className="chapter-admin-empty">
            <p className="chapter-admin-empty-text">Loading participants…</p>
          </div>
        )}

        {!error && !participantsLoading && participants.length === 0 && (
          <div className="chapter-admin-empty">
            <h2 className="chapter-admin-empty-title">NO PARTICIPANTS YET</h2>
            <p className="chapter-admin-empty-text">
              No one has started this Hidden Trail game yet.
            </p>
          </div>
        )}

        {!error && participants.length > 0 && (
          <div className="chapter-admin-card">
            <div className="chapter-admin-table-wrap">
              <table className="chapter-admin-table">
                <thead>
                  <tr>
                    <th>NAME</th>
                    <th>BRANCH</th>
                    <th>STATUS</th>
                    <th>CURRENT LEVEL</th>
                    <th>POINTS</th>
                    <th>STARTED</th>
                    <th>COMPLETED</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((participant) => {
                    const displayName =
                      participant.profiles?.full_name?.trim() ||
                      participant.profiles?.email?.trim() ||
                      "Anonymous";

                    return (
                      <tr key={participant.user_id}>
                        <td>{displayName}</td>
                        <td>
                          {participant.branch
                            ? BRANCH_LABELS[participant.branch as keyof typeof BRANCH_LABELS] ?? participant.branch
                            : "—"}
                        </td>
                        <td>{participant.status || "not_started"}</td>
                        <td>{participant.current_level ?? 0}</td>
                        <td>{participant.total_points ?? 0}</td>
                        <td>
                          {participant.started_at
                            ? new Date(participant.started_at).toLocaleDateString()
                            : "—"}
                        </td>
                        <td>
                          {participant.completed_at
                            ? new Date(participant.completed_at).toLocaleDateString()
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </HiddenTrailAdminShell>
  );
}
