"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HiddenTrailAdminShell } from "@/components/admin/hidden-trail/HiddenTrailAdminShell";
import { BranchSelector } from "@/components/leaderboard/BranchSelector";
import { BRANCH_LABELS } from "@/lib/profile/branches";
import { getClientAdminUser } from "@/lib/hidden-trail/admin-client";
import { adminGetParticipants, type AdminParticipant } from "@/lib/api/trail";

export default function HiddenTrailAdminLeaderboardPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<{ id: string; email: string; role: string } | null>(null);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [rows, setRows] = useState<AdminParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminGetParticipants(1, 100, selectedBranch || undefined);
      setRows(data.participants ?? []);
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : "Failed to load leaderboard.");
    } finally {
      setLoading(false);
    }
  }, [selectedBranch]);

  useEffect(() => {
    let mounted = true;
    getClientAdminUser().then((user) => {
      if (!mounted) return;
      if (!user) {
        router.replace("/admin/login");
        return;
      }
      setAdminUser(user);
    });
    return () => {
      mounted = false;
    };
  }, [router]);

  useEffect(() => {
    if (adminUser) void load();
  }, [adminUser, load]);

  if (!adminUser) {
    return null;
  }

  return (
    <HiddenTrailAdminShell adminUser={adminUser}>
      <div className="chapter-admin-content">
        <div className="chapter-admin-section-heading">
          <div>
            <h1 className="chapter-admin-section-title">LEADERBOARD</h1>
            <p className="chapter-admin-muted">
              {selectedBranch
                ? `${BRANCH_LABELS[selectedBranch as keyof typeof BRANCH_LABELS] ?? selectedBranch} · Hidden Trail ranking`
                : "All branches · Hidden Trail ranking"}
            </p>
          </div>
          <div className="chapter-admin-actions">
            <BranchSelector value={selectedBranch} onChange={setSelectedBranch} />
            <button
              type="button"
              className="chapter-admin-btn"
              onClick={() => void load()}
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="chapter-admin-empty" role="alert">
            <h2 className="chapter-admin-empty-title">COULD NOT LOAD LEADERBOARD</h2>
            <p className="chapter-admin-empty-text">{error}</p>
            <button type="button" className="chapter-admin-btn" onClick={() => void load()} disabled={loading}>
              TRY AGAIN
            </button>
          </div>
        ) : loading && rows.length === 0 ? (
          <div className="chapter-admin-empty">
            <p className="chapter-admin-empty-text">Loading leaderboard…</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="chapter-admin-empty">
            <h2 className="chapter-admin-empty-title">NO SCORES YET</h2>
            <p className="chapter-admin-empty-text">
              {selectedBranch ? "No participants have scores in this branch yet." : "No participants have scores yet."}
            </p>
          </div>
        ) : (
          <div className="chapter-admin-card">
            <div className="chapter-admin-table-wrap">
              <table className="chapter-admin-table">
                <thead>
                  <tr>
                    <th>RANK</th>
                    <th>NAME</th>
                    <th>BRANCH</th>
                    <th>LEVEL</th>
                    <th>POINTS</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((participant, index) => {
                    const displayName =
                      participant.profiles?.full_name?.trim() ||
                      participant.profiles?.email?.trim() ||
                      "Anonymous";
                    return (
                      <tr key={participant.user_id}>
                        <td>#{index + 1}</td>
                        <td>{displayName}</td>
                        <td>
                          {participant.branch
                            ? BRANCH_LABELS[participant.branch as keyof typeof BRANCH_LABELS] ?? participant.branch
                            : "—"}
                        </td>
                        <td>{participant.current_level ?? 0}</td>
                        <td>{participant.total_points ?? 0}</td>
                        <td>{participant.status || "not_started"}</td>
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
