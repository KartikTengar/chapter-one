import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createServerClient();
  
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Failed to sign out" },
      { status: 500 }
    );
  }

  // Redirect to login page after successful logout
  return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"));
}
