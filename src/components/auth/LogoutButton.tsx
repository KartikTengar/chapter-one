"use client";

import { useId, useSyncExternalStore } from "react";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getAuthErrorMessage } from "@/lib/supabase/auth";

type LogoutState = { pending: boolean; error: string };

const initialState: LogoutState = { pending: false, error: "" };
let state = initialState;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function getSnapshot() {
  return state;
}

function getServerSnapshot() {
  return initialState;
}

function updateState(next: LogoutState) {
  state = next;
  listeners.forEach((listener) => listener());
}

async function logout() {
  if (state.pending) return;
  updateState({ pending: true, error: "" });
  let serverCleared = false;
  let browserCleared = false;
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      redirect: "error",
    });
    if (!response.ok) throw { status: response.status };
    const result: unknown = await response.json();
    if (!result || typeof result !== "object" || !("ok" in result) || result.ok !== true) {
      throw new Error("Logout was not confirmed");
    }
    serverCleared = true;
    const { error } = await createClient().auth.signOut({ scope: "local" });
    if (error) throw error;
    browserCleared = true;
    window.location.replace("/login?status=logged-out");
  } catch (error: unknown) {
    const message = browserCleared
      ? "Sign-out completed, but the login page could not be opened. Retry to continue."
      : serverCleared
        ? `Server sign-out succeeded, but browser session cleanup did not finish. ${getAuthErrorMessage(error)} Retry log out.`
        : `Sign-out could not be confirmed. ${getAuthErrorMessage(error)} Retry log out.`;
    updateState({ pending: false, error: message });
  }
}

export function LogoutButton({ variant = "sidebar" }: { variant?: "sidebar" | "topbar" }) {
  const { pending, error } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const errorId = useId();

  return (
    <div className="auth-logout" data-variant={variant}>
      <button
        type="button"
        onClick={() => { void logout(); }}
        disabled={pending}
        aria-busy={pending}
        aria-describedby={error ? errorId : undefined}
      >
        <LogOut size={16} aria-hidden="true" />
        <span>{pending ? "Logging out…" : error ? "Retry log out" : "Log out"}</span>
      </button>
      {error && <p id={errorId} role="alert">{error}</p>}
      <style>{`
        .auth-logout { min-width: 0; }
        .auth-logout > button {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          min-height: 44px;
          padding: var(--space-2) var(--space-3);
          border: 1px solid var(--transparent);
          border-radius: var(--radius-card);
          background: var(--transparent);
          color: var(--error);
          font-family: var(--font-ui);
          font-size: var(--text-label);
          font-weight: 500;
          line-height: 1.5;
          text-align: start;
          cursor: pointer;
          transition: background var(--dur-fast) var(--ease);
        }
        .auth-logout[data-variant="sidebar"] > button { width: 100%; }
        .auth-logout[data-variant="topbar"] > button {
          gap: var(--space-2);
          padding-inline: var(--space-4);
          border-color: var(--border);
          border-radius: var(--radius-full);
          color: var(--text);
        }
        .auth-logout > button:hover:not(:disabled) { background: var(--surface-2); }
        .auth-logout > button:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
        .auth-logout > button:disabled { cursor: wait; opacity: 0.65; }
        .auth-logout > button > svg { flex-shrink: 0; }
        .auth-logout > p {
          max-width: 40ch;
          margin: var(--space-2) 0 0;
          color: var(--error);
          font-size: var(--text-meta);
          line-height: 1.5;
          overflow-wrap: anywhere;
        }
        @media (prefers-reduced-motion: reduce) {
          .auth-logout > button { transition: none; }
        }
      `}</style>
    </div>
  );
}
