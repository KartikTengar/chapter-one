import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { HIDDEN_TRAIL_SLUG } from "@/lib/hidden-trail/config";

async function resolveGameId(supabase: Awaited<ReturnType<typeof createServerClient>>): Promise<string | null> {
  // First, try to find the current game for hidden-trail type
  const { data: currentGame } = await supabase
    .from("qr_games")
    .select("id")
    .eq("game_type", "hidden-trail")
    .eq("is_current", true)
    .maybeSingle();
  
  if (currentGame?.id) return currentGame.id;
  
  // Fallback to slug lookup
  const { data } = await supabase
    .from("qr_games")
    .select("id")
    .eq("slug", HIDDEN_TRAIL_SLUG)
    .maybeSingle();
  
  return data?.id ?? null;
}

export async function POST() {
  try {
    const supabase = await createServerClient();
    
    const gameId = await resolveGameId(supabase);
    if (!gameId) {
      return NextResponse.json(
        { error: "Hidden Trail game is not configured" },
        { status: 404 }
      );
    }

    const { data, error } = await supabase.rpc("readiness_hidden_trail_game", { p_game_id: gameId });
    if (error) {
      return NextResponse.json(
        { error: "Readiness check failed" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to run readiness check:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to run readiness check" },
      { status: 500 }
    );
  }
}