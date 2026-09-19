import { NextResponse } from "next/server";
import { getAdminAuditLogs } from "@/lib/hidden-trail/admin";

export async function GET() {
  try {
    const logs = await getAdminAuditLogs();
    return NextResponse.json({ logs: logs ?? [] });
  } catch (error) {
    console.error("Failed to load audit logs:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load audit logs" },
      { status: 500 }
    );
  }
}