import { apiFetch } from "./client";

export type LeaderboardEntry = {
  rank: number;
  display_name: string;
  score?: number;
  master_points?: number;
};

export type GameLeaderboard = {
  game: { slug: string; name: string };
  entries: LeaderboardEntry[];
  me: { rank: number | null; score: number } | null;
  total: number;
};

export type MasterLeaderboard = {
  entries: LeaderboardEntry[];
  me: { rank: number | null; master_points: number } | null;
  total: number;
};

export async function getMasterLeaderboard(): Promise<MasterLeaderboard | null> {
  const data = await apiFetch<MasterLeaderboard>('/api/v1/leaderboard/master');
  return data ?? null;
}

export async function getGameLeaderboard(slug: string): Promise<GameLeaderboard | null> {
  try {
    const data = await apiFetch<GameLeaderboard>(`/api/v1/leaderboard/games/${slug}`);
    return data ?? null;
  } catch {
    return null;
  }
}
