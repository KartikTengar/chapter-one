"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { registerForEventApi, cancelEventRegistrationApi } from "@/lib/api/events";

interface RegistrationButtonProps {
  eventId: string;
  userId: string;
  registered: boolean;
  capacity: { registered: number; max: number | null };
  isPast: boolean;
}

export function RegistrationButton({
  eventId,
  registered,
  capacity,
  isPast,
}: RegistrationButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isFull = capacity.max !== null && capacity.registered >= capacity.max;

  const handleRegister = async () => {
    setLoading(true);
    try {
      const res = await registerForEventApi(eventId);
      if (!res.ok) throw new Error(res.error);
      router.refresh();
    } catch {
      // Error handled by page
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      const res = await cancelEventRegistrationApi(eventId);
      if (!res.ok) throw new Error(res.error);
      router.refresh();
    } catch {
      // Error handled by page
    } finally {
      setLoading(false);
    }
  };

  if (isPast) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        Registration Closed
      </span>
    );
  }

  if (isFull && !registered) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-red-400">
        <X className="h-3 w-3" />
        Full
      </span>
    );
  }

  if (registered) {
    return (
      <motion.button
        whileHover={{ scale: 0.97 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleCancel}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 border border-[var(--accent)] text-[var(--accent)] text-sm font-bold hover:bg-[var(--accent)] hover:text-[var(--background)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50"
      >
        {loading ? "Cancelling..." : (
          <>
            <X className="h-3 w-3" />
            Cancel
          </>
        )}
      </motion.button>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleRegister}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 bg-[var(--accent)] text-[var(--background)] text-sm font-bold hover:bg-opacity-90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50"
    >
      {loading ? "Registering..." : (
        <>
          <Check className="h-3 w-3" />
          Register
        </>
      )}
    </motion.button>
  );
}