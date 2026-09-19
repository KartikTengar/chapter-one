import { NextResponse } from "next/server";
import { getScanLogsAdmin, getParticipantsAdmin } from "@/lib/hidden-trail/admin";

export async function GET() {
  try {
    const [recentScans, participantsRes] = await Promise.all([
      getScanLogsAdmin(null, 20),
      getParticipantsAdmin(),
    ]);
    return NextResponse.json({
      recentScans: recentScans ?? [],
      participants: participantsRes?.participants ?? [],
      totalParticipants: participantsRes?.pagination?.total ?? 0,
    });
  } catch (error) {
    console.error("Failed to load live monitor:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load live monitor" },
      { status: 500 }
    );
  }
}