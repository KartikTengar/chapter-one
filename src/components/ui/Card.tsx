"use client";

import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export function Card({ className, children, ...rest }: CardProps) {
  return (
    <div className={`card${className ? ` ${className}` : ""}`} {...rest}>
      {children}
      <style jsx>{`
        .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-card);
          padding: var(--space-5);
          box-shadow: var(--shadow-subtle);
        }
      `}</style>
    </div>
  );
}

export default Card;
