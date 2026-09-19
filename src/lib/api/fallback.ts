import "server-only";
import type { EventPreview } from "./types";

export function getDevFallbackEvents(): EventPreview[] {
  if (process.env.NEXT_PUBLIC_API_URL || process.env.ENABLE_DEMO_EVENTS !== "true"
    || process.env.NODE_ENV !== "development") return [];
  const now = Date.now();
  const futureDate = (days: number, hours = 0) =>
    new Date(now + (days * 24 + hours) * 60 * 60 * 1_000).toISOString();

  const DEV_FALLBACK_EVENTS: EventPreview[] = [
    {
      id: "dev-jec-freshers-evening",
      title: "Demo: JEC Freshers’ Evening",
      category: "Cultural",
      venue: "JEC Main Auditorium",
      starts_at: futureDate(7),
      ends_at: futureDate(7, 3),
      registration_open: true,
      featured: true,
    },
    {
      id: "dev-jec-campus-trail",
      title: "Demo: Discover JEC: The Campus Trail",
      category: "Adventure",
      venue: "JEC Central Library Courtyard",
      starts_at: futureDate(10),
      ends_at: futureDate(10, 2),
      registration_open: true,
    },
    {
      id: "dev-jec-code-connect",
      title: "Demo: Code & Connect",
      category: "Technology",
      venue: "JEC Computer Science Seminar Hall",
      starts_at: futureDate(14),
      ends_at: futureDate(14, 2),
      registration_open: false,
    },
  ];

  return DEV_FALLBACK_EVENTS.map((event) => ({ ...event, is_demo: true }));
}
