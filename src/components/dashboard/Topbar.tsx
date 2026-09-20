"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, User } from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";

export function MobileNav() {
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        setUserName(profile?.full_name ?? user.email ?? "Student");
      }
    });
  }, []);

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-[var(--background)]/90 backdrop-blur-xl border-b border-white/[0.06] safe-top">
      <div className="flex items-center justify-between h-16 pl-16 pr-4 sm:px-5">
        <span className="text-lg font-black tracking-wider text-[var(--foreground)] uppercase">
          CHAPTER ONE
        </span>
        <div className="flex items-center gap-3">
          <button aria-label="Notifications" className="relative rounded-full p-2 min-w-11 min-h-11 flex items-center justify-center text-zinc-400 hover:text-[var(--accent)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
            <Bell className="h-5 w-5" />
          </button>
          <a
            href="/profile"
            className="flex items-center gap-2 rounded-full px-3 py-1.5 bg-[var(--surface)] border border-white/[0.06] hover:border-[var(--accent)]/30 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-[var(--accent-dim)] flex items-center justify-center">
              <User className="h-3.5 w-3.5 text-[var(--accent)]" />
            </div>
            <span className="text-sm font-medium text-[var(--foreground)] hidden sm:inline">
              {userName.split(" ")[0]}
            </span>
          </a>
        </div>
      </div>
    </header>
  );
}

export function Topbar() {
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        setUserName(profile?.full_name ?? user.email ?? "Student");
      }
    });
  }, []);

  return (
    <header className="hidden lg:flex items-center justify-between h-16 px-6 border-b border-white/[0.06] bg-[var(--surface)]/50 backdrop-blur-xl sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <LogoutButton variant="topbar" />
      </div>
      <div className="flex items-center gap-3">
        <button className="relative rounded-full p-2 text-zinc-400 hover:text-[var(--accent)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
          <Bell className="h-5 w-5" />
        </button>
        <a
          href="/profile"
          className="flex items-center gap-2 rounded-full px-3 py-1.5 bg-[var(--surface)] border border-white/[0.06] hover:border-[var(--accent)]/30 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-[var(--accent-dim)] flex items-center justify-center">
            <User className="h-4 w-4 text-[var(--accent)]" />
          </div>
          <span className="text-sm font-medium text-[var(--foreground)]">
            {userName.split(" ")[0]}
          </span>
        </a>
      </div>
    </header>
  );
}
