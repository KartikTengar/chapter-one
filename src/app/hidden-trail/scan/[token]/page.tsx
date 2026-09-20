"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  requireUser,
  validateQrToken,
  processQrAnswer,
  type ValidationResult
} from "@/lib/hidden-trail/game";
import { getTrailState } from "@/lib/api/trail";
import { ScanResult } from "@/components/hidden-trail/ScanResult";
import { AnswerChallenge } from "@/components/hidden-trail/AnswerChallenge";
import { PhotoCapture } from "@/components/hidden-trail/PhotoCapture";

export default function ScanTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const router = useRouter();
  const { token } = use(params);

  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [scanResult, setScanResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAnswerChallenge, setShowAnswerChallenge] = useState(false);
  const [completedLevelId, setCompletedLevelId] = useState<string | null>(null);
  const [photoEnabled, setPhotoEnabled] = useState<boolean | null>(null);

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
        const validation = await validateQrToken(token, currentUser.id);

        if (!mounted) return;
        setScanResult(validation);
        setLoading(false);

        // If token is valid and it's the expected level, show answer challenge
        if (
          validation &&
          validation.is_valid &&
          validation.is_expected_level &&
          !validation.is_duplicate &&
          validation.answer_riddle
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
  }, [token]);

  // Fetch trail state to check if photo feature is enabled when we reach photo moment
  useEffect(() => {
    let mounted = true;
    const checkPhotoFeature = async () => {
      if (!scanResult || !scanResult.is_valid || showAnswerChallenge || !completedLevelId) {
        return;
      }
      try {
        const state = await getTrailState();
        if (!mounted) return;
        setPhotoEnabled(state.game?.photo_feature_enabled ?? false);
      } catch {
        if (!mounted) return;
        setPhotoEnabled(false);
      }
    };
    checkPhotoFeature();
    return () => { mounted = false; };
  }, [scanResult, showAnswerChallenge, completedLevelId]);

  const handleAnswerSubmit = async (answer: string) => {
    if (!user) return;

    setLoading(true);
    try {
      const result = await processQrAnswer(token, user.id, answer);
      if (result) {
        setScanResult(result);
        setShowAnswerChallenge(false);
        setCompletedLevelId(result.level_id || null);
      }
    } catch (err) {
      // Wrong/other answer errors are surfaced inline by AnswerChallenge.
      throw err instanceof Error ? err : new Error("Failed to process answer");
    } finally {
      setLoading(false);
    }
  };

  const finish = () => {
    if (scanResult?.is_completed) {
      router.push("/hidden-trail/result");
    } else {
      router.push("/hidden-trail");
    }
  };

  // Auto-continue if photo feature is disabled
  useEffect(() => {
    if (photoEnabled === false && completedLevelId) {
      finish();
    }
  }, [photoEnabled, completedLevelId, finish, scanResult]);

  // Success + optional photo moment after a cleared marker.
  if (scanResult && scanResult.is_valid && !showAnswerChallenge && completedLevelId) {
    // If photo feature is disabled, continue automatically without showing photo moment.
    if (photoEnabled === false) {
      // Use effect would be better but this inline check works for SSR/CSR consistency
      // The component will re-render when photoEnabled changes from null to false
      return null; // Will trigger finish via effect below
    }

    // If photoEnabled is still null, show loading state
    if (photoEnabled === null) {
      return (
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
          <div className="text-[var(--accent)] text-lg font-bold animate-pulse">
            Loading photo moment…
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-container mx-auto py-10 px-4">
          <div className="text-center mb-8">
            <p className="text-2xl font-black text-[var(--foreground)] uppercase tracking-tight mb-2">
              MARKER CLEARED ✓
            </p>
            {!scanResult.is_completed && (
              <p className="text-[var(--muted)]">Next clue unlocked. Continue when ready.</p>
            )}
          </div>
          <PhotoCapture
            levelId={completedLevelId}
            captureStage="after_completion"
            onSkip={finish}
            onSaved={finish}
          />
        </div>
      </div>
    );
  }

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
          answerRiddle={scanResult.answer_riddle}
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