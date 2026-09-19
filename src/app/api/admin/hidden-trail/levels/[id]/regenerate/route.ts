import { NextResponse } from "next/server";
import { regenerateQrToken } from "@/lib/hidden-trail/admin";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await regenerateQrToken(undefined, id);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Failed to regenerate QR token:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to regenerate QR token" },
      { status: 500 }
    );
  }
}