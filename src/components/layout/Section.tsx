import type { HTMLAttributes, ReactNode } from "react";

interface SectionProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

export function Section({ className, children, ...rest }: SectionProps) {
  return (
    <section {...rest} className={`section-c1${className ? ` ${className}` : ""}`}>
      {children}
    </section>
  );
}
