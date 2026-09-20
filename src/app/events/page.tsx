import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Suspense } from "react";
import { getEventsList } from "@/lib/api/events";
import { getRegisteredEventIds } from "@/lib/supabase/dashboard";
import { requireUser } from "@/lib/supabase/server";
import { EventsContent, EventsLoading } from "@/components/events/EventsContent";

export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  const [allEvents, user] = await Promise.all([
    getEventsList(),
    requireUser(),
  ]);
  const allCategories = Array.from(new Set(allEvents.map(e => e.category))).sort();
  const registeredIds = new Set(user ? await getRegisteredEventIds(user.id) : []);

return (
    <>
      <Navbar />
      <main className="student-page pt-8">
        <Suspense fallback={<EventsLoading />}>
          <EventsContent
            events={allEvents}
            categories={allCategories}
            registeredIds={registeredIds}
          />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}