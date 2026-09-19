import { NextResponse } from "next/server";
import { listGames, createGame } from "@/lib/hidden-trail/games-admin";

export async function GET() {
  try {
    const games = await listGames();
    return NextResponse.json({ data: games });
  } catch (error) {
    console.error("Failed to list games:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list games" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const game = await createGame({
      name: body.name,
      slug: body.slug,
      description: body.description,
      level_count: body.level_count,
      starting_score: body.starting_score,
      score_floor: body.score_floor,
      score_start_level: body.score_start_level,
      leaderboard_name_mode: body.leaderboard_name_mode,
      leaderboard_public: body.leaderboard_public,
    });
    return NextResponse.json({ data: game }, { status: 201 });
  } catch (error) {
    console.error("Failed to create game:", error);
    const message = error instanceof Error ? error.message : "Failed to create game";
    const status = message.includes("Forbidden") ? 403 : message.includes("name and slug") ? 400 : message.includes("level_count") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
