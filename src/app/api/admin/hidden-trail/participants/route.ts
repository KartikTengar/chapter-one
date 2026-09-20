import { NextResponse } from "next/server";
import { getAdminUser, getParticipantsAdmin } from "@/lib/hidden-trail/admin";

export async function GET(request: Request) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("gameId");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "25", 10);
    const search = searchParams.get("search") || "";
    const branch = searchParams.get("branch") || "";
    const status = (searchParams.get("status") || "all") as "not_started" | "active" | "completed" | "paused" | "all";
    const level = searchParams.get("level") === "all" ? "all" : parseInt(searchParams.get("level") || "0", 10);
    const sortBy = (searchParams.get("sortBy") || "total_points") as "total_points" | "current_level" | "completed_at" | "started_at";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

    const result = await getParticipantsAdmin(gameId, {
      page,
      pageSize,
      search,
      branch,
      status,
      level,
      sortBy,
      sortOrder,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to load participants:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load participants" },
      { status: 500 }
    );
  }
}