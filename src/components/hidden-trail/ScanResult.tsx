import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export function ScanResult({
  result,
  showAnswerChallenge = false
}: {
  result: ValidationResult | null;
  showAnswerChallenge?: boolean;
}) {
  // Determine the status based on validation result
  let status: "verifying" | "valid" | "wrong-trail" | "already-cleared" | "invalid-token" | "game-inactive" = "verifying";
  let icon = <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading" />;
  let bgColor = "bg-[var(--surface)]/20";
  let borderColor = "border-white/[0.06]";

  if (!result) {
    status = "verifying";
  } else if (!result.is_valid) {
    if (result.error_message?.includes("Invalid")) {
      status = "invalid-token";
      icon = <XCircle className="h-6 w-6 text-[var(--accent)]/50" aria-label="Invalid marker" />;
    } else if (result.error_message?.includes("Wrong trail")) {
      status = "wrong-trail";
      icon = <AlertTriangle className="h-6 w-6 text-[var(--accent)]/50" aria-label="Wrong trail" />;
    } else if (result.error_message?.includes("Already cleared")) {
      status = "already-cleared";
      icon = <CheckCircle className="h-6 w-6 text-[var(--accent)]/50" aria-label="Already cleared" />;
    } else if (result.error_message?.includes("not active")) {
      status = "game-inactive";
      icon = <AlertTriangle className="h-6 w-6 text-[var(--accent)]/50" aria-label="Game inactive" />;
    } else {
      status = "invalid-token";
      icon = <XCircle className="h-6 w-6 text-[var(--accent)]/50" aria-label="Verification failed" />;
    }
    bgColor = "bg-[var(--surface)]/30";
    borderColor = "border-[var(--accent)]/20";
  } else if (result.is_valid && !showAnswerChallenge) {
    status = "valid";
    icon = <CheckCircle className="h-6 w-6 text-[var(--accent)]" aria-label="Marker found" />;
    bgColor = "bg-[var(--accent)]/20";
    borderColor = "border-[var(--accent)]/30";
  }

  return (
    <div className="mb-8">
      <div className={`flex items-center justify-center gap-4 p-8 rounded-2xl ${bgColor} ${borderColor}`}>
        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
          bgColor === "bg-[var(--accent)]/20"
            ? "bg-[var(--accent)]/30"
            : bgColor === "bg-[var(--surface)]/30"
              ? "bg-[var(--accent)]/40"
              : "bg-[var(--surface)]/20"
        }`}>
          {icon}
        </div>
        <div className="text-center">
          {status === "verifying" && (
            <>
              <p className="text-xl font-black text-[var(--foreground)] mb-2">
                VERIFYING MARKER...
              </p>
              <p className="text-sm text-zinc-400 uppercase tracking-wider">
                Please wait...
              </p>
            </>
          )}
          {status === "valid" && (
            <>
              <p className="text-2xl font-black text-[var(--foreground)] mb-2">
                MARKER FOUND ✓
              </p>
              <p className="text-sm text-zinc-400 uppercase tracking-wider">
                VERIFIED
              </p>
            </>
          )}
          {status === "wrong-trail" && (
            <>
              <p className="text-2xl font-black text-[var(--accent)] mb-2">
                WRONG TRAIL
              </p>
              <p className="text-sm text-zinc-400 uppercase tracking-wider">
                This marker is not part of your current path
              </p>
            </>
          )}
          {status === "already-cleared" && (
            <>
              <p className="text-2xl font-black text-[var(--accent)] mb-2">
                ALREADY CLEARED
              </p>
<p className="text-sm text-zinc-400 uppercase tracking-wider">
                 You&rsquo;ve already completed this marker
               </p>
            </>
          )}
          {status === "invalid-token" && (
            <>
              <p className="text-2xl font-black text-[var(--accent)] mb-2">
                MARKER NOT VALID
              </p>
              <p className="text-sm text-zinc-400 uppercase tracking-wider">
                Please check your QR code and try again
              </p>
            </>
          )}
          {status === "game-inactive" && (
            <>
              <p className="text-2xl font-black text-[var(--accent)] mb-2">
                TEMPORARILY UNAVAILABLE
              </p>
              <p className="text-sm text-zinc-400 uppercase tracking-wider">
                This marker is currently inactive
              </p>
            </>
          )}
        </div>
      </div>
      
      {/* Show additional info for valid scans */}
      {result && result.is_valid && !showAnswerChallenge && (
        <div className="mt-6 text-center">
          <p className="text-sm text-zinc-400 uppercase tracking-wider">
            GET READY TO SOLVE THE CLUE
          </p>
        </div>
      )}
    </div>
  );
}

// Type definitions
interface ValidationResult {
  game_id: string;
  level_id: string;
  level_number: number;
  is_valid: boolean;
  is_expected_level: boolean;
  is_duplicate: boolean;
  game_status: string;
  current_level: number;
  total_points: number;
  location_riddle: string;
  answer_riddle_hash: string;
  case_sensitive: boolean;
  error_message: string | null;
}