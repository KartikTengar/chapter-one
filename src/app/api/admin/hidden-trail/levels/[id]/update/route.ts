import { NextResponse } from "next/server";
import { updateLevelAdmin } from "@/lib/hidden-trail/admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const allowedFields = [
      "title",
      "location_riddle",
      "answer_riddle",
      "correct_answer",
      "case_sensitive",
      "admin_location",
      "is_active",
    ];
    
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }
    
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided" },
        { status: 400 }
      );
    }
    
    const level = await updateLevelAdmin(null, id, updates);
    return NextResponse.json({ level });
  } catch (error) {
    console.error("Failed to update level:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update level" },
      { status: 500 }
    );
  }
}