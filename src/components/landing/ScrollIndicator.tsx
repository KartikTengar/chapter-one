import { motion, useScroll } from "framer-motion";

export function ScrollIndicator() {
  const controls = useScroll();

  return (
    <motion.div
      className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
      initial="start"
      animate={controls}
    >
      <motion.div
        className="relative w-10 h-10 flex flex-col items-center"
        animate={{
          y: [0, -20, 0],
          transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          },
        }}
      >
        <div className="absolute top-0 w-full h-0.5 bg-gradient-to-t from-[var(--accent)] to-transparent"></div>
        <div className="w-4 h-4 rounded-full bg-[var(--accent)] shadow-lg"></div>
      </motion.div>

      <motion.span
        className="text-xs text-zinc-400 uppercase tracking-wider"
        animate={{ opacity: [1, 0], transition: { duration: 2, delay: 1.5 } }}
      >
        SCROLL TO EXPLORE
      </motion.span>
    </motion.div>
  );
}