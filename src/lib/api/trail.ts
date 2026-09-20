import { createClient } from "@/lib/supabase/client";
import { getApiBaseUrl } from "./client";

async function authHeaders(): Promise<Record<string, string>> {
  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
  } catch {
    // fall through to unauthenticated request
  }
  return {};
}

async function trailFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = await authHeaders();
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), 15000);
  const requestHeaders = new Headers(init?.headers);
  if (!requestHeaders.has("Content-Type") && init?.body) requestHeaders.set("Content-Type", "application/json");
  Object.entries(headers).forEach(([key, value]) => requestHeaders.set(key, value));
  let res: Response;
  try {
    res = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      headers: requestHeaders,
      cache: "no-store",
      signal: init?.signal ?? controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiTrailError("TIMEOUT", "The request timed out. Please check your connection and try again.");
    }
    throw error;
  } finally {
    globalThis.clearTimeout(timeout);
  }
  if (!res.ok) {
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      // non-JSON error body
    }
    const error = (data as { error?: { code?: string; message?: string } })?.error;
    throw new ApiTrailError(error?.code ?? "REQUEST_FAILED", error?.message ?? `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

async function trailFetchForm<T>(path: string, form: FormData): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    method: "POST",
    headers,
    body: form,
  });
  if (!res.ok) {
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      // non-JSON error body
    }
    const error = (data as { error?: { code?: string; message?: string } })?.error;
    throw new ApiTrailError(error?.code ?? "REQUEST_FAILED", error?.message ?? `Upload failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export class ApiTrailError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export interface TrailGameState {
  configured: boolean;
  game: {
    id: string;
    name: string;
    status: string;
    start_at: string | null;
    end_at: string | null;
    photo_feature_enabled: boolean;
    gallery_enabled: boolean;
    live_display_enabled: boolean;
    leaderboard_name_mode: string;
  } | null;
  participant: {
    status: string;
    current_level: number;
    total_points: number;
    started_at: string | null;
    last_scan_at: string | null;
    completed_at: string | null;
  } | null;
}

export interface TrailScanResult {
  game_id: string | null;
  level_id: string | null;
  level_number: number | null;
  is_valid: boolean;
  is_expected_level: boolean;
  is_duplicate: boolean;
  game_status: string;
  current_level: number;
  total_points: number;
  location_riddle: string | null;
  answer_riddle: string | null;
  case_sensitive: boolean;
  error_message: string | null;
}

export interface TrailAnswerResult {
  success: boolean;
  points_awarded: number;
  scanner_position: number;
  total_points: number;
  current_level: number;
  level_number: number;
  status: string;
  is_completed: boolean;
  location_riddle: string | null;
  answer_riddle: string | null;
  photo_feature_enabled: boolean;
  game_id: string;
  level_id: string;
}

export interface TrailStats {
  configured: boolean;
  stats: {
    markers_cleared: number;
    total_points: number;
    wrong_answers: number;
    invalid_scans: number;
    photos: number;
    streak: number;
    best_streak: number;
    status: string;
    started_at: string | null;
    completed_at: string | null;
    total_time_seconds: number | null;
    rank: number | null;
    total_participants: number;
  } | null;
}

export interface ReplayTimelineEvent {
  type: "start" | "marker" | "complete";
  occurred_at: string | null;
  label?: string;
  level?: number | null;
  title?: string;
  points?: number;
  photo_id?: string | null;
}

export interface TrailReplay {
  configured: boolean;
  timeline: ReplayTimelineEvent[];
}

export interface TrailAchievement {
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  unlocked: boolean;
  earned_at: string | null;
}

export async function getTrailState(): Promise<TrailGameState> {
  return trailFetch<TrailGameState>("/api/v1/trail/state");
}

export async function trailScan(token: string): Promise<TrailScanResult> {
  return trailFetch<TrailScanResult>(`/api/v1/trail/scan/${encodeURIComponent(token)}`);
}

export async function trailAnswer(token: string, answer: string): Promise<TrailAnswerResult> {
  return trailFetch<TrailAnswerResult>("/api/v1/trail/answer", {
    method: "POST",
    body: JSON.stringify({ token, answer }),
  });
}

export async function getTrailStats(): Promise<TrailStats> {
  return trailFetch<TrailStats>("/api/v1/trail/stats");
}

export async function getTrailReplay(): Promise<TrailReplay> {
  return trailFetch<TrailReplay>("/api/v1/trail/replay");
}

export async function getTrailAchievements(): Promise<{ configured: boolean; achievements: TrailAchievement[] }> {
  return trailFetch<{ configured: boolean; achievements: TrailAchievement[] }>("/api/v1/trail/achievements");
}

export async function getLiveLeaderboard() {
  return trailFetch<unknown>("/api/v1/leaderboard/live");
}

export interface AlbumPhoto {
  id: string;
  level_id: string;
  level_number: number | null;
  title: string | null;
  capture_stage: string | null;
  visibility: "private" | "gallery" | "featured";
  moderation_status: string;
  is_favorite: boolean;
  created_at: string | null;
  url: string | null;
}

export async function getAlbum(): Promise<{ configured: boolean; photos: AlbumPhoto[] }> {
  return trailFetch<{ configured: boolean; photos: AlbumPhoto[] }>("/api/v1/trail/album");
}

export async function uploadTrailPhoto(
  file: File,
  levelId: string,
  captureStage: "before_answer" | "after_completion",
  visibility: "private" | "gallery",
  consent: boolean
): Promise<{ photo: AlbumPhoto }> {
  const form = new FormData();
  form.append("file", file);
  form.append("level_id", levelId);
  form.append("capture_stage", captureStage);
  form.append("visibility", visibility);
  form.append("consent", String(consent));
  return trailFetchForm<{ photo: AlbumPhoto }>("/api/v1/trail/photo", form);
}

export async function updateTrailPhoto(
  id: string,
  updates: { visibility?: "private" | "gallery" | "featured"; is_favorite?: boolean; consent?: boolean }
): Promise<{ photo: AlbumPhoto }> {
  return trailFetch<{ photo: AlbumPhoto }>(`/api/v1/trail/photo/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function deleteTrailPhoto(id: string): Promise<{ deleted: boolean }> {
  return trailFetch<{ deleted: boolean }>(`/api/v1/trail/photo/${id}`, { method: "DELETE" });
}

export interface GalleryPhoto {
  id: string;
  url: string;
  display_name: string;
  level: number | null;
  visibility: string;
  created_at: string | null;
}

export async function getGallery(): Promise<{ configured: boolean; gallery_enabled: boolean; photos: GalleryPhoto[] }> {
  return trailFetch<{ configured: boolean; gallery_enabled: boolean; photos: GalleryPhoto[] }>("/api/v1/gallery/hidden-trail");
}

export interface LiveLeaderboardRow {
  rank: number;
  display_name: string;
  score: number;
}

export interface LiveRecentEvent {
  display_name: string;
  level: number | null;
  points: number;
  occurred_at: string;
}

export interface LiveLeaderboard {
  configured: boolean;
  status: string;
  live_display_enabled: boolean;
  entries: LiveLeaderboardRow[];
  active: number;
  completed: number;
  total: number;
  recent: LiveRecentEvent[];
}

export async function getLiveLeaderboardTyped(): Promise<LiveLeaderboard> {
  return trailFetch<LiveLeaderboard>("/api/v1/leaderboard/live");
}

export interface AdminParticipant {
  game_id: string;
  user_id: string;
  current_level: number;
  total_points: number;
  status: string;
  started_at: string | null;
  last_scan_at: string | null;
  completed_at: string | null;
  profiles: {
    full_name: string | null;
    email: string | null;
  } | null;
}

export async function adminGetParticipants(
  page = 1,
  pageSize = 100
): Promise<{
  configured: boolean;
  participants: AdminParticipant[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}> {
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  return trailFetch(`/api/v1/admin/hidden-trail/participants?${query.toString()}`);
}

export interface AdminPhoto {
  id: string;
  level_number: number | null;
  title: string | null;
  display_name: string;
  email: string | null;
  capture_stage: string;
  visibility: string;
  moderation_status: string;
  is_favorite: boolean;
  created_at: string | null;
  url: string | null;
}

export async function adminGetPhotos(): Promise<{ configured: boolean; photos: AdminPhoto[] }> {
  return trailFetch<{ configured: boolean; photos: AdminPhoto[] }>("/api/v1/admin/hidden-trail/photos");
}

export async function adminModeratePhoto(id: string, action: "approve" | "hide" | "feature"): Promise<{ ok: boolean }> {
  return trailFetch<{ ok: boolean }>(`/api/v1/admin/hidden-trail/photos/${id}/${action}`, { method: "POST" });
}

export async function adminDeletePhoto(id: string): Promise<{ ok: boolean }> {
  return trailFetch<{ ok: boolean }>(`/api/v1/admin/hidden-trail/photos/${id}`, { method: "DELETE" });
}

export interface SimulationResult {
  simulation: boolean;
  label: string;
  scores: Array<{ position: number; points: number }>;
  concurrency: { requests: number; allocated: Array<{ request: number; allocated_position: number; points: number }>; unique: boolean };
  wrong_answer: { result: string; points: number; position: null; progression: string };
  wrong_trail: { result: string; points: number; position: null; progression: string; disclosure: string };
  duplicate: { submissions: number; completions: number; score_grants: number; positions: number };
  engagement: { streak_current: number; streak_best: number; achievements: Array<{ code: string; eligible: boolean }> };
  scoring_note: string;
}

export async function getSimulation(count = 20): Promise<SimulationResult> {
  return trailFetch<SimulationResult>(`/api/v1/admin/hidden-trail/simulation?count=${count}`);
}