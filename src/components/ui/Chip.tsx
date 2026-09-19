"use client";

import type { HTMLAttributes, ReactNode } from "react";

export type ChipVariant = "default" | "accent" | "success" | "warning" | "error";

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: ChipVariant;
  onRemove?: () => void;
  removeLabel?: string;
  children?: ReactNode;
}

export function Chip({
  variant = "default",
  onRemove,
  removeLabel = "Remove",
  className,
  children,
  ...rest
}: ChipProps) {
  return (
    <span
      className={`chip chip-${variant}${className ? ` ${className}` : ""}`}
      {...rest}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          className="chip-remove"
          onClick={onRemove}
          aria-label={removeLabel}
        >
          ×
        </button>
      )}
      <style jsx>{`
        .chip {
          display: inline-flex;
          align-items: center;
          gap: var(--space-1);
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-btn);
          border: 1px solid var(--border);
          background: var(--surface-2);
          color: var(--muted);
          font-size: var(--text-meta);
          font-weight: 500;
          line-height: 1.4;
        }
        .chip-accent {
          background: var(--accent-dim);
          color: var(--accent);
          border-color: var(--border-accent);
        }
        .chip-success {
          background: var(--transparent);
          color: var(--success);
          border-color: var(--success);
        }
        .chip-warning {
          background: var(--transparent);
          color: var(--warning);
          border-color: var(--warning);
        }
        .chip-error {
          background: var(--transparent);
          color: var(--error);
          border-color: var(--error);
        }
        .chip-remove {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: var(--space-6);
          min-height: var(--space-6);
          padding: 0;
          border: none;
          background: var(--transparent);
          color: inherit;
          font-size: var(--text-body);
          line-height: 1;
          cursor: pointer;
          border-radius: var(--radius-btn);
        }
        .chip-remove:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: var(--space-1);
        }
        .chip-remove:hover {
          background: var(--border);
          color: var(--text);
        }
      `}</style>
    </span>
  );
}

export default Chip;
