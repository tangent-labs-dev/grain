"use client";

import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const stylesByVariant: Record<ButtonVariant, string> = {
  primary:
    "bg-white text-black border-white hover:opacity-95 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.45)]",
  secondary:
    "bg-(--surface-elevated) text-(--foreground) border-(--border) hover:border-[rgba(255,255,255,0.45)]",
  ghost:
    "bg-transparent text-(--foreground) border-(--border) hover:bg-(--surface)",
  danger:
    "bg-transparent text-(--danger) border-(--danger) hover:bg-(--surface)",
};

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`matrix-label inline-flex min-w-0 items-center justify-center rounded-none border px-3 py-2 text-center text-[0.68rem] font-medium leading-none tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-50 min-[420px]:px-4 min-[420px]:text-[0.72rem] min-[420px]:tracking-[0.18em] ${stylesByVariant[variant]} ${className}`}
      {...props}
    />
  );
}
