import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", ...props }: CardProps) {
  return (
    <div
      className={`mono-card p-3 min-[420px]:p-[var(--space-4)] ${className}`}
      {...props}
    />
  );
}
