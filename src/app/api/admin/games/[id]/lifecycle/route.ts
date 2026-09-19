import { NextResponse } from "next/server";
import { duplicateGame, runReadiness, setReady, startGame, pauseGame, resumeGame, endGame, archiveGame, setCurrent } from "@/lib/hidden-trail/games-admin";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "duplicate": {
        const game = await duplicateGame(id, body.name, body.slug);
        return NextResponse.json({ data: game }, { status: 201 });
      }
      case "readiness": {
        const result = await runReadiness(id);
        return NextResponse.json({ data: result });
      }
      case "ready": {
        const game = await setReady(id);
        return NextResponse.json({ data: game });
      }
      case "start": {
        const game = await startGame(id);
        return NextResponse.json({ data: game });
      }
      case "pause": {
        const game = await pauseGame(id);
        return NextResponse.json({ data: game });
      }
      case "resume": {
        const game = await resumeGame(id);
        return NextResponse.json({ data: game });
      }
      case "end": {
        const game = await endGame(id);
        return NextResponse.json({ data: game });
      }
      case "archive": {
        const game = await archiveGame(id);
        return NextResponse.json({ data: game });
      }
      case "setCurrent": {
        const game = await setCurrent(id);
        return NextResponse.json({ data: game });
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Failed to perform game action:", error);
    const message = error instanceof Error ? error.message : "Failed to perform action";
    const status = message.includes("Forbidden") ? 403 : message.includes("Cannot") ? 409 : message.includes("ACTIVE_GAME") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
