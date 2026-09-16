"use client";

import { GameSettings } from "@/components/admin/hidden-trail/GameSettings";

export default function HiddenTrailSettingsPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <GameSettings />
    </div>
  );
}