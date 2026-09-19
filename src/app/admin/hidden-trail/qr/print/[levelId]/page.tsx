import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { PrintButton } from "@/components/hidden-trail/PrintButton";
import { createServerClient } from "@/lib/supabase/server";
import { HiddenTrailQrPoster } from "@/components/hidden-trail/HiddenTrailQrPoster";
import "@/styles/_qr-poster.scss";

/**
 * Canonical event-accessible origin for QR payloads.
 *
 * Prefers the configured public app URL; otherwise falls back to the
 * request origin (host header). The QR must encode an absolute URL or
 * phone scanners cannot act on it.
 */
async function getQrOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      return new URL(process.env.NEXT_PUBLIC_APP_URL).origin;
    } catch {
      // fall through to request origin
    }
  }
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return "http://localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export default async function QrPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ levelId: string }>;
  searchParams: Promise<{ gameId?: string }>;
}) {
  const { levelId } = await params;
  const { gameId: explicitGameId } = await searchParams;

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/");

  // Resolve game: explicit gameId > canonical current game > slug fallback
  let gameRow: { id: string; name: string } | null = null;
  if (explicitGameId) {
    const { data } = await supabase.from("qr_games").select("id, name").eq("id", explicitGameId).maybeSingle();
    gameRow = data;
  }
  if (!gameRow) {
    const { data } = await supabase
      .from("qr_games")
      .select("id, name")
      .eq("is_current", true)
      .maybeSingle();
    gameRow = data;
  }
  const gameId = gameRow?.id ?? null;
  if (!gameId) redirect("/admin/hidden-trail/qr");

  const { data: level, error } = await supabase
    .from("qr_levels")
    .select("id, level_number, title, token, location_riddle")
    .eq("id", levelId)
    .eq("game_id", gameId)
    .single();

  if (error || !level || !level.token) {
    redirect("/admin/hidden-trail/qr");
  }

  const origin = await getQrOrigin();
  const qrValue = `${origin}/hidden-trail/scan/${level.token}`;

  return (
    <main className="ht-poster-page">
      <div className="ht-poster-controls">
        <h1 className="ht-poster-controls-title">
          Print QR — <span>Marker {String(level.level_number).padStart(2, "0")}</span>
        </h1>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <a href="/admin/hidden-trail/qr" className="ht-poster-btn">
            ← Back
          </a>
          <PrintButton />
        </div>
      </div>

      <HiddenTrailQrPoster
        markerNumber={level.level_number}
        levelNumber={level.level_number}
        levelTitle={level.title}
        locationClue={level.location_riddle}
        destination={gameRow?.name ?? "Hidden Trail"}
        qrValue={qrValue}
      />
    </main>
  );
}