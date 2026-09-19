import { NextResponse } from "next/server";
import { getGameLevelsAdmin } from "@/lib/hidden-trail/admin";

export async function GET() {
  try {
    // Handle missing game as empty state, not server error
    let levels = [];
    try {
      levels = await getGameLevelsAdmin();
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
      // levels stays empty for empty state
    }

    return NextResponse.json({ levels: levels ?? [] });
  } catch (error) {
    console.error("Failed to load levels:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load levels" },
      { status: 500 }
    );
  }
}