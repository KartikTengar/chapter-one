import { NextResponse } from "next/server";
import { getGame, updateGame, deleteGame } from "@/lib/hidden-trail/games-admin";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const game = await getGame(id);
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }
    return NextResponse.json({ data: game });
  } catch (error) {
    console.error("Failed to get game:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get game" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const game = await updateGame(id, body);
    return NextResponse.json({ data: game });
  } catch (error) {
    console.error("Failed to update game:", error);
    const message = error instanceof Error ? error.message : "Failed to update game";
    const status = message.includes("Forbidden") ? 403 : message.includes("Failed") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const result = await deleteGame(id);
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Failed to delete game:", error);
    const message = error instanceof Error ? error.message : "Failed to delete game";
    const status = message.includes("Forbidden") ? 403 : message.includes("ACTIVE_GAME") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
