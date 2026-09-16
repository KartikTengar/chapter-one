"use client";

import { motion } from "framer-motion";
import { Clock } from "lucide-react";

interface ActivityItem {
  id: string;
  event_id: string;
  created_at: string;
  event_title?: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
}

function formatRelativeTime(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);

  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <section className="mb-8">
        <h2 className="text-xl font-black text-[var(--foreground)] uppercase tracking-tight mb-4">
          RECENT ACTIVITY
        </h2>
        <div className="bg-[var(--surface)] border border-white/[0.06] rounded-2xl p-8 text-center">
          <Clock className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">
            YOUR JOURNEY BEGINS HERE
          </h3>
          <p className="text-zinc-500 text-sm">
            Register for events and your activity will appear here.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <h2 className="text-xl font-black text-[var(--foreground)] uppercase tracking-tight mb-4">
        RECENT ACTIVITY
      </h2>
      <div className="flex flex-col gap-3">
        {activities.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className="flex items-center justify-between bg-[var(--surface)] border border-white/[0.06] rounded-xl px-5 py-4 hover:border-[var(--accent)]/20 transition-colors"
          >
            <div>
              <p className="text-[var(--foreground)] font-medium text-sm">
                {item.event_title ?? `Event #${item.event_id.slice(0, 8)}`}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {formatRelativeTime(item.created_at)}
              </p>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
              Registered
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}