import { NextResponse } from "next/server";
import { getScanLogsAdmin, getParticipantsAdmin } from "@/lib/hidden-trail/admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branch = searchParams.get("branch") || undefined;

    const [recentScans, participantsRes] = await Promise.all([
      getScanLogsAdmin(null, 20, branch),
      getParticipantsAdmin(null, { branch }),
    ]);

    return NextResponse.json({
      recentScans: recentScans ?? [],
      participants: participantsRes?.participants ?? [],
      totalParticipants: participantsRes?.pagination?.total ?? 0,
      branch: branch ?? null,
    });
  } catch (error) {
    console.error("Failed to load live monitor:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load live monitor" },
      { status: 500 }
    );
  }
}
