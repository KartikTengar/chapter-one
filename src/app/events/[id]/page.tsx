import { notFound } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { RegistrationButton } from "@/components/events/RegistrationButton";
import { getEventDetail, getEventCapacity } from "@/lib/api/events";
import { checkRegistration } from "@/lib/supabase/dashboard";
import { requireUser } from "@/lib/supabase/server";
import { Calendar, MapPin, Clock, Users } from "lucide-react";

async function getEventData(eventId: string) {
  const [event, capacity] = await Promise.all([
    getEventDetail(eventId),
    getEventCapacity(eventId),
  ]);
  return { event, capacity };
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { event, capacity } = await getEventData(id);

  if (!event) {
    notFound();
  }

  const user = await requireUser();
  const isRegistered = user ? await checkRegistration(user.id, event.id) : false;
  const isPast = new Date(event.event_date) < new Date();
  const cap = capacity ?? { registered: 0, max: null };

  return (
    <>
      <Navbar />
      <main className="student-page pt-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-sm text-[var(--accent)] hover:underline mb-8"
          >
            ← Back to Events
          </Link>

          <article className="bg-[var(--surface)] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="relative aspect-[16/9] sm:aspect-[21/9] overflow-hidden bg-[var(--background)]">
              {event.image_url ? (
                <Image
                  src={event.image_url}
                  alt={event.title}
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[var(--accent-dim)] to-transparent flex items-center justify-center">
                  <Calendar className="h-16 w-16 text-[var(--accent)] opacity-30" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] via-transparent to-transparent" />
            </div>

            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                  {event.category}
                </span>
                {isPast && (
                  <span className="text-xs font-semibold uppercase tracking-wider text-red-400">
                    Past
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] uppercase tracking-tight mb-6">
                {event.title}
              </h1>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-[var(--accent)] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-zinc-400">Date</p>
                    <p className="text-[var(--foreground)] font-medium">{formatDate(event.event_date)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-[var(--accent)] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-zinc-400">Time</p>
                    <p className="text-[var(--foreground)] font-medium">{formatTime(event.event_date)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-[var(--accent)] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-zinc-400">Location</p>
                    <p className="text-[var(--foreground)] font-medium">{event.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-[var(--accent)] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-zinc-400">Capacity</p>
                   <p className="text-[var(--foreground)] font-medium">
                       {cap.max !== null
                         ? `${cap.registered} / ${cap.max}`
                         : "Unlimited"}
                     </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/[0.06] pt-6 mb-8">
                <h2 className="text-lg font-bold text-[var(--foreground)] mb-3">Description</h2>
                <p className="text-zinc-400 leading-relaxed whitespace-pre-line">
                  {event.description || "No description provided."}
                </p>
              </div>

              <div className="border-t border-white/[0.06] pt-6">
                <Suspense fallback={<div className="h-10 w-40 bg-zinc-800 rounded-full animate-pulse" />}>
                  <RegistrationButton
                    eventId={event.id}
                    userId={user?.id ?? ""}
                    registered={isRegistered}
                    capacity={cap}
                    isPast={isPast}
                  />
                </Suspense>
              </div>
            </div>
          </article>
        </div>
      </div>
    </main>
    <Footer />
    </>
  );
}