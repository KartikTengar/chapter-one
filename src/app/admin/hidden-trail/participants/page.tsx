"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HiddenTrailAdminShell } from "@/components/admin/hidden-trail/HiddenTrailAdminShell";
import { getClientAdminUser } from "@/lib/hidden-trail/admin-client";

type Participant = {
  game_id: string;
  user_id: string;
  current_level: number;
  total_points: number;
  status: string;
  started_at: string | null;
  last_scan_at: string | null;
  completed_at: string | null;
  profiles:
    | { full_name: string | null; email: string | null }
    | null;
};

type ParticipantsResponse = {
  participants?: Participant[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
};

export default function ParticipantsPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<
    { id: string; email: string; role: string } | null
  >(null);

  const [authLoading, setAuthLoading] = useState(true);
  const [gameLoading, setGameLoading] = useState(true);
  const [hasGame, setHasGame] = useState<boolean | null>(null);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
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
      const response = await fetch(
        "/api/admin/hidden-trail/participants?page=1&pageSize=100&sortBy=total_points&sortOrder=desc",
        {
          cache: "no-store",
          credentials: "include",
        }
      );

      const data = (await response.json().catch(() => null)) as
        | ParticipantsResponse
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          (data && "error" in data && data.error) ||
            "Failed to load participants"
        );
      }

      const result = (data ?? {}) as ParticipantsResponse;
      setParticipants(result.participants ?? []);
      setTotalParticipants(result.pagination?.total ?? (result.participants?.length ?? 0));
    } catch (err) {
      setParticipants([]);
      setTotalParticipants(0);
      setError(
        err instanceof Error ? err.message : "Failed to load participants"
      );
    } finally {
      setParticipantsLoading(false);
    }
  }, []);

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
