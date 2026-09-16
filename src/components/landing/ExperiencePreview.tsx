"use client";

import { motion } from "framer-motion";

export function ExperiencePreview() {
  return (
    <section
      className="py-16 border-y border-white/[0.02] bg-[var(--background)]"
      aria-label="Experience preview"
    >
      <div className="max-container">
        <div className="text-center mb-10">
          <p
            className="inline-block rounded-full bg-[var(--accent)]/15 px-4 py-1 text-xs font-medium uppercase tracking-widest text-[var(--accent)] mb-3"
          >
            THERE&apos;S MORE WAITING
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[var(--foreground)] leading-none tracking-tight">
            THE FULL EXPERIENCE
          </h2>
          <p className="mt-3 text-zinc-400 text-base sm:text-lg max-w-xl mx-auto">
            Nights. Tournaments. A campus full of new faces. The journey continues.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((number) => (
            <motion.div
              key={number}
              whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
              className="
                relative w-full h-40 rounded-2xl bg-[var(--background)]/60 backdrop-blur-md border border-white/[0.03] flex flex-col items-center justify-center gap-1 transition-transform
              "
            >
              <div className="w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center text-[var(--background)] font-medium text-sm">
                {number}
              </div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">{["EVENTS", "GAMES", "PEOPLE", "MEMORIES"][number - 1]}</p>
              <p className="text-[var(--foreground)] text-sm">{["Campus nights", "Tournament play", "New friends", "Shared moments"][number - 1]}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}