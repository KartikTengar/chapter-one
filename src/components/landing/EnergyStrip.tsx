export function EnergyStrip() {
  return (
    <section
      className="py-10 border-t border-white/[0.02] bg-[var(--background)]"
      aria-label="Energy indicators"
    >
      <div className="max-container">
        <div className="flex items-center justify-center gap-6 flex-wrap">
          {["MUSIC", "GAMES", "PEOPLE", "MEMORIES"].map((label, i) => (
            <span
              key={label}
              className="relative text-xs font-medium uppercase tracking-wider text-zinc-400"
            >
              {label}
              {i < 3 && (
                <span className="ml-6 text-zinc-400/20 select-none">
                  ✦
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}