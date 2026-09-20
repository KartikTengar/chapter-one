"use client";

import Image from "next/image";
import { Calendar, MapPin, Clock } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Event } from "@/lib/supabase/dashboard";

interface EventCardProps {
  event: Event;
  registered?: boolean;
  href?: string;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function EventCard({ event, registered, href = `/events/${event.id}` }: EventCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <Link
        href={href}
        className="student-event-card block bg-[var(--surface)] border border-white/[0.06] rounded-xl overflow-hidden hover:border-[var(--accent)]/30 hover:shadow-[0_18px_50px_rgba(0,0,0,.2)] transition-all duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-[var(--background)]">
          {event.image_url ? (
            <Image
              src={event.image_url}
              alt={event.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[var(--accent-dim)] to-transparent flex items-center justify-center">
              <Calendar className="h-8 w-8 text-[var(--accent)] opacity-30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] via-transparent to-transparent" />
        </div>
        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
              {event.category}
            </span>
            {registered && (
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Registered
              </span>
            )}
          </div>
          <h3 className="text-base font-bold text-[var(--foreground)] mb-2 group-hover:text-[var(--accent)] transition-colors line-clamp-2">
            {event.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(event.event_date)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(event.event_date)}
            </span>
          </div>
          <div className="flex items-start gap-2 text-xs text-zinc-500 mt-2">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {event.location}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}