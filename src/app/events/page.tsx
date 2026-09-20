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

return (\n    <>\n      <Navbar />\n      <main className="student-page pt-8">\n        <Suspense fallback={<EventsLoading />}>\n          <EventsContent\n            events={allEvents}\n            categories={allCategories}\n            registeredIds={registeredIds}\n          />\n        </Suspense>\n      </main>\n      <Footer />\n    </>\n  );
}