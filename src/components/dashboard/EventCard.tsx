"use client";

import { motion } from "framer-motion";
import { Calendar, MapPin, Clock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Event {
  id: string;
  title: string;
  event_date: string;
  location: string;
  category: string;
  image_url: string | null;
}

interface EventCardProps {
  event: Event;
  registered?: boolean;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function EventCard({ event, registered }: EventCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.3 }}
    >
      <Link
        href={`/events/${event.id}`}
        className="block bg-[var(--surface)] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-[var(--accent)]/20 transition-colors group"
      >
        {event.image_url && (
          <div className="relative h-40 overflow-hidden">
            <Image
              src={event.image_url}
              alt={event.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] to-transparent" />
          </div>
        )}
        <div className="p-5">
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
          <h3 className="text-lg font-bold text-[var(--foreground)] mb-3 group-hover:text-[var(--accent)] transition-colors">
            {event.title}
          </h3>
          <div className="flex items-center gap-3 text-sm text-zinc-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(event.event_date)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(event.event_date)}
            </span>
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