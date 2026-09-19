import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getGameConfigAdmin } from "@/lib/hidden-trail/admin";
import { HIDDEN_TRAIL_SLUG } from "@/lib/hidden-trail/config";

export async function POST() {
  try {
    // Handle missing game as empty state, not server error
    let existing = null;
    try {
      existing = await getGameConfigAdmin();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const isNotFound = 
        message.includes("No rows found") ||
        message.includes("Row not found") ||
        message.includes("PGRST116") ||
        message.includes("Hidden Trail game is not configured");
      if (!isNotFound) {
        throw err;
      }
      // existing stays null for empty state
    }
    
    if (existing) {
      return NextResponse.json({ config: existing, message: "Configuration already exists" });
    }

    const supabase = await createServerClient();
    
    // Use the SQL function that creates game + 10 levels with tokens
    const { data: gameId, error } = await supabase.rpc("create_hidden_trail_game", {
      p_name: "Hidden Trail",
      p_slug: HIDDEN_TRAIL_SLUG,
      p_description: "Chapter One Hidden Trail Game",
      p_level_count: 10,
      p_starting_score: 100,
      p_score_floor: 30,
      p_score_start_level: 2,
      p_leaderboard_name_mode: "FIRST_NAME",
      p_leaderboard_public: true,
      p_admin_user_id: null, // Will be set from session if available
    });
    
    if (error) {
      throw new Error(error.message ?? "Failed to create game");
    }

    // Fetch the created game
    const { data: config } = await supabase
      .from("qr_games")
      .select("*")
      .eq("id", gameId)
      .maybeSingle();

    return NextResponse.json({ config });
  } catch (error) {
    console.error("Failed to create game config:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create game config" },
      { status: 500 }
    );
  }
}
