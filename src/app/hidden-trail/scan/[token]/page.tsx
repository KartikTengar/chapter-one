"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  requireUser,
  validateQrToken,
  processQrAnswer,
  type ValidationResult
} from "@/lib/hidden-trail/game";
import { ScanResult } from "@/components/hidden-trail/ScanResult";
import { AnswerChallenge } from "@/components/hidden-trail/AnswerChallenge";

export default function ScanTokenPage({
  params,
}: {
  params: { token: string };
}) {
  const router = useRouter();

  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [scanResult, setScanResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAnswerChallenge, setShowAnswerChallenge] = useState(false);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const currentUser = await requireUser();
        if (!currentUser) {
          if (mounted) {
            router.replace("/login");
          }
          return;
        }
        
        if (!mounted) return;
        setUser({ id: currentUser.id, email: currentUser.email ?? "" });

        // Initial scan verification
        setLoading(true);
        const validation = await validateQrToken(params.token, currentUser.id);

        if (!mounted) return;
        setScanResult(validation);
        setLoading(false);

        // If token is valid and it's the expected level, show answer challenge
        if (
          validation &&
          validation.is_valid &&
          validation.is_expected_level &&
          !validation.is_duplicate &&
          validation.answer_riddle_hash
        ) {
          setShowAnswerChallenge(true);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to verify marker");
          setLoading(false);
        }
      }
    };

    init();
    return () => {
      mounted = false;
    };
  }, [params.token, router]);

  const handleAnswerSubmit = async (answer: string) => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      const result = await processQrAnswer(params.token, user.id, answer);
      if (result) {
        setScanResult(result);
        setShowAnswerChallenge(false);
        
        // If completed, redirect to completion page or show completion state
        if (result.is_completed) {
          // Small delay before redirecting
          setTimeout(() => {
            router.push("/hidden-trail");
          }, 2000);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process answer");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-[var(--accent)] text-lg font-bold animate-pulse">
          Verifying marker...
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="bg-[var(--surface)] border border-white/[0.06] rounded-2xl p-12 text-center">
          <h2 className="text-2xl font-black text-[var(--foreground)] uppercase tracking-tight mb-3">
            Marker Not Found
          </h2>
          <p className="text-zinc-500 mb-6">
            {error || "We couldn't verify this marker."}
          </p>
          <div className="mt-6">
            <a
              href="/hidden-trail"
              className="rounded-full px-6 py-3 bg-[var(--accent)] text-[var(--background)] font-bold text-sm hover:bg-opacity-90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              RETURN TO TRAIL
            </a>
          </div>
        </div>
      </div>
    );
  }

  // If we're showing the answer challenge
  if (showAnswerChallenge && scanResult) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <ScanResult 
          result={scanResult} 
          showAnswerChallenge={true}
        />
        <AnswerChallenge 
          onAnswerSubmit={handleAnswerSubmit}
        />
      </div>
    );
  }

  // Show scan result (waiting, wrong trail, already cleared, etc.)
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <ScanResult 
        result={scanResult} 
        showAnswerChallenge={false}
      />
    </div>
  );
}
