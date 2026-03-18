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
      className={`matrix-label inline-flex items-center justify-center rounded-none border px-4 py-2 text-[0.72rem] font-medium tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-50 ${stylesByVariant[variant]} ${className}`}
      {...props}
    />
  );
}
