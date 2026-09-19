"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  children?: ReactNode;
}

export function Button({
  variant = "primary",
  loading = false,
  disabled,
  type = "button",
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      className={`btn btn-${variant}${className ? ` ${className}` : ""}`}
      disabled={disabled || loading}
      aria-busy={loading || rest["aria-busy"]}
    >
      {children}
      <style jsx>{`
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          padding: var(--space-3) var(--space-5);
          border-radius: var(--radius-btn);
          border: 1px solid var(--transparent);
          font-family: var(--font-ui);
          font-size: var(--text-body);
          font-weight: 600;
          line-height: 1.2;
          cursor: pointer;
          transition:
            background var(--dur-fast) var(--ease),
            border-color var(--dur-fast) var(--ease),
            color var(--dur-fast) var(--ease),
            opacity var(--dur-fast) var(--ease);
        }
        .btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .btn-primary {
          background: var(--accent);
          color: var(--bg);
        }
        .btn-primary:hover:not(:disabled) {
          background: var(--accent-dim);
          color: var(--accent);
          border-color: var(--border-accent);
        }
        .btn-secondary {
          background: var(--transparent);
          color: var(--text);
          border-color: var(--border);
        }
        .btn-secondary:hover:not(:disabled) {
          border-color: var(--border-accent);
          background: var(--accent-dim);
        }
        .btn-ghost {
          background: var(--transparent);
          color: var(--muted);
        }
        .btn-ghost:hover:not(:disabled) {
          color: var(--text);
          background: var(--accent-dim);
        }
        .btn-danger {
          background: var(--error);
          color: var(--bg);
        }
        .btn-danger:hover:not(:disabled) {
          opacity: 0.85;
        }
        .btn:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: var(--space-1);
        }
        @media (prefers-reduced-motion: reduce) {
          .btn { transition: none; }
        }
      `}</style>
    </button>
  );
}

export default Button;
