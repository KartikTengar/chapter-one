import { NextResponse } from "next/server";
import { getAdminUser, getParticipantDetailAdmin } from "@/lib/hidden-trail/admin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("gameId");

    const result = await getParticipantDetailAdmin(gameId, userId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to load participant detail:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load participant detail" },
      { status: 500 }
    );
  }
}