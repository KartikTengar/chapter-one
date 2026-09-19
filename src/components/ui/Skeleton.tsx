"use client";

import type { CSSProperties, HTMLAttributes } from "react";

export type SkeletonShape = "text" | "rect" | "circle";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  shape?: SkeletonShape;
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  children?: never;
}

export function Skeleton({
  shape = "rect",
  width,
  height,
  className,
  style,
  ...rest
}: SkeletonProps) {
  return (
    <div
      {...rest}
      className={`ui-skeleton ui-skeleton-${shape}${className ? ` ${className}` : ""}`}
      style={{ width, height, ...style }}
      aria-hidden="true"
      tabIndex={-1}
      inert
    >
      <style jsx>{`
        .ui-skeleton {
          width: 100%;
          height: var(--space-7);
          border-radius: var(--radius-card);
          background: linear-gradient(90deg, var(--surface) 25%, var(--surface-2) 50%, var(--surface) 75%);
          background-size: 200% 100%;
          animation: ui-skeleton-loading calc(var(--dur-slow) * 3) var(--ease) infinite;
          pointer-events: none;
        }
        .ui-skeleton-text {
          height: var(--text-body);
          border-radius: var(--radius-btn);
        }
        .ui-skeleton-circle {
          width: var(--space-7);
          aspect-ratio: 1;
          height: auto;
          border-radius: var(--radius-full, var(--radius-surface));
        }
        @keyframes ui-skeleton-loading {
          from { background-position: 200% 0; }
          to { background-position: -200% 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ui-skeleton { animation: none; }
        }
      `}</style>
    </div>
  );
}

export default Skeleton;
