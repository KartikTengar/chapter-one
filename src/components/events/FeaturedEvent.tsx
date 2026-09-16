"use client";

import Image from "next/image";
import { Calendar, MapPin, Clock } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Event } from "@/lib/supabase/dashboard";

interface FeaturedEventProps {
  event: Event;
  registered?: boolean;
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

export function FeaturedEvent({ event, registered }: FeaturedEventProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Link
        href={`/events/${event.id}`}
        className="block relative rounded-2xl overflow-hidden bg-[var(--surface)] border border-white/[0.06] hover:border-[var(--accent)]/20 transition-colors group"
      >
        <div className="relative aspect-[21/9] overflow-hidden bg-[var(--background)]">
          {event.image_url ? (
            <Image
              src={event.image_url}
              alt={event.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[var(--accent-dim)] to-transparent flex items-center justify-center">
              <Calendar className="h-12 w-12 text-[var(--accent)] opacity-30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/80 to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
              {event.category}
            </span>
            {registered && (
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Registered
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[var(--foreground)] uppercase tracking-tight mb-3 group-hover:text-[var(--accent)] transition-colors">
            {event.title}
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(event.event_date)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatTime(event.event_date)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {event.location}
            </span>
          </div>
          <span className="mt-4 inline-flex items-center gap-2 text-[var(--accent)] text-sm font-bold group-hover:gap-3 transition-all">
            VIEW EVENT →
          </span>
        </div>
      </Link>
    </motion.div>
  );
}