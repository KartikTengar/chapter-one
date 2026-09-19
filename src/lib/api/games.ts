import { apiFetch } from "./client";

export type Game = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  is_visible: boolean;
  master_enabled: boolean;
};

export async function getGames(): Promise<Game[]> {
  const data = await apiFetch<{ data: Game[] }>(`/api/v1/games`);
  return data?.data ?? [];
}

export async function getRunningGames(): Promise<Game[]> {
  const data = await apiFetch<{ data: Game[] }>(`/api/v1/games/running`);
  return data?.data ?? [];
}

export async function getGame(slug: string): Promise<Game | null> {
  try {
    const data = await apiFetch<{ data: Game }>(`/api/v1/games/${slug}`);
    return data?.data ?? null;
  } catch {
    return null;
  }
}
