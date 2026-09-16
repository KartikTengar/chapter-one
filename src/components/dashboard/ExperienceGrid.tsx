"use client";

import { motion } from "framer-motion";
import {
  Gamepad2,
  QrCode,
  Trophy,
  Image,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const experienceTiles = [
  {
    num: "01",
    title: "GAMES",
    subtitle: "Break the ice.",
    href: "/dashboard/games",
    icon: Gamepad2,
    color: "from-[var(--accent)]/20 to-transparent",
  },
  {
    num: "02",
    title: "HIDDEN TRAIL",
    subtitle: "Find the hidden trail.",
    href: "/hidden-trail",
    icon: QrCode,
    color: "from-emerald-500/20 to-transparent",
  },
  {
    num: "03",
    title: "LEADERBOARD",
    subtitle: "See where you stand.",
    href: "/dashboard/leaderboard",
    icon: Trophy,
    color: "from-amber-500/20 to-transparent",
  },
  {
    num: "04",
    title: "GALLERY",
    subtitle: "Relive the moments.",
    href: "/gallery",
    icon: Image,
    color: "from-rose-500/20 to-transparent",
  },
];

export function ExperienceGrid() {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-black text-[var(--foreground)] uppercase tracking-tight mb-4">
        EXPERIENCES
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {experienceTiles.map((tile, i) => (
          <motion.div
            key={tile.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            whileHover={{ scale: 1.03 }}
          >
            <Link
              href={tile.href}
              className={`relative block rounded-2xl border border-white/[0.06] bg-gradient-to-br ${tile.color} bg-[var(--surface)] p-6 hover:border-[var(--accent)]/30 transition-colors group`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black text-[var(--accent)] tracking-widest">
                  {tile.num}
                </span>
                <tile.icon className="h-6 w-6 text-zinc-500 group-hover:text-[var(--accent)] transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">
                {tile.title}
              </h3>
              <p className="text-xs text-zinc-500">{tile.subtitle}</p>
              <ArrowRight className="h-4 w-4 text-[var(--accent)] mt-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}