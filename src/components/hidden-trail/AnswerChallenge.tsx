"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export function AnswerChallenge({
  answerRiddle,
  onAnswerSubmit
}: {
  answerRiddle: string;
  onAnswerSubmit: (answer: string) => Promise<void>;
}) {
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || submitting) return;

    setSubmitting(true);
    setResult(null);

    try {
      await onAnswerSubmit(answer);
      setResult({ success: true, message: "Correct! Marker cleared." });
      setAnswer("");
      
      // Clear input after a short delay to show success message
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.value = "";
        }
      }, 1500);
} catch (err) {
       setResult({ success: false, message: err instanceof Error ? err.message : "Incorrect answer. Try again." });
     } finally {
       setSubmitting(false);
     }
  };

  return (
    <div className="space-y-6">
      {/* Answer Riddle Display */}
      <div className="text-center">
        <h2 className="text-3xl font-black text-[var(--foreground)] uppercase tracking-tight mb-4">
          SOLVE THE PREVIOUS CLUE
        </h2>
        <div className="bg-[var(--surface)]/30 border border-white/[0.06] rounded-2xl p-8">
          <p className="text-xl text-zinc-300 italic max-w-2xl mx-auto leading-relaxed">
            &ldquo;{answerRiddle}&rdquo;
          </p>
        </div>
      </div>

      {/* Answer Input */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="Enter your answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className={`block w-full rounded-xl border border-white/[0.06] bg-[var(--surface)]/20 px-6 py-4 text-lg font-medium text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]/30 transition-colors ${submitting ? "opacity-70" : ""}`}
            disabled={submitting}
            aria-label="Answer input"
            required
          />
          {submitting && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-5 w-5 text-[var(--accent)] animate-spin" aria-label="Submitting answer" />
            </div>
          )}
        </div>
        
        <button
          type="submit"
          disabled={submitting || !answer.trim()}
          className={`w-full rounded-xl px-6 py-4 font-bold text-[var(--background)] bg-[var(--accent)] hover:bg-opacity-90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {submitting ? "SUBMITTING..." : "SUBMIT ANSWER"}
        </button>
      </form>

      {/* Result Message */}
      {result && (
        <div className={`flex items-center justify-center gap-3 p-4 rounded-xl ${
          result.success
            ? "bg-[var(--accent)]/20 border-[var(--accent)]/30"
            : "bg-[var(--surface)]/30 border-[var(--accent)]/20"
        }`}>
          {result.success ? (
            <CheckCircle className="h-5 w-5 text-[var(--accent)]" aria-label="Correct answer" />
          ) : (
            <XCircle className="h-5 w-5 text-[var(--accent)]" aria-label="Incorrect answer" />
          )}
<p className="text-sm font-medium text-center text-[var(--accent)]">
            {result.message}
          </p>
        </div>
      )}
    </div>
  );
}