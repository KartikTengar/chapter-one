"use client";

import { AnimatePresence, motion } from "framer-motion";

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="transition-container"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}