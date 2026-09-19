import { NextResponse } from "next/server";
import { toggleLevelActive } from "@/lib/hidden-trail/admin";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await _request.json().catch(() => ({}));
    const isActive = Boolean(body.isActive);
    const data = await toggleLevelActive(undefined, id, isActive);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Failed to toggle level:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to toggle level" },
      { status: 500 }
    );
  }
}