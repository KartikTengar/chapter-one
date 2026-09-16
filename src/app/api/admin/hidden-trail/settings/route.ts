import { NextResponse } from "next/server";
import { getGameConfigAdmin, updateGameConfigAdmin } from "@/lib/hidden-trail/admin";

export async function GET() {
  try {
    const gameId = "00000000-0000-0000-0000-000000000001";
    const config = await getGameConfigAdmin(gameId);
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