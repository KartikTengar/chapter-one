import type { ComponentType, HTMLAttributes, ReactNode } from "react";

type TagProps = HTMLAttributes<HTMLElement> & { className?: string; children?: ReactNode };

interface ContainerProps extends HTMLAttributes<HTMLElement> {
  as?: string;
  children: ReactNode;
}

export function Container({ as = "div", className, children, ...rest }: ContainerProps) {
  const Tag = (as || "div") as unknown as ComponentType<TagProps>;
  return (
    <Tag {...(rest as TagProps)} className={`container-c1${className ? ` ${className}` : ""}`}>
      {children}
    </Tag>
  );
}