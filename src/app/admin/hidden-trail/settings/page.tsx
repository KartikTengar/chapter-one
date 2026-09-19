"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HiddenTrailAdminShell } from "@/components/admin/hidden-trail/HiddenTrailAdminShell";
import { getClientAdminUser } from "@/lib/hidden-trail/admin-client";
import { GameSettings } from "@/components/admin/hidden-trail/GameSettings";

export default function HiddenTrailSettingsPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<{ id: string; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getClientAdminUser().then(u => {
      if (!u) router.replace("/login");
      else setAdminUser(u);
      setLoading(false);
    });
  }, [router]);

  if (loading || !adminUser) return null;

  return (
    <HiddenTrailAdminShell adminUser={adminUser}>
      <div className="chapter-admin-content">
        <GameSettings />
      </div>
    </HiddenTrailAdminShell>
  );
}