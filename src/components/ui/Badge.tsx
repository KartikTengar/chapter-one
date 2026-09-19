"use client";

import type { HTMLAttributes, ReactNode } from "react";

export type BadgeVariant = "default" | "accent" | "success" | "warning" | "error";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children?: ReactNode;
}

export function Badge({
  variant = "default",
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={`badge badge-${variant}${className ? ` ${className}` : ""}`}
      {...rest}
    >
      {children}
      <style jsx>{`
        .badge {
          display: inline-flex;
          align-items: center;
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-full, var(--radius-btn));
          background: var(--surface-2);
          color: var(--muted);
          font-size: var(--text-meta);
          font-weight: 600;
          line-height: 1.4;
          letter-spacing: 0.04em;
        }
        .badge-accent {
          background: var(--accent-dim);
          color: var(--accent);
        }
        .badge-success {
          background: var(--transparent);
          color: var(--success);
          border: 1px solid var(--success);
        }
        .badge-warning {
          background: var(--transparent);
          color: var(--warning);
          border: 1px solid var(--warning);
        }
        .badge-error {
          background: var(--transparent);
          color: var(--error);
          border: 1px solid var(--error);
        }
      `}</style>
    </span>
  );
}

export default Badge;
