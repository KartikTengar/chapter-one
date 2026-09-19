import { NextResponse } from "next/server";
import { getGameConfigAdmin, updateGameConfigAdmin } from "@/lib/hidden-trail/admin";

export async function GET() {
  try {
    // Handle missing game as empty state, not server error (like overview route)
    let config = null;
    try {
      config = await getGameConfigAdmin();
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
      // config stays null for empty state
    }

    return NextResponse.json({ config });
  } catch (error) {
    console.error("Failed to load game config:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load game config" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const updates = {
      ...body,
      score_start_level: Number(body.score_start_level),
      starting_score: Number(body.starting_score),
      score_floor: Number(body.score_floor),
      final_secret_enabled: Boolean(body.final_secret_enabled),
      leaderboard_public: Boolean(body.leaderboard_public),
      start_at: body.start_at || null,
      end_at: body.end_at || null,
    };

    const updatedConfig = await updateGameConfigAdmin(updates);
    return NextResponse.json({ config: updatedConfig });
  } catch (error) {
    console.error("Failed to update game config:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update game config" },
      { status: 500 }
    );
  }
}