import { HiddenTrailAdminShell } from "@/components/admin/hidden-trail/HiddenTrailAdminShell";
import { GameOverview } from "@/components/admin/hidden-trail/GameOverview";
import { getAdminUser } from "@/lib/hidden-trail/admin";
import { redirect } from "next/navigation";

export default async function AdminHiddenTrailPage() {
  const adminUser = await getAdminUser();

  if (!adminUser) {
    redirect("/login?redirect=/admin/hidden-trail");
  }

  return (
    <HiddenTrailAdminShell adminUser={adminUser}>
      <GameOverview />
    </HiddenTrailAdminShell>
  );
}