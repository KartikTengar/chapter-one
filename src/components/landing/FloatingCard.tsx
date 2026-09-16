import { motion } from "framer-motion";

type FloatingCardProps = {
  variant: "date" | "students" | "location";
  position: "top-left" | "top-right" | "bottom-left";
};

const positionStyles: Record<FloatingCardProps["position"], string> = {
  "top-left": "top-2 left-2",
  "top-right": "top-2 right-2",
  "bottom-left": "bottom-2 left-2",
};

export function FloatingCard({
  variant = "date",
  position = "top-left",
}: FloatingCardProps) {
  const posClass = positionStyles[position];

  return (
    <motion.div
      className={`${posClass} w-full event-card p-4 transition-colors dur-800 ease-out select-none lg:absolute lg:w-44`}
      style={{ willChange: "transform" }}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
    >
      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--accent)] opacity-70" />

      <div className="relative">
        {variant === "date" && (
          <>
            <p className="text-[10px] text-[var(--muted)] uppercase tracking-[0.2em] font-medium">
              Event Dates
            </p>
            <p className="mt-1.5 text-base font-bold text-[var(--foreground)] leading-tight">
              OCT 27–NOV 3
            </p>
          </>
        )}

        {variant === "students" && (
          <>
            <p className="text-[10px] text-[var(--muted)] uppercase tracking-[0.2em] font-medium">
              Freshers
            </p>
            <p className="mt-1.5 text-base font-bold text-[var(--foreground)] leading-tight">
              1200+ STUDENTS
            </p>
          </>
        )}

        {variant === "location" && (
          <>
            <p className="text-[10px] text-[var(--muted)] uppercase tracking-[0.2em] font-medium">
              Campus
            </p>
            <p className="mt-1.5 text-sm font-bold text-[var(--foreground)] leading-tight">
              Central Block 4
            </p>
          </>
        )}
      </div>
    </motion.div>
  );
}