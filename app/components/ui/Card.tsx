import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", ...props }: CardProps) {
  return (
    <div
      className={`mono-card p-[var(--space-4)] ${className}`}
      {...props}
    />
  );
}
